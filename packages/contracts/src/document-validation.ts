import type {
  DocumentDetails,
  DocumentExtraction,
  DocumentFields,
  UploadedDocument,
  UploadLimits,
} from './documents.js';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function isNullableText(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && value.length <= 200);
}

function isNullableAmount(value: unknown): value is number | null {
  return value === null || isNonNegativeInteger(value);
}

export function isDocumentFields(value: unknown): value is DocumentFields {
  return (
    isRecord(value) &&
    isNullableText(value.supplier) &&
    isNullableText(value.invoiceNumber) &&
    isNullableText(value.invoiceDate) &&
    (value.currency === null ||
      value.currency === 'EUR' ||
      value.currency === 'USD' ||
      value.currency === 'GBP') &&
    isNullableAmount(value.subtotalCents) &&
    isNullableAmount(value.taxCents) &&
    isNullableAmount(value.totalCents)
  );
}

export function isUploadedDocument(value: unknown): value is UploadedDocument {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    /^[a-f0-9]{64}$/.test(value.id) &&
    typeof value.fileName === 'string' &&
    value.fileName.length > 0 &&
    (value.fileType === 'PDF' || value.fileType === 'PNG' || value.fileType === 'JPG') &&
    isNonNegativeInteger(value.sizeBytes) &&
    value.sizeBytes > 0 &&
    isTimestamp(value.uploadedAt) &&
    (value.status === 'uploaded' || value.status === 'needs_review' || value.status === 'reviewed')
  );
}

function isDocumentExtraction(value: unknown): value is DocumentExtraction {
  return (
    isRecord(value) &&
    (value.status === 'pending' ||
      value.status === 'extracted' ||
      value.status === 'manual' ||
      value.status === 'failed') &&
    (value.message === null || typeof value.message === 'string') &&
    (value.method === undefined ||
      value.method === 'pdf_text' ||
      value.method === 'ocr' ||
      value.method === 'mixed')
  );
}

export function isDocumentDetails(value: unknown): value is DocumentDetails {
  return (
    isRecord(value) &&
    isUploadedDocument(value) &&
    isDocumentFields(value.fields) &&
    isDocumentExtraction(value.extraction) &&
    isNonNegativeInteger(value.revision) &&
    (value.reviewedAt === null || isTimestamp(value.reviewedAt))
  );
}

export function isUploadLimits(value: unknown): value is UploadLimits {
  return (
    isRecord(value) &&
    isNonNegativeInteger(value.maxFiles) &&
    value.maxFiles > 0 &&
    isNonNegativeInteger(value.maxFileSizeBytes) &&
    value.maxFileSizeBytes > 0
  );
}
