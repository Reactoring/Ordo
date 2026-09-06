import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UploadedDocument } from '@ordo/contracts';
import { createQueryClient } from '../app/query-client';
import { DocumentsPage } from './DocumentsPage';
import { documentsResponse, exampleDocuments } from '../../../../tests/fixtures/documents';

let client: QueryClient;
let stored: UploadedDocument[];
let uploadHandler: () => Promise<Response>;
const fetch = vi.fn<typeof globalThis.fetch>();
const imported: UploadedDocument = {
  id: 'd'.repeat(64),
  fileName: 'new-invoice.pdf',
  fileType: 'PDF',
  sizeBytes: 2048,
  uploadedAt: '2026-09-06T10:00:00.000Z',
  status: 'uploaded',
};

beforeEach(() => {
  client = createQueryClient();
  client.setQueryDefaults(['api', 'documents'], { retry: false });
  stored = [...exampleDocuments];
  uploadHandler = async () => {
    stored = [...stored, imported];
    return Response.json({ results: [{ document: imported, outcome: 'imported' }] });
  };
  fetch.mockReset().mockImplementation(async (url, options) => {
    if (url === '/api/health') return Response.json({ status: 'ok' });
    if (options?.method === 'POST') return uploadHandler();
    return Response.json(documentsResponse(stored));
  });
  vi.stubGlobal('fetch', fetch);
});
afterEach(() => {
  cleanup();
  client.clear();
  vi.unstubAllGlobals();
});

function renderWorkspace() {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('document workspace', () => {
  it('loads server documents, searches filenames, and recovers from an empty result without type filters', async () => {
    const user = userEvent.setup();
    renderWorkspace();
    expect(await screen.findAllByRole('article')).toHaveLength(3);
    expect(screen.queryByText('Example documents')).not.toBeInTheDocument();
    expect(screen.queryByRole('group', { name: 'Filter documents' })).not.toBeInTheDocument();
    await user.type(screen.getByRole('searchbox'), 'missing');
    expect(screen.getByRole('heading', { name: 'No matching documents' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search documents' }), '  NORTHLINE  ');
    expect(screen.getByRole('article', { name: 'northline-september.pdf' })).toBeVisible();
    expect(
      screen.getByRole('link', { name: 'Open original northline-september.pdf (new tab)' }),
    ).toHaveAttribute('href', `/api/documents/${'a'.repeat(64)}/content`);
    await user.clear(screen.getByRole('searchbox'));
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('imports from an empty workspace, refreshes the collection, and reports duplicates', async () => {
    stored = [];
    let finish: ((response: Response) => void) | undefined;
    uploadHandler = () =>
      new Promise((resolve) => {
        finish = resolve;
      });
    const user = userEvent.setup();
    renderWorkspace();
    expect(await screen.findByRole('heading', { name: 'A clean slate.' })).toBeVisible();
    const file = new File(['pdf'], 'new-invoice.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText('Choose documents'), file);
    expect(await screen.findByRole('button', { name: 'Importing…' })).toBeDisabled();
    await act(async () => {
      stored = [imported];
      finish?.(Response.json({ results: [{ document: imported, outcome: 'imported' }] }));
    });
    expect(await screen.findByText('1 document imported.')).toBeVisible();
    expect(screen.getByRole('article', { name: 'new-invoice.pdf' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'A clean slate.' })).not.toBeInTheDocument();
    uploadHandler = async () =>
      Response.json({ results: [{ document: imported, outcome: 'duplicate' }] });
    await user.upload(screen.getByLabelText('Choose documents'), file);
    expect(await screen.findByText('1 duplicate skipped.')).toBeVisible();
    expect(screen.getAllByRole('article')).toHaveLength(1);
  });

  it('validates selections before sending an upload request', async () => {
    const user = userEvent.setup({ applyAccept: false });
    renderWorkspace();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Add documents' })).toBeEnabled(),
    );
    await user.upload(
      screen.getByLabelText('Choose documents'),
      Array.from(
        { length: 6 },
        (_, index) => new File(['pdf'], `${index}.pdf`, { type: 'application/pdf' }),
      ),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Choose up to 5 documents');
    await user.upload(
      screen.getByLabelText('Choose documents'),
      new File([], 'empty.pdf', { type: 'application/pdf' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('empty.pdf is empty');
    await user.upload(
      screen.getByLabelText('Choose documents'),
      new File(['text'], 'notes.txt', { type: 'text/plain' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent('choose a PDF, PNG or JPEG');
    expect(fetch.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(0);
  });

  it('reports server rejection and accepts a corrected retry', async () => {
    uploadHandler = async () =>
      Response.json(
        { error: { code: 'INVALID_UPLOAD', message: 'The selected PDF is invalid.' } },
        { status: 400 },
      );
    const user = userEvent.setup();
    renderWorkspace();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Add documents' })).toBeEnabled(),
    );
    const file = new File(['pdf'], 'new-invoice.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText('Choose documents'), file);
    expect(await screen.findByRole('alert')).toHaveTextContent('The selected PDF is invalid.');
    expect(screen.getByRole('button', { name: 'Add documents' })).toBeEnabled();
    uploadHandler = async () => {
      stored.push(imported);
      return Response.json({ results: [{ document: imported, outcome: 'imported' }] });
    };
    await user.upload(screen.getByLabelText('Choose documents'), file);
    expect(await screen.findByText('1 document imported.')).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('imports dropped files and clears search so the imported document can be found', async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await screen.findAllByRole('article');
    await user.type(screen.getByRole('searchbox'), 'monogram');
    fireEvent.drop(screen.getByRole('region', { name: 'A place for every invoice.' }), {
      dataTransfer: { files: [new File(['pdf'], 'new-invoice.pdf', { type: 'application/pdf' })] },
    });
    await screen.findByText('1 document imported.');
    expect(screen.getByRole('article', { name: 'new-invoice.pdf' })).toBeVisible();
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getAllByRole('article')).toHaveLength(4);
  });

  it('offers recovery when loading the collection fails', async () => {
    fetch.mockImplementation(async (url) =>
      url === '/api/health' ? Response.json({ status: 'ok' }) : Response.json({}, { status: 503 }),
    );
    const user = userEvent.setup();
    renderWorkspace();
    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t load your documents');
    expect(screen.queryByRole('heading', { name: 'A clean slate.' })).not.toBeInTheDocument();
    fetch.mockImplementation(async (url) =>
      Response.json(url === '/api/health' ? { status: 'ok' } : documentsResponse()),
    );
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findAllByRole('article')).toHaveLength(3);
  });
});
