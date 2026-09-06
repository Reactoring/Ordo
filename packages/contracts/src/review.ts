import type { DocumentDetails, ReviewDocumentInput } from './documents.js';

export interface DocumentReviewProps {
  document: DocumentDetails;
  originalUrl: string;
  onSave: (input: ReviewDocumentInput) => Promise<DocumentDetails>;
  onClose: () => void;
  saveLabel?: string;
  saveHint?: string;
}

export type ReviewModuleProps =
  | { onClose: () => void; document?: undefined; originalUrl?: never; onSave?: never }
  | DocumentReviewProps;
