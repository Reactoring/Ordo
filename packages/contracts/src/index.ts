export type { ApiQueries, ServiceHealthResponse } from './api.js';
export type {
  ApiErrorResponse,
  DocumentFileType,
  DocumentsResponse,
  UploadedDocument,
  UploadDocumentsResponse,
  UploadLimits,
} from './documents.js';

export interface ReviewModuleProps {
  onClose: () => void;
}
