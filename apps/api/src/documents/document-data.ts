import {
  isDocumentDetails,
  type DocumentDetails,
  type DocumentFields,
  type UploadedDocument,
} from '@ordo/contracts';

export function emptyDocumentFields(): DocumentFields {
  return {
    supplier: null,
    invoiceNumber: null,
    invoiceDate: null,
    currency: null,
    subtotalCents: null,
    taxCents: null,
    totalCents: null,
  };
}

export function parseStoredDocument(value: unknown, id: string): DocumentDetails {
  if (!isDocumentDetails(value) || value.id !== id) {
    throw new Error(`Invalid stored document: ${id}`);
  }
  return value;
}

export function documentSummary(document: UploadedDocument): UploadedDocument {
  const { id, fileName, fileType, sizeBytes, uploadedAt, status } = document;
  return { id, fileName, fileType, sizeBytes, uploadedAt, status };
}
