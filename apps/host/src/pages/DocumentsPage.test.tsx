import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryClient } from '../app/query-client';
import { DocumentsPage } from './DocumentsPage';

let client: QueryClient;

beforeEach(() => {
  client = createQueryClient();
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => Response.json({ status: 'ok' })),
  );
});

afterEach(() => {
  cleanup();
  client.clear();
  vi.unstubAllGlobals();
});

function renderWorkspace() {
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <DocumentsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('documents workspace preview', () => {
  it('combines status and search filters and recovers from an empty result', async () => {
    const user = userEvent.setup();
    renderWorkspace();

    expect(screen.getByText('Example documents')).toBeVisible();
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'Add documents' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add documents' })).toHaveAccessibleDescription(
      'File import is not available yet.',
    );

    await user.click(screen.getByRole('button', { name: 'Needs review 3' }));
    expect(screen.getAllByRole('article')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Needs review 3' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.type(screen.getByRole('searchbox', { name: 'Search documents' }), '  MONOGRAM  ');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('article', { name: 'monogram-invoice.png' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Reviewed 2' }));
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No matching documents' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'All documents 5' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('clears example data and restores it without preserving stale filters', async () => {
    const user = userEvent.setup();
    renderWorkspace();
    await user.type(screen.getByRole('searchbox'), 'Common Ground');
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('article', { name: 'common-ground.pdf' })).toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Clear examples' }));
    expect(screen.getByRole('heading', { name: 'A clean slate.' })).toBeVisible();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    expect(screen.queryByText('Example documents')).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'All documents 0' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'Show examples' }));
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getByText('Example documents')).toBeVisible();
  });
});
