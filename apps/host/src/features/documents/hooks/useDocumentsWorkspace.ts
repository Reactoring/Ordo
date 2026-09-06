import { useState } from 'react';
import { useTypedQuery } from '../../../hooks/useTypedQuery';
import type { DocumentFilter } from '../document.types';
import { filterDocuments } from '../filter-documents';

export function useDocumentsWorkspace() {
  const query = useTypedQuery('documents');
  const [filter, setFilter] = useState<DocumentFilter>('all');
  const [search, setSearch] = useState('');
  const documents = query.data?.documents ?? [];
  const counts = {
    all: documents.length,
    PDF: documents.filter((document) => document.fileType === 'PDF').length,
    images: documents.filter((document) => document.fileType !== 'PDF').length,
  };
  function resetFilters() {
    setFilter('all');
    setSearch('');
  }
  return {
    query,
    counts,
    filter,
    setFilter,
    search,
    setSearch,
    visibleDocuments: filterDocuments(documents, filter, search),
    resetFilters,
  };
}
