import type { DocumentFileType, UploadedDocument } from '@ordo/contracts';

export const documentIdPattern = /^[a-f0-9]{64}$/;

export interface DocumentFile {
  fileName: string;
  fileType: DocumentFileType;
  bytes: Buffer;
}

export interface DocumentStore {
  list(): Promise<UploadedDocument[]>;
  find(id: string): Promise<UploadedDocument | undefined>;
  import(file: DocumentFile): Promise<{
    document: UploadedDocument;
    outcome: 'imported' | 'duplicate';
  }>;
  readOriginal(id: string): Promise<Buffer>;
}
