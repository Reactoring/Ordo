export type DocumentFileType = 'PDF' | 'PNG' | 'JPG';
export type DocumentStatus = 'uploaded' | 'needs_review' | 'reviewed';
export type DocumentCurrency = 'EUR' | 'USD' | 'GBP';

export interface UploadedDocument {
  id: string;
  fileName: string;
  fileType: DocumentFileType;
  sizeBytes: number;
  uploadedAt: string;
  status: DocumentStatus;
}

export interface DocumentFields {
  supplier: string | null;
  invoiceNumber: string | null;
  invoiceDate: string | null;
  currency: DocumentCurrency | null;
  subtotalCents: number | null;
  taxCents: number | null;
  totalCents: number | null;
}

export interface DocumentExtraction {
  status: 'pending' | 'extracted' | 'manual' | 'failed';
  message: string | null;
  method?: 'pdf_text' | 'ocr' | 'mixed';
}

export interface DocumentDetails extends UploadedDocument {
  fields: DocumentFields;
  extraction: DocumentExtraction;
  revision: number;
  reviewedAt: string | null;
}

export interface DocumentResponse {
  document: DocumentDetails;
}

export interface ReviewDocumentInput {
  revision: number;
  fields: DocumentFields;
}

export interface UploadLimits {
  maxFiles: number;
  maxFileSizeBytes: number;
}

export interface DocumentsResponse {
  documents: UploadedDocument[];
  uploadLimits: UploadLimits;
}

export interface UploadDocumentsResponse {
  results: {
    document: UploadedDocument;
    outcome: 'imported' | 'duplicate';
  }[];
}

export interface ApiErrorResponse {
  error: { code: string; message: string };
}
