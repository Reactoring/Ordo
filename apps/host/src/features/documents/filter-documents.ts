import type { UploadedDocument } from '@ordo/contracts';

export type DocumentStatusFilter = 'all' | 'needs_review' | 'reviewed';

export function filterDocuments(
  documents: readonly UploadedDocument[],
  search: string,
  status: DocumentStatusFilter = 'all',
) {
  const term = search.trim().toLowerCase();
  return documents.filter(
    (document) =>
      document.fileName.toLowerCase().includes(term) &&
      (status === 'all' ||
        (status === 'reviewed' ? document.status === 'reviewed' : document.status !== 'reviewed')),
  );
}
