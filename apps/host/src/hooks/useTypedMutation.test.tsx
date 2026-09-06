import type { PropsWithChildren } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useTypedMutation } from './useTypedMutation';
import { HttpError } from '../api/http';

const client = new QueryClient();
function Wrapper({ children }: PropsWithChildren) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
afterEach(() => {
  cleanup();
  client.clear();
  vi.unstubAllGlobals();
});

describe('typed mutations', () => {
  it('sends multipart data, validates the response, and exposes typed success callbacks', async () => {
    const data = {
      results: [
        {
          outcome: 'imported',
          document: {
            id: 'a'.repeat(64),
            fileName: 'receipt.png',
            fileType: 'PNG',
            sizeBytes: 68,
            uploadedAt: '2026-09-06T10:00:00.000Z',
            status: 'uploaded',
          },
        },
      ],
    };
    const fetch = vi.fn().mockResolvedValue(Response.json(data));
    vi.stubGlobal('fetch', fetch);
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useTypedMutation('uploadDocuments', { onSuccess }), {
      wrapper: Wrapper,
    });
    const file = new File(['image'], 'receipt.png', { type: 'image/png' });
    await act(async () => {
      await result.current.mutateAsync({ files: [file] });
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(data);
    expect(onSuccess).toHaveBeenCalledWith(data, { files: [file] }, undefined, expect.anything());
    expect(fetch).toHaveBeenCalledWith(
      '/api/documents',
      expect.objectContaining({ method: 'POST', body: expect.any(FormData) }),
    );
    const request = fetch.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(request.headers).has('Content-Type')).toBe(false);
  });

  it('rejects malformed responses without invoking success callbacks', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(Response.json({ results: [{ outcome: 'imported', document: {} }] })),
    );
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useTypedMutation('uploadDocuments', { onSuccess }), {
      wrapper: Wrapper,
    });
    await act(async () => {
      await expect(result.current.mutateAsync({ files: [] })).rejects.toThrow(
        'Unexpected document response.',
      );
    });
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('preserves server error messages and does not automatically retry uploads', async () => {
    const fetch = vi
      .fn()
      .mockImplementation(async () =>
        Response.json(
          { error: { code: 'LIMIT_FILE_SIZE', message: 'Each file must be 10 MB or smaller.' } },
          { status: 413 },
        ),
      );
    vi.stubGlobal('fetch', fetch);
    const { result } = renderHook(() => useTypedMutation('uploadDocuments'), { wrapper: Wrapper });
    await act(async () => {
      await expect(result.current.mutateAsync({ files: [] })).rejects.toEqual(
        new HttpError(413, 'Each file must be 10 MB or smaller.'),
      );
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
