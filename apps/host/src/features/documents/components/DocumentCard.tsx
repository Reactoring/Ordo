import { Badge, Icon } from '@ordo/ui';
import type { DocumentSummary } from '../document.types';
import { formatDocumentAmount, formatDocumentDate } from '../format-document';
import { DocumentPreview } from './DocumentPreview';

export function DocumentCard({ document }: { document: DocumentSummary }) {
  const needsReview = document.status === 'needs-review';

  return (
    <article
      aria-labelledby={`document-${document.id}`}
      className="overflow-hidden rounded-2xl border border-line bg-white"
    >
      <DocumentPreview document={document} />
      <div className="border-t border-line px-4 py-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-plum-100 text-plum-600">
            <Icon name="document" />
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id={`document-${document.id}`}
              className="truncate text-sm font-semibold"
              title={document.fileName}
            >
              {document.fileName}
            </h2>
            <p className="mt-1 text-xs text-muted">
              {document.category} <span aria-hidden="true">·</span> {document.fileType}
            </p>
          </div>
          <p className="shrink-0 text-sm font-semibold tabular-nums">
            {formatDocumentAmount(document)}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs">
          <p className="font-medium text-ink">{document.supplier}</p>
          <time dateTime={document.date} className="text-muted">
            {formatDocumentDate(document.date)}
          </time>
        </div>
        <p className="sr-only">Invoice reference: {document.reference}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <Badge tone={needsReview ? 'warning' : 'success'}>
            <Icon name={needsReview ? 'clock' : 'check'} className="size-3.5" />
            {needsReview ? 'Needs review' : 'Reviewed'}
          </Badge>
          {needsReview ? (
            <span className="text-xs text-muted">
              {document.checksRemaining} {document.checksRemaining === 1 ? 'field' : 'fields'} to
              check
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
