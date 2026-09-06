import type {
  DocumentResponse,
  DocumentsResponse,
  UploadedDocument,
  UploadDocumentsResponse,
} from '@ordo/contracts';

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseDocument(value: unknown): UploadedDocument {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !/^[a-f0-9]{64}$/.test(value.id) ||
    typeof value.fileName !== 'string' ||
    !value.fileName ||
    (value.fileType !== 'PDF' && value.fileType !== 'PNG' && value.fileType !== 'JPG') ||
    typeof value.sizeBytes !== 'number' ||
    !Number.isSafeInteger(value.sizeBytes) ||
    value.sizeBytes <= 0 ||
    typeof value.uploadedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.uploadedAt)) ||
    (value.status !== 'uploaded' && value.status !== 'needs_review' && value.status !== 'reviewed')
  )
    throw new Error('Unexpected document response.');

  return {
    id: value.id,
    fileName: value.fileName,
    fileType: value.fileType,
    sizeBytes: value.sizeBytes,
    uploadedAt: value.uploadedAt,
    status: value.status,
  };
}

export function parseDocumentsResponse(value: unknown): DocumentsResponse {
  if (
    !isRecord(value) ||
    !Array.isArray(value.documents) ||
    !isRecord(value.uploadLimits) ||
    typeof value.uploadLimits.maxFiles !== 'number' ||
    !Number.isSafeInteger(value.uploadLimits.maxFiles) ||
    value.uploadLimits.maxFiles <= 0 ||
    typeof value.uploadLimits.maxFileSizeBytes !== 'number' ||
    !Number.isSafeInteger(value.uploadLimits.maxFileSizeBytes) ||
    value.uploadLimits.maxFileSizeBytes <= 0
  )
    throw new Error('Unexpected document collection response.');
  return {
    documents: value.documents.map(parseDocument),
    uploadLimits: {
      maxFiles: value.uploadLimits.maxFiles,
      maxFileSizeBytes: value.uploadLimits.maxFileSizeBytes,
    },
  };
}

export function parseUploadResponse(value: unknown): UploadDocumentsResponse {
  if (!isRecord(value) || !Array.isArray(value.results) || value.results.length === 0) {
    throw new Error('Unexpected import response.');
  }
  return {
    results: value.results.map((result: unknown) => {
      if (!isRecord(result) || (result.outcome !== 'imported' && result.outcome !== 'duplicate')) {
        throw new Error('Unexpected import result.');
      }
      return { document: parseDocument(result.document), outcome: result.outcome };
    }),
  };
}

function nullableText(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && value.length <= 200);
}

function nullableCents(value: unknown): value is number | null {
  return value === null || (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0);
}

export function parseDocumentResponse(value: unknown): DocumentResponse {
  if (!isRecord(value) || !isRecord(value.document))
    throw new Error('Unexpected document details response.');
  const { fields, extraction, revision, reviewedAt } = value.document;
  const metadata = parseDocument(value.document);
  if (
    !isRecord(fields) ||
    !nullableText(fields.supplier) ||
    !nullableText(fields.invoiceNumber) ||
    !nullableText(fields.invoiceDate) ||
    (fields.currency !== null &&
      fields.currency !== 'EUR' &&
      fields.currency !== 'USD' &&
      fields.currency !== 'GBP') ||
    !nullableCents(fields.subtotalCents) ||
    !nullableCents(fields.taxCents) ||
    !nullableCents(fields.totalCents) ||
    !isRecord(extraction) ||
    (extraction.status !== 'pending' &&
      extraction.status !== 'extracted' &&
      extraction.status !== 'manual' &&
      extraction.status !== 'failed') ||
    (extraction.message !== null && typeof extraction.message !== 'string') ||
    typeof revision !== 'number' ||
    !Number.isSafeInteger(revision) ||
    revision < 0 ||
    (reviewedAt !== null &&
      (typeof reviewedAt !== 'string' || !Number.isFinite(Date.parse(reviewedAt))))
  ) {
    throw new Error('Unexpected document details response.');
  }
  return {
    document: {
      ...metadata,
      revision,
      reviewedAt,
      extraction: { status: extraction.status, message: extraction.message },
      fields: {
        supplier: fields.supplier,
        invoiceNumber: fields.invoiceNumber,
        invoiceDate: fields.invoiceDate,
        currency: fields.currency,
        subtotalCents: fields.subtotalCents,
        taxCents: fields.taxCents,
        totalCents: fields.totalCents,
      },
    },
  };
}
