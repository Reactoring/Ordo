import { Link } from 'react-router';
import { Icon, buttonClassName } from '@ordo/ui';

export function ReviewSummary({ count }: { count: number }) {
  return (
    <aside
      aria-label="Review overview"
      className="relative flex items-center gap-4 overflow-hidden rounded-2xl border border-plum-100 bg-plum-50 px-5 py-5 sm:px-6"
    >
      <div
        aria-hidden="true"
        className="hidden size-14 shrink-0 -rotate-6 items-center justify-center rounded-lg border border-plum-200 bg-white text-plum-400 shadow-paper sm:flex"
      >
        <Icon name="document" className="size-8" />
      </div>
      <div className="flex-1">
        <h2 className="text-sm font-semibold">
          {count > 0
            ? `${count} ${count === 1 ? 'document' : 'documents'} collected`
            : 'Ready for a fresh start.'}
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted">
          {count > 0
            ? 'Your originals, saved together and ready to open.'
            : 'Collect your invoices, then review the details.'}
        </p>
        <Link
          to="/review"
          aria-label="Open review workspace"
          className={buttonClassName({ variant: 'ghost', size: 'sm', className: 'mt-2' })}
        >
          Open review
          <Icon name="arrowRight" className="size-4" />
        </Link>
      </div>
    </aside>
  );
}
