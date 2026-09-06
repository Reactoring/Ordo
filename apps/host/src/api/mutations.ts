import type {
  DocumentResponse,
  ReviewDocumentInput,
  UploadDocumentsResponse,
} from '@ordo/contracts';
import { requestJson } from './http';
import { parseDocumentResponse, parseUploadResponse } from './parse-document-response';
import { createTypedMutationOptions, type MutationEndpoints } from './typed-mutation-options';

export interface ApiMutations {
  uploadDocuments: { variables: { files: readonly File[] }; response: UploadDocumentsResponse };
  extractDocument: { variables: { id: string }; response: DocumentResponse };
  reviewDocument: {
    variables: { id: string; input: ReviewDocumentInput };
    response: DocumentResponse;
  };
}

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
