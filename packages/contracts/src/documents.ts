export type DocumentFileType = 'PDF' | 'PNG' | 'JPG';

export interface UploadedDocument {
  id: string;
  fileName: string;
  fileType: DocumentFileType;
  sizeBytes: number;
  uploadedAt: string;
  status: 'uploaded';
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
