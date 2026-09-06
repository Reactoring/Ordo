import type { UploadedDocument } from '@ordo/contracts';
import { Link } from 'react-router';
import { Badge, Icon, buttonClassName } from '@ordo/ui';
import { documentContentUrl, formatFileSize, formatUploadDate } from '../format-document';
import { DocumentPreview } from './DocumentPreview';

export function DocumentCard({ document }: { document: UploadedDocument }) {
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
              {document.fileType} <span aria-hidden="true">·</span>{' '}
              {formatFileSize(document.sizeBytes)}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-muted">
            Uploaded{' '}
            <time dateTime={document.uploadedAt}>{formatUploadDate(document.uploadedAt)}</time>
          </span>
          <Badge tone={document.status === 'reviewed' ? 'success' : 'warning'}>
            <Icon name={document.status === 'reviewed' ? 'check' : 'clock'} className="size-3.5" />
            {document.status === 'reviewed' ? 'Reviewed' : 'Needs review'}
          </Badge>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <a
            href={documentContentUrl(document.id)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open original ${document.fileName} (new tab)`}
            className={buttonClassName({ variant: 'ghost', size: 'sm' })}
          >
            Open original
            <Icon name="arrowRight" className="size-4" />
          </a>
          <Link
            to={`/review/${document.id}`}
            aria-label={`Review ${document.fileName}`}
            className={buttonClassName({ variant: 'secondary', size: 'sm' })}
          >
            {document.status === 'reviewed' ? 'View details' : 'Review'}
          </Link>
        </div>
      </div>
    </article>
  );
}
