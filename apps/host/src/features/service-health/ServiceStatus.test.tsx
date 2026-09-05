import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryClient } from '../../app/query-client';
import { ServiceStatus } from './ServiceStatus';

let client: QueryClient;

beforeEach(() => {
  client = createQueryClient();
  client.setDefaultOptions({ queries: { ...client.getDefaultOptions().queries, retry: false } });
});

afterEach(() => {
  cleanup();
  client.clear();
  vi.unstubAllGlobals();
});

function renderStatus() {
  return render(
    <QueryClientProvider client={client}>
      <ServiceStatus />
    </QueryClientProvider>,
  );
}

describe('document service status', () => {
  it('shows progress until the response is received', async () => {
    let resolveRequest!: (response: Response) => void;
    const response = new Promise<Response>((resolve) => {
      resolveRequest = resolve;
    });
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(response));
    renderStatus();

    expect(screen.getByRole('status')).toHaveTextContent('Checking document service');

    await act(async () => {
      resolveRequest(Response.json({ status: 'ok' }));
    });
    expect(await screen.findByText('Document service available')).toBeVisible();
  });

  it('lets the user retry a failed request', async () => {
    const user = userEvent.setup();
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ status: 'ok' }));
    vi.stubGlobal('fetch', fetch);
    renderStatus();

    expect(await screen.findByText('Document service unavailable.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Document service available')).toBeVisible();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
