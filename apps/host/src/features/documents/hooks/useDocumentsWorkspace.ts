import { useState } from 'react';
import { exampleDocuments } from '../data/example-documents';
import type { DocumentFilter } from '../document.types';

export function useDocumentsWorkspace() {
  const [showExamples, setShowExamples] = useState(true);
  const [filter, setFilter] = useState<DocumentFilter>('all');
  const [search, setSearch] = useState('');
  const documents = showExamples ? exampleDocuments : [];
  const counts = {
    all: documents.length,
    'needs-review': documents.filter((document) => document.status === 'needs-review').length,
    reviewed: documents.filter((document) => document.status === 'reviewed').length,
  };
  const searchTerm = search.trim().toLowerCase();
  const visibleDocuments = documents.filter((document) => {
    const matchesStatus = filter === 'all' || document.status === filter;
    const matchesSearch = [document.fileName, document.supplier, document.category].some((value) =>
      value.toLowerCase().includes(searchTerm),
    );
    return matchesStatus && matchesSearch;
  });

  function resetFilters() {
    setFilter('all');
    setSearch('');
  }

  function toggleExamples() {
    setShowExamples((current) => !current);
    resetFilters();
  }

  return {
    showExamples,
    counts,
    filter,
    setFilter,
    search,
    setSearch,
    visibleDocuments,
    resetFilters,
    toggleExamples,
  };
}
