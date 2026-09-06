import { useState } from 'react';
import { useTypedQuery } from '../../../hooks/useTypedQuery';
import { filterDocuments } from '../filter-documents';

export function useDocumentsWorkspace() {
  const query = useTypedQuery('documents');
  const [search, setSearch] = useState('');
  const documents = query.data?.documents ?? [];
  const counts = {
    all: documents.length,
    needsReview: documents.filter((document) => document.status !== 'reviewed').length,
  };
  function resetSearch() {
    setSearch('');
  }
  return {
    query,
    counts,
    search,
    setSearch,
    visibleDocuments: filterDocuments(documents, search),
    nextDocumentId: documents.find((document) => document.status !== 'reviewed')?.id,
    resetSearch,
  };
}
