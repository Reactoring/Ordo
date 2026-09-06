import type { DocumentsResponse, UploadedDocument } from '../../packages/contracts/src/documents';
export const exampleDocuments: UploadedDocument[] = [
  {
    id: 'a'.repeat(64),
    fileName: 'northline-september.pdf',
    fileType: 'PDF',
    sizeBytes: 20480,
    uploadedAt: '2026-09-05T09:00:00.000Z',
    status: 'uploaded',
  },
  {
    id: 'b'.repeat(64),
    fileName: 'orbit-software.pdf',
    fileType: 'PDF',
    sizeBytes: 10240,
    uploadedAt: '2026-09-03T09:00:00.000Z',
    status: 'uploaded',
  },
  {
    id: 'c'.repeat(64),
    fileName: 'monogram-invoice.png',
    fileType: 'PNG',
    sizeBytes: 81920,
    uploadedAt: '2026-09-04T09:00:00.000Z',
    status: 'uploaded',
  },
];
export function documentsResponse(documents = exampleDocuments): DocumentsResponse {
  return { documents, uploadLimits: { maxFiles: 5, maxFileSizeBytes: 10 * 1024 * 1024 } };
}
