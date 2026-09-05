import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryClient } from '../app/query-client';
import { getTypedQueryOptions } from './endpoints';
import { useTypedQuery } from './use-typed-query';

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

function Wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useTypedQuery', () => {
  it('shares cached endpoint data while select only transforms the observer result', async () => {
    const { result } = renderHook(
      () => useTypedQuery('serviceHealth', undefined, { select: (data) => data.status }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.data).toBe('ok'));
    const options = getTypedQueryOptions('serviceHealth');
    expect(client.getQueryData(options.queryKey)).toEqual({ status: 'ok' });
    await client.fetchQuery(options);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('waits until an explicitly disabled query is enabled', async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useTypedQuery('serviceHealth', undefined, { enabled }),
      { wrapper: Wrapper, initialProps: { enabled: false } },
    );

    expect(fetch).not.toHaveBeenCalled();
    rerender({ enabled: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
