import { useState } from 'react';
import type { UploadedDocument } from '@ordo/contracts';
import { Icon } from '@ordo/ui';
import { documentContentUrl } from '../format-document';

export function DocumentPreview({ document }: { document: UploadedDocument }) {
  const [unavailable, setUnavailable] = useState(false);
  const showImage = document.fileType !== 'PDF' && !unavailable;
  return (
    <div
      aria-hidden="true"
      className="relative flex h-48 items-center justify-center overflow-hidden bg-linear-to-br from-plum-50/70 to-white p-5 sm:h-52"
    >
      <span className="absolute top-3 right-3 z-10 rounded-md border border-plum-100 bg-plum-50 px-2 py-1 text-[10px] font-semibold tracking-wide text-plum-700">
        {document.fileType}
      </span>
      {showImage ? (
        <img
          src={documentContentUrl(document.id)}
          alt=""
          loading="lazy"
          onError={() => setUnavailable(true)}
          className="size-full rounded-sm object-contain"
        />
      ) : (
        <div className="flex h-36 w-28 -rotate-3 flex-col items-center justify-center gap-3 rounded-md border border-line bg-white text-plum-400 shadow-paper">
          <Icon name="document" className="size-12" />
          <span className="text-[10px] font-semibold tracking-[0.15em] uppercase">
            {document.fileType}
          </span>
        </div>
      )}
    </div>
  );
}
