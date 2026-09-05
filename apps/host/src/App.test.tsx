import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { createQueryClient } from './app/query-client';

let client: QueryClient;
const fetch = vi.fn<typeof globalThis.fetch>();

beforeEach(() => {
  client = createQueryClient();
  fetch.mockReset().mockImplementation(async () => Response.json({ status: 'ok' }));
  vi.stubGlobal('fetch', fetch);
});

afterEach(() => {
  cleanup();
  client.clear();
  vi.unstubAllGlobals();
});

function CurrentPath() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

function renderAt(path: string) {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[path]}>
        <CurrentPath />
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('workspace navigation', () => {
  it('redirects the home URL and navigates through review using the public callback', async () => {
    const user = userEvent.setup();
    renderAt('/');

    expect(await screen.findByRole('heading', { name: 'Documents, in order.' })).toBeVisible();
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/documents');
    expect(await screen.findByText('Document service available')).toBeVisible();

    await user.click(screen.getByRole('link', { name: 'Open review workspace' }));
    expect(await screen.findByRole('heading', { name: 'No document selected' })).toBeVisible();
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/review');

    await user.click(screen.getByRole('button', { name: 'Back to documents' }));
    expect(await screen.findByRole('heading', { name: 'Documents, in order.' })).toBeVisible();
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/documents');
    expect(screen.getByText('Document service available')).toBeVisible();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('opens a direct review URL and returns to documents without requiring previous history', async () => {
    const user = userEvent.setup();
    renderAt('/review');

    expect(await screen.findByRole('heading', { name: 'No document selected' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Back to documents' }));
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/documents');
  });

  it('provides a way back when a URL does not match a page', async () => {
    const user = userEvent.setup();
    renderAt('/missing/deep-link');

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Back to documents' }));
    expect(screen.getByRole('heading', { name: 'Documents, in order.' })).toBeVisible();
  });
});
