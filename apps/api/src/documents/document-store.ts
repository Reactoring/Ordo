import type { DocumentDetails, DocumentFileType } from '@ordo/contracts';

export const documentIdPattern = /^[a-f0-9]{64}$/;

export class DocumentConflictError extends Error {
  constructor() {
    super('This document changed in another request. Reopen it before saving again.');
  }
}

export type DocumentChanges = Pick<
  DocumentDetails,
  'fields' | 'extraction' | 'status' | 'reviewedAt'
>;

export interface DocumentFile {
  fileName: string;
  fileType: DocumentFileType;
  bytes: Buffer;
}

export interface DocumentStore {
  list(): Promise<DocumentDetails[]>;
  find(id: string): Promise<DocumentDetails | undefined>;
  import(file: DocumentFile): Promise<{
    document: DocumentDetails;
    outcome: 'imported' | 'duplicate';
  }>;
  readOriginal(id: string): Promise<Buffer>;
  update(
    id: string,
    revision: number,
    changes: DocumentChanges,
  ): Promise<DocumentDetails | undefined>;
}
