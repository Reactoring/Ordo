import { Icon } from '@ordo/ui';

interface DocumentToolbarProps {
  count: number;
  search: string;
  onSearchChange: (search: string) => void;
}

export function DocumentToolbar({ count, search, onSearchChange }: DocumentToolbarProps) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <h2 className="flex items-center gap-2 text-sm font-semibold">
        All documents{' '}
        <span className="rounded-full bg-plum-100 px-2 py-0.5 text-xs text-plum-700">{count}</span>
      </h2>
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
