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

export interface ReviewModuleProps {
  onClose: () => void;
}
