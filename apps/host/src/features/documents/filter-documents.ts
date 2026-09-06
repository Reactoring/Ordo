import type { UploadedDocument } from '@ordo/contracts';
import type { DocumentFilter } from './document.types';

export function filterDocuments(
  documents: readonly UploadedDocument[],
  filter: DocumentFilter,
  search: string,
) {
  const term = search.trim().toLowerCase();
  return documents.filter((document) => {
    const matchesType =
      filter === 'all' ||
      (filter === 'PDF' ? document.fileType === 'PDF' : document.fileType !== 'PDF');
    return matchesType && document.fileName.toLowerCase().includes(term);
  });
}
