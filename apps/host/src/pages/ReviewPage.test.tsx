import { StrictMode } from 'react';
import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DocumentDetails, ReviewDocumentInput } from '@ordo/contracts';
import { App } from '../App';
import { createQueryClient } from '../app/query-client';
import { getTypedQueryOptions } from '../api/endpoints';
import { documentsResponse, exampleDocumentDetails } from '../../../../tests/fixtures/documents';

let client: QueryClient;
let stored: DocumentDetails;
const fetch = vi.fn<typeof globalThis.fetch>();
const detailUrl = `/api/documents/${exampleDocumentDetails.id}`;
beforeEach(() => {
  client = createQueryClient();
  client.setQueryDefaults(['api', 'document'], { retry: false });
  stored = structuredClone(exampleDocumentDetails);
  fetch.mockReset().mockImplementation(async (url, options) => {
    if (url === '/api/health') return Response.json({ status: 'ok' });
    if (url === '/api/documents') return Response.json(documentsResponse([stored]));
    if (options?.method === 'PATCH') {
      const input = JSON.parse(String(options.body)) as ReviewDocumentInput;
      stored = {
        ...stored,
        fields: input.fields,
        revision: stored.revision + 1,
        status: 'reviewed',
        reviewedAt: '2026-09-06T12:00:00.000Z',
      };
    }
    if (options?.method === 'POST')
      stored = {
        ...stored,
        status: 'needs_review',
        extraction: exampleDocumentDetails.extraction,
        revision: 1,
      };
    return Response.json({ document: stored });
  });
  vi.stubGlobal('fetch', fetch);
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.unstubAllGlobals();
});

function CurrentLocation() {
  const location = useLocation();
  return (
    <output aria-label="Current URL">
      {location.pathname}
      {location.search}
    </output>
  );
}

function renderReview(path = `/review/${exampleDocumentDetails.id}`) {
  return render(
    <StrictMode>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <CurrentLocation />
          <App />
        </MemoryRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
}

describe('connected review', () => {
  it('retries failed preparation even if a background detail read has also failed', async () => {
    stored = {
      ...stored,
      status: 'uploaded',
      revision: 0,
      extraction: { status: 'pending', message: null },
    };
    let attempts = 0;
    let failReads = false;
    fetch.mockImplementation(async (_url, options) => {
      if (options?.method === 'POST') {
        attempts++;
        return attempts === 1
          ? Response.json({}, { status: 503 })
          : Response.json({ document: exampleDocumentDetails });
      }
      return failReads ? Response.json({}, { status: 503 }) : Response.json({ document: stored });
    });
    const user = userEvent.setup();
    renderReview();
    await screen.findByRole('alert');
    failReads = true;
    await client.invalidateQueries({
      queryKey: getTypedQueryOptions('document', { id: stored.id }).queryKey,
    });
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByLabelText('Supplier')).toHaveValue('Northline Workspace');
    expect(attempts).toBe(2);
  });
  it('saves corrections through the typed endpoint and updates the collection cache', async () => {
    const user = userEvent.setup();
    renderReview();
    expect(await screen.findByLabelText('Supplier')).toHaveValue('Northline Workspace');
    await user.clear(screen.getByLabelText('Supplier'));
    await user.type(screen.getByLabelText('Supplier'), 'Corrected Workspace');
    await user.click(screen.getByRole('button', { name: 'Save and return' }));
    await screen.findByText(`${stored.fileName} is validated and saved in Reviewed.`);
    expect(screen.getByLabelText('Current URL')).toHaveTextContent('/documents?status=reviewed');
    const patch = fetch.mock.calls.find(([, options]) => options?.method === 'PATCH');
    expect(patch?.[0]).toBe(`${detailUrl}/review`);
    expect(patch?.[1]?.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(String(patch?.[1]?.body))).toMatchObject({
      revision: 1,
      fields: { supplier: 'Corrected Workspace', totalCents: 15000 },
    });
    const card = await screen.findByRole('article', { name: stored.fileName });
    expect(within(card).getByText('Reviewed')).toBeVisible();
    expect(screen.getByText('Everything is in order.')).toBeVisible();
    await user.click(within(card).getByRole('link', { name: `Review ${stored.fileName}` }));
    expect(await screen.findByLabelText('Supplier')).toHaveValue('Corrected Workspace');
  });

  it('saves a queue, announces the next document while it loads, and finishes in Reviewed', async () => {
    const second = {
      ...exampleDocumentDetails,
      id: 'b'.repeat(64),
      fileName: 'second-invoice.pdf',
      fields: { ...exampleDocumentDetails.fields, supplier: 'Second Company' },
    };
    const documents: DocumentDetails[] = [
      stored,
      { ...stored, id: 'c'.repeat(64), fileName: 'already-reviewed.pdf', status: 'reviewed' },
      second,
    ];
    let openNext: (() => void) | undefined;
    fetch.mockImplementation(async (url, options) => {
      if (url === '/api/health') return Response.json({ status: 'ok' });
      if (url === '/api/documents') return Response.json(documentsResponse(documents));
      const document = documents.find((item) => String(url).includes(item.id));
      if (!document) return Response.json({}, { status: 404 });
      if (options?.method === 'PATCH') {
        const input = JSON.parse(String(options.body)) as ReviewDocumentInput;
        Object.assign(document, {
          fields: input.fields,
          revision: document.revision + 1,
          status: 'reviewed',
          reviewedAt: '2026-09-06T12:00:00.000Z',
        });
      } else if (document.id === second.id) {
        await new Promise<void>((resolve) => {
          openNext = resolve;
        });
      }
      return Response.json({ document });
    });
    const user = userEvent.setup();
    renderReview(`/review/${stored.id}?mode=queue`);
    expect(await screen.findByText('Review queue · 2 documents remaining')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Save and next' }));
    const message = `${stored.fileName} is validated. You are now reviewing ${second.fileName}.`;
    expect(await screen.findByText(message)).toBeVisible();
    expect(screen.getByText('Preparing your document for review…')).toBeVisible();
    expect(screen.getByText(message).closest('[role="status"]')).toHaveFocus();
    await act(async () => {
      openNext?.();
    });
    expect(await screen.findByLabelText('Supplier')).toHaveValue('Second Company');
    expect(screen.getByText('Review queue · 1 document remaining')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Save and finish' }));
    expect(await screen.findByText('Review complete')).toBeVisible();
    expect(screen.getByLabelText('Current URL')).toHaveTextContent('/documents?status=reviewed');
    expect(await screen.findAllByRole('article')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Reviewed 3' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(fetch.mock.calls.filter(([, options]) => options?.method === 'PATCH')).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Review complete')).not.toBeInTheDocument();
  });

  it('keeps the current document and draft when a queue save fails', async () => {
    const original = fetch.getMockImplementation();
    fetch.mockImplementation(async (url, options) =>
      options?.method === 'PATCH'
        ? Response.json(
            { error: { code: 'SAVE_FAILED', message: 'Please try saving again.' } },
            { status: 503 },
          )
        : original!(url, options),
    );
    const user = userEvent.setup();
    renderReview(`/review/${stored.id}?mode=queue`);
    await screen.findByLabelText('Supplier');
    await user.type(screen.getByLabelText('Supplier'), ' updated');
    await user.click(screen.getByRole('button', { name: 'Save and finish' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Please try saving again.');
    expect(screen.getByLabelText('Supplier')).toHaveValue('Northline Workspace updated');
    expect(screen.getByLabelText('Current URL')).toHaveTextContent(
      `/review/${stored.id}?mode=queue`,
    );
  });

  it('confirms a successful save even if the remaining queue cannot be refreshed', async () => {
    const original = fetch.getMockImplementation();
    client.setQueryDefaults(['api', 'documents'], { retry: false });
    fetch.mockImplementation(async (url, options) =>
      url === '/api/documents' && stored.status === 'reviewed'
        ? Response.json({}, { status: 503 })
        : original!(url, options),
    );
    const user = userEvent.setup();
    renderReview(`/review/${stored.id}?mode=queue`);
    await screen.findByLabelText('Supplier');
    await user.click(screen.getByRole('button', { name: 'Save and finish' }));
    expect(await screen.findByText(/The remaining queue could not be loaded/)).toBeVisible();
    expect(screen.getByLabelText('Current URL')).toHaveTextContent('/documents?status=reviewed');
    const card = screen.getByRole('article', { name: stored.fileName });
    expect(within(card).getByText('Reviewed')).toBeVisible();
  });

  it('prepares earlier imports once when a direct URL is opened in Strict Mode', async () => {
    stored = {
      ...stored,
      status: 'uploaded',
      revision: 0,
      extraction: { status: 'pending', message: null },
    };
    renderReview();
    await screen.findByRole('heading', { name: 'A closer look.' });
    const preparations = fetch.mock.calls.filter(([, options]) => options?.method === 'POST');
    expect(preparations).toHaveLength(1);
    expect(preparations[0]?.[0]).toBe(`${detailUrl}/extract`);
  });

  it('retains the draft when a background refresh fails', async () => {
    const user = userEvent.setup();
    renderReview();
    await screen.findByLabelText('Supplier');
    await user.type(screen.getByLabelText('Supplier'), ' edited');
    fetch.mockImplementation(async () => Response.json({}, { status: 503 }));
    await client.invalidateQueries({
      queryKey: getTypedQueryOptions('document', { id: stored.id }).queryKey,
    });
    await waitFor(() =>
      expect(screen.getByLabelText('Supplier')).toHaveValue('Northline Workspace edited'),
    );
    expect(
      screen.queryByRole('heading', { name: 'We couldn’t open this document' }),
    ).not.toBeInTheDocument();
  });

  it('rejects unknown identifiers without requesting a document', async () => {
    renderReview('/review/invalid-id');
    expect(await screen.findByRole('heading', { name: 'Document not found' })).toBeVisible();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('validates detailed responses and offers recovery from an invalid payload', async () => {
    fetch.mockImplementation(async () =>
      Response.json({ document: { ...stored, fields: { ...stored.fields, totalCents: '15000' } } }),
    );
    const user = userEvent.setup();
    renderReview();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Unexpected document details response.',
    );
    fetch.mockImplementation(async () => Response.json({ document: stored }));
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByLabelText('Supplier')).toHaveValue('Northline Workspace');
  });
});
