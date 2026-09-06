export type { ApiQueries, ServiceHealthResponse } from './api.js';
export type {
  ApiErrorResponse,
  DocumentFileType,
  DocumentStatus,
  DocumentCurrency,
  DocumentFields,
  DocumentExtraction,
  DocumentDetails,
  DocumentResponse,
  ReviewDocumentInput,
  DocumentsResponse,
  UploadedDocument,
  UploadDocumentsResponse,
  UploadLimits,
} from './documents.js';

import type { DocumentDetails, ReviewDocumentInput } from './documents.js';

export type ReviewModuleProps = { onClose: () => void } & (
  | { document?: undefined; originalUrl?: never; onSave?: never }
  | {
      document: DocumentDetails;
      originalUrl: string;
      onSave: (input: ReviewDocumentInput) => Promise<DocumentDetails>;
    }
);
