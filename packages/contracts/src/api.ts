export interface ServiceHealthResponse {
  status: 'ok';
}

export interface ApiQueries {
  documents: { params: undefined; response: DocumentsResponse };
  serviceHealth: {
    params: undefined;
    response: ServiceHealthResponse;
  };
}
import type { DocumentsResponse } from './documents.js';
