import type { DocumentExtraction, DocumentFileType } from '@ordo/contracts';

export type DocumentTextReader = (file: {
  bytes: Uint8Array;
  fileType: DocumentFileType;
}) => Promise<{ text: string; method: NonNullable<DocumentExtraction['method']> }>;

/** A supported document that exceeds automatic reading limits can still be reviewed manually. */
export class DocumentReadLimitError extends Error {}
