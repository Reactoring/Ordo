import type { DocumentResponse, DocumentsResponse } from './documents.js';

export interface ServiceHealthResponse {
  status: 'ok';
}

export interface ApiQueries {
  documents: { params: undefined; response: DocumentsResponse };
  document: { params: { id: string }; response: DocumentResponse };
  serviceHealth: {
    params: undefined;
    response: ServiceHealthResponse;
  };
}
