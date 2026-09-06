import type { DocumentDetails, DocumentFields, UploadedDocument } from '@ordo/contracts';

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

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nullableString(value: unknown) {
  return value === null || (typeof value === 'string' && value.length <= 200);
}

function nullableAmount(value: unknown) {
  return value === null || (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0);
}

export function isDocumentFields(value: unknown): value is DocumentFields {
  return (
    isRecord(value) &&
    nullableString(value.supplier) &&
    nullableString(value.invoiceNumber) &&
    nullableString(value.invoiceDate) &&
    (value.currency === null ||
      value.currency === 'EUR' ||
      value.currency === 'USD' ||
      value.currency === 'GBP') &&
    nullableAmount(value.subtotalCents) &&
    nullableAmount(value.taxCents) &&
    nullableAmount(value.totalCents)
  );
}

export function parseStoredDocument(value: unknown, id: string): DocumentDetails {
  if (
    !isRecord(value) ||
    value.id !== id ||
    typeof value.fileName !== 'string' ||
    !value.fileName ||
    (value.fileType !== 'PDF' && value.fileType !== 'PNG' && value.fileType !== 'JPG') ||
    typeof value.sizeBytes !== 'number' ||
    !Number.isSafeInteger(value.sizeBytes) ||
    value.sizeBytes <= 0 ||
    typeof value.uploadedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.uploadedAt)) ||
    (value.status !== 'uploaded' && value.status !== 'needs_review' && value.status !== 'reviewed')
  ) {
    throw new Error(`Invalid stored document: ${id}`);
  }
  const metadata: UploadedDocument = {
    id,
    fileName: value.fileName,
    fileType: value.fileType,
    sizeBytes: value.sizeBytes,
    uploadedAt: value.uploadedAt,
    status: value.status,
  };
  // Earlier imports have only metadata. Upgrade them in memory without rewriting originals.
  if (value.status === 'uploaded' && !('fields' in value) && !('revision' in value)) {
    return {
      ...metadata,
      fields: emptyDocumentFields(),
      extraction: { status: 'pending', message: null },
      revision: 0,
      reviewedAt: null,
    };
  }
  if (
    !isDocumentFields(value.fields) ||
    !isRecord(value.extraction) ||
    !['pending', 'extracted', 'manual', 'failed'].includes(String(value.extraction.status)) ||
    (value.extraction.message !== null && typeof value.extraction.message !== 'string') ||
    typeof value.revision !== 'number' ||
    !Number.isSafeInteger(value.revision) ||
    value.revision < 0 ||
    (value.reviewedAt !== null &&
      (typeof value.reviewedAt !== 'string' || !Number.isFinite(Date.parse(value.reviewedAt))))
  ) {
    throw new Error(`Invalid stored document details: ${id}`);
  }
  const status = value.extraction.status;
  const method = value.extraction.method;
  if (method !== undefined && method !== 'pdf_text' && method !== 'ocr' && method !== 'mixed') {
    throw new Error(`Invalid extraction method: ${id}`);
  }
  if (
    status !== 'pending' &&
    status !== 'extracted' &&
    status !== 'manual' &&
    status !== 'failed'
  ) {
    throw new Error(`Invalid extraction status: ${id}`);
  }
  // Give untouched imports from before OCR one opportunity to use the new reader.
  const needsOcr =
    metadata.status === 'needs_review' &&
    status === 'manual' &&
    method === undefined &&
    Object.values(value.fields).every((field) => field === null);
  return {
    ...metadata,
    fields: value.fields,
    revision: value.revision,
    reviewedAt: value.reviewedAt,
    extraction: needsOcr
      ? { status: 'pending', message: null }
      : { status, message: value.extraction.message, ...(method ? { method } : {}) },
  };
}

export function documentSummary(document: UploadedDocument): UploadedDocument {
  const { id, fileName, fileType, sizeBytes, uploadedAt, status } = document;
  return { id, fileName, fileType, sizeBytes, uploadedAt, status };
}
