import {
  isRecord,
  isUploadedDocument,
  isDocumentDetails,
  isUploadLimits,
  type DocumentResponse,
  type DocumentsResponse,
  type UploadedDocument,
  type UploadDocumentsResponse,
} from '@ordo/contracts';

function parseDocument(value: unknown): UploadedDocument {
  if (!isUploadedDocument(value)) throw new Error('Unexpected document response.');

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
  if (!isRecord(value) || !Array.isArray(value.documents) || !isUploadLimits(value.uploadLimits))
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

export function parseDocumentResponse(value: unknown): DocumentResponse {
  if (!isRecord(value) || !isDocumentDetails(value.document))
    throw new Error('Unexpected document details response.');
  const { fields, extraction, revision, reviewedAt } = value.document;
  const metadata = parseDocument(value.document);
  return {
    document: {
      ...metadata,
      revision,
      reviewedAt,
      extraction: {
        status: extraction.status,
        message: extraction.message,
        ...(extraction.method ? { method: extraction.method } : {}),
      },
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
