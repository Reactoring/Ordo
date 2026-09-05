import { FilterChip, Icon } from '@ordo/ui';
import type { DocumentFilter } from '../document.types';

interface DocumentToolbarProps {
  filter: DocumentFilter;
  onFilterChange: (filter: DocumentFilter) => void;
  counts: Record<DocumentFilter, number>;
  search: string;
  onSearchChange: (search: string) => void;
}

const filters: { value: DocumentFilter; label: string }[] = [
  { value: 'all', label: 'All documents' },
  { value: 'needs-review', label: 'Needs review' },
  { value: 'reviewed', label: 'Reviewed' },
];

export function DocumentToolbar({
  filter,
  onFilterChange,
  counts,
  search,
  onSearchChange,
}: DocumentToolbarProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div role="group" aria-label="Filter documents" className="flex flex-wrap gap-2">
        {filters.map(({ value, label }) => (
          <FilterChip
            key={value}
            active={filter === value}
            count={counts[value]}
            onClick={() => onFilterChange(value)}
          >
            {label}
          </FilterChip>
        ))}
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
