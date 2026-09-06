import type { DocumentDetails } from '@ordo/contracts';
import { buttonClassName, Icon } from '@ordo/ui';

export function OriginalDocument({ document, url }: { document: DocumentDetails; url: string }) {
  return (
    <section
      aria-label="Original document"
      className="min-w-0 overflow-hidden rounded-2xl border border-line bg-white lg:sticky lg:top-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
        <span className="text-xs font-semibold text-muted">Original document</span>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClassName({ variant: 'ghost', size: 'sm' })}
        >
          Open original <Icon name="arrowRight" className="size-4" />
          <span className="sr-only">(new tab)</span>
        </a>
      </div>
      <div className="bg-plum-50/50">
        {document.fileType === 'PDF' ? (
          <iframe
            title={`Original ${document.fileName}`}
            src={url}
            className="h-[420px] w-full lg:h-[680px]"
          />
        ) : (
          <img
            src={url}
            alt={`Original ${document.fileName}`}
            className="max-h-[680px] min-h-64 w-full object-contain p-5"
          />
        )}
      </div>
      <p className="px-5 py-3 text-xs leading-5 text-muted">
        If the preview is unavailable, open the original in a new tab.
      </p>
    </section>
  );
}
