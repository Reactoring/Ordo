export type { ServiceHealthResponse } from './api.js';
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

export type { DocumentReviewProps, ReviewModuleProps } from './review.js';

export {
  isRecord,
  isDocumentFields,
  isUploadedDocument,
  isDocumentDetails,
  isUploadLimits,
} from './document-validation.js';
