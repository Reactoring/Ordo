import { FilterChip, Icon } from '@ordo/ui';
import type { DocumentStatusFilter } from '../filter-documents';

interface DocumentToolbarProps {
  counts: { all: number; needsReview: number; reviewed: number };
  status: DocumentStatusFilter;
  onStatusChange: (status: DocumentStatusFilter) => void;
  search: string;
  onSearchChange: (search: string) => void;
}

export function DocumentToolbar({
  counts,
  status,
  onStatusChange,
  search,
  onSearchChange,
}: DocumentToolbarProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div role="group" aria-label="Filter by review status" className="flex flex-wrap gap-2">
        <FilterChip
          active={status === 'all'}
          count={counts.all}
          onClick={() => onStatusChange('all')}
        >
          All documents
        </FilterChip>
        <FilterChip
          active={status === 'needs_review'}
          count={counts.needsReview}
          onClick={() => onStatusChange('needs_review')}
        >
          Needs review
        </FilterChip>
        <FilterChip
          active={status === 'reviewed'}
          count={counts.reviewed}
          onClick={() => onStatusChange('reviewed')}
        >
          Reviewed
        </FilterChip>
      </div>
      <div role="search" className="relative w-full lg:max-w-xs">
        <label htmlFor="document-search" className="sr-only">
          Search documents
        </label>
        <span className="pointer-events-none absolute top-3 left-3.5 text-plum-500">
          <Icon name="search" />
        </span>
        <input
          id="document-search"
          type="search"
          autoComplete="off"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Find a document…"
          className="min-h-11 w-full rounded-xl border border-line bg-white py-2.5 pr-4 pl-11 text-sm text-ink placeholder:text-muted"
        />
      </div>
    </div>
  );
}
