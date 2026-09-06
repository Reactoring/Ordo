import type { UploadedDocument } from '@ordo/contracts';

export function filterDocuments(documents: readonly UploadedDocument[], search: string) {
  const term = search.trim().toLowerCase();
  return documents.filter((document) => document.fileName.toLowerCase().includes(term));
}
