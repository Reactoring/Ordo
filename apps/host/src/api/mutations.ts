import type { ApiMutations } from './schema';
import { requestJson } from './http';
import { parseDocumentResponse, parseUploadResponse } from './parse-document-response';
import { createTypedMutationOptions, type MutationEndpoints } from './typed-mutation-options';

const mutations: MutationEndpoints<ApiMutations> = {
  extractDocument: {
    execute: ({ id }) =>
      requestJson(`/api/documents/${encodeURIComponent(id)}/extract`, { method: 'POST' }),
    parse: parseDocumentResponse,
  },
  reviewDocument: {
    execute: ({ id, input }) =>
      requestJson(`/api/documents/${encodeURIComponent(id)}/review`, {
        method: 'PATCH',
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
      }),
    parse: parseDocumentResponse,
  },
  uploadDocuments: {
    execute: ({ files }) => {
      const body = new FormData();
      for (const file of files) body.append('files', file);
      return requestJson('/api/documents', { method: 'POST', body });
    },
    parse: parseUploadResponse,
  },
};

export const getTypedMutationOptions = createTypedMutationOptions<ApiMutations>(mutations);
