import type {
  DocumentResponse,
  DocumentsResponse,
  ReviewDocumentInput,
  ServiceHealthResponse,
  UploadDocumentsResponse,
} from '@ordo/contracts';

export interface ApiQueries {
  documents: { params: undefined; response: DocumentsResponse };
  document: { params: { id: string }; response: DocumentResponse };
  serviceHealth: { params: undefined; response: ServiceHealthResponse };
}

export interface ApiMutations {
  uploadDocuments: { variables: { files: readonly File[] }; response: UploadDocumentsResponse };
  extractDocument: { variables: { id: string }; response: DocumentResponse };
  reviewDocument: {
    variables: { id: string; input: ReviewDocumentInput };
    response: DocumentResponse;
  };
}
