import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTypedQuery } from '../../../hooks/useTypedQuery';
import { filterDocuments, type DocumentStatusFilter } from '../filter-documents';

export function useDocumentsWorkspace() {
  const query = useTypedQuery('documents');
  const [search, setSearch] = useState('');
  const [params, setParams] = useSearchParams();
  const requestedStatus = params.get('status');
  const status: DocumentStatusFilter =
    requestedStatus === 'reviewed' || requestedStatus === 'needs_review' ? requestedStatus : 'all';
  const documents = query.data?.documents ?? [];
  const counts = {
    all: documents.length,
    needsReview: documents.filter((document) => document.status !== 'reviewed').length,
    reviewed: documents.filter((document) => document.status === 'reviewed').length,
  };
  function resetSearch() {
    setSearch('');
  }
  function setStatus(next: DocumentStatusFilter) {
    setParams((current) => {
      const updated = new URLSearchParams(current);
      if (next === 'all') updated.delete('status');
      else updated.set('status', next);
      return updated;
    });
  }
  function resetFilters() {
    resetSearch();
    setStatus('all');
  }
  return {
    query,
    counts,
    search,
    setSearch,
    status,
    setStatus,
    visibleDocuments: filterDocuments(documents, search, status),
    nextDocumentId: documents.find((document) => document.status !== 'reviewed')?.id,
    resetSearch,
    resetFilters,
  };
}
