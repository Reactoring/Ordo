import type { UploadedDocument } from '@ordo/contracts';
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
        <p className="mt-3 text-xs text-muted">
          Uploaded{' '}
          <time dateTime={document.uploadedAt}>{formatUploadDate(document.uploadedAt)}</time>
        </p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <Badge>
            <Icon name="check" className="size-3.5" />
            Uploaded
          </Badge>
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
        </div>
      </div>
    </article>
  );
}
