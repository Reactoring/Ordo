import type { ApiQueries } from './schema';
import { createTypedQueryOptions, type QueryEndpoints } from './typed-query-options';
import { parseDocumentResponse, parseDocumentsResponse } from './parse-document-response';

const endpoints: QueryEndpoints<ApiQueries> = {
  documents: { url: () => '/api/documents', parse: parseDocumentsResponse },
  document: {
    url: ({ id }) => `/api/documents/${encodeURIComponent(id)}`,
    parse: parseDocumentResponse,
  },
  serviceHealth: {
    url: () => '/api/health',
    parse: (data) => {
      if (
        typeof data !== 'object' ||
        data === null ||
        !('status' in data) ||
        data.status !== 'ok'
      ) {
        throw new Error('Unexpected service response.');
      }
      return { status: data.status };
    },
  },
};

export const getTypedQueryOptions = createTypedQueryOptions<ApiQueries>(endpoints);
