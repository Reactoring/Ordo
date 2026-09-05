import type { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createQueryClient } from '../app/query-client';
import { createTypedQueryOptions, type QueryEndpoints } from './typed-query-options';

interface TestQueries {
  document: { params: { id: string }; response: { id: string } };
  documents: { params: { page: number; limit: number }; response: { total: number } };
}

const endpoints: QueryEndpoints<TestQueries> = {
  document: {
    url: ({ id }) => `/api/documents/${encodeURIComponent(id)}`,
    parse: (data) => {
      if (
        typeof data !== 'object' ||
        data === null ||
        !('id' in data) ||
        typeof data.id !== 'string'
      ) {
        throw new Error('Invalid document response.');
      }
      return { id: data.id };
    },
  },
  documents: {
    url: ({ page, limit }) =>
      `/api/documents?${new URLSearchParams({ page: String(page), limit: String(limit) })}`,
    parse: (data) => {
      if (
        typeof data !== 'object' ||
        data === null ||
        !('total' in data) ||
        typeof data.total !== 'number'
      ) {
        throw new Error('Invalid document list response.');
      }
      return { total: data.total };
    },
  },
};

const optionsFor = createTypedQueryOptions<TestQueries>(endpoints);
let client: QueryClient;

beforeEach(() => {
  client = createQueryClient();
});
afterEach(() => {
  client.clear();
  vi.unstubAllGlobals();
});

describe('typed endpoint queries', () => {
  it('reuses equal parameters and separates pages in the cache', async () => {
    const fetch = vi.fn().mockImplementation(async () => Response.json({ total: 12 }));
    vi.stubGlobal('fetch', fetch);

    await client.fetchQuery(optionsFor('documents', { page: 1, limit: 5 }));
    await client.fetchQuery(optionsFor('documents', { limit: 5, page: 1 }));
    expect(fetch).toHaveBeenCalledTimes(1);

    await client.fetchQuery(optionsFor('documents', { page: 2, limit: 5 }));
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith('/api/documents?page=2&limit=5', expect.any(Object));
  });

  it('uses the endpoint URL builder and keeps different endpoint caches separate', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ id: 'receipt/42' }))
      .mockResolvedValueOnce(Response.json({ total: 1 }));
    vi.stubGlobal('fetch', fetch);

    const document = optionsFor('document', { id: 'receipt/42' });
    await client.fetchQuery(document);
    await client.fetchQuery(optionsFor('documents', { page: 1, limit: 5 }));

    expect(fetch).toHaveBeenNthCalledWith(1, '/api/documents/receipt%2F42', expect.any(Object));
    expect(client.getQueryData(document.queryKey)).toEqual({ id: 'receipt/42' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
