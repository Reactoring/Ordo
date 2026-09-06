import type { DocumentsResponse, UploadedDocument, UploadDocumentsResponse } from '@ordo/contracts';

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
    value.status !== 'uploaded'
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
