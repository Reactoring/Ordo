import type { UploadDocumentsResponse } from '@ordo/contracts';
import { requestJson } from './http';
import { parseUploadResponse } from './parse-document-response';
import { createTypedMutationOptions, type MutationEndpoints } from './typed-mutation-options';

export interface ApiMutations {
  uploadDocuments: { variables: { files: readonly File[] }; response: UploadDocumentsResponse };
}

const mutations: MutationEndpoints<ApiMutations> = {
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
