import type { DocumentSummary } from '../document.types';
import { formatDocumentAmount, formatDocumentDate } from '../format-document';

export function DocumentPreview({ document }: { document: DocumentSummary }) {
  return (
    <div
      aria-hidden="true"
      className="relative h-48 overflow-hidden bg-linear-to-br from-plum-50/70 to-white px-6 pt-5 sm:h-52"
    >
      <span className="absolute top-3 right-3 z-10 rounded-md border border-plum-100 bg-plum-50 px-2 py-1 text-[10px] font-semibold tracking-wide text-plum-700 uppercase">
        {document.category}
      </span>
      <div className="min-h-64 rounded-t-sm border border-line/70 bg-white px-5 py-6 text-[9px] text-ink shadow-paper">
        <div className="flex items-start justify-between gap-3">
          <p className="max-w-36 text-sm leading-tight font-semibold tracking-tight">
            {document.supplier}
          </p>
          <div className="pt-3 text-right text-[8px] leading-4">
            <p className="font-semibold uppercase">Invoice</p>
            <p>{document.reference}</p>
            <p className="text-muted">{formatDocumentDate(document.date)}</p>
          </div>
        </div>
        <div className="mt-5 flex gap-14 leading-4">
          <div>
            <p className="font-semibold">From</p>
            <p className="text-muted">{document.supplier}</p>
          </div>
          <div>
            <p className="font-semibold">Bill to</p>
            <p className="text-muted">Example workspace</p>
          </div>
        </div>
        <div className="mt-5 flex justify-between border-b border-line pb-1.5 font-semibold">
          <span>Description</span>
          <span>Amount</span>
        </div>
        <div className="flex justify-between gap-2 pt-2">
          <span>{document.description}</span>
          <span>{formatDocumentAmount(document)}</span>
        </div>
        <div className="mt-4 flex justify-between border-t border-line pt-2 font-semibold">
          <span>Total</span>
          <span>{formatDocumentAmount(document)}</span>
        </div>
      </div>
    </div>
  );
}
