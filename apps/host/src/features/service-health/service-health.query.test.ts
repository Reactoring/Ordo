import type { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryClient } from '../../app/query-client';
import { serviceHealthQuery } from './service-health.query';

let client: QueryClient;

beforeEach(() => {
  client = createQueryClient();
  client.setDefaultOptions({
    queries: { ...client.getDefaultOptions().queries, retryDelay: 0 },
  });
});

afterEach(() => {
  client.clear();
  vi.unstubAllGlobals();
});

describe('service health queries', () => {
  it('reuses fresh data and fetches again after invalidation', async () => {
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockImplementation(async () => Response.json({ status: 'ok' }));
    vi.stubGlobal('fetch', fetch);

    await client.fetchQuery(serviceHealthQuery);
    expect(await client.fetchQuery(serviceHealthQuery)).toEqual({ status: 'ok' });
    expect(fetch).toHaveBeenCalledTimes(1);

    await client.invalidateQueries({ queryKey: serviceHealthQuery.queryKey });
    await client.fetchQuery(serviceHealthQuery);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each([400, 404])('does not retry an HTTP %i response', async (status) => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status }));
    vi.stubGlobal('fetch', fetch);

    await expect(client.fetchQuery(serviceHealthQuery)).rejects.toMatchObject({ status });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('retries a temporary server error once', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json({ status: 'ok' }));
    vi.stubGlobal('fetch', fetch);

    expect(await client.fetchQuery(serviceHealthQuery)).toEqual({ status: 'ok' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('stops after one retry when the network remains unavailable', async () => {
    const fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetch);

    await expect(client.fetchQuery(serviceHealthQuery)).rejects.toThrow('Failed to fetch');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('rejects an unexpected response shape without caching it as a success', async () => {
    const fetch = vi.fn().mockResolvedValue(Response.json({ status: 'unknown' }));
    vi.stubGlobal('fetch', fetch);

    await expect(client.fetchQuery(serviceHealthQuery)).rejects.toThrow(
      'Unexpected service response',
    );
    expect(client.getQueryData(serviceHealthQuery.queryKey)).toBeUndefined();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid JSON without retrying', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('<html>Unexpected response</html>'));
    vi.stubGlobal('fetch', fetch);

    await expect(client.fetchQuery(serviceHealthQuery)).rejects.toBeInstanceOf(SyntaxError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('aborts the HTTP request when its query is cancelled', async () => {
    let requestSignal: AbortSignal | null | undefined;
    const fetch = vi.fn<typeof globalThis.fetch>((_input, options) => {
      requestSignal = options?.signal;
      return new Promise((_resolve, reject) => {
        requestSignal?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        );
      });
    });
    vi.stubGlobal('fetch', fetch);

    const pending = client.fetchQuery(serviceHealthQuery);
    const rejection = expect(pending).rejects.toThrow();
    await client.cancelQueries({ queryKey: serviceHealthQuery.queryKey });

    await rejection;
    expect(requestSignal?.aborted).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
