import { useId, useRef, useState } from 'react';
import type { UploadLimits } from '@ordo/contracts';
import { Button, Icon } from '@ordo/ui';

interface UploadCardProps {
  limits: UploadLimits | undefined;
  isPending: boolean;
  error: string | undefined;
  summary: string | undefined;
  onFilesSelected: (files: File[]) => Promise<void>;
}
export function UploadCard({
  limits,
  isPending,
  error,
  summary,
  onFilesSelected,
}: UploadCardProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const disabled = isPending || !limits;
  return (
    <section
      aria-labelledby={`${id}-title`}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = disabled ? 'none' : 'copy';
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled && event.dataTransfer.types.includes('Files')) {
          dragDepth.current++;
          setIsDragging(true);
        }
      }}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (!dragDepth.current) setIsDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        dragDepth.current = 0;
        setIsDragging(false);
        if (!disabled) void onFilesSelected(Array.from(event.dataTransfer.files));
      }}
      className={`flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-8 text-center transition-colors motion-reduce:transition-none ${isDragging ? 'border-plum-500 bg-plum-100' : 'border-plum-200 bg-plum-50/50'}`}
    >
      <span className="mb-4 flex size-14 items-center justify-center rounded-full border border-plum-200 bg-white/60 text-plum-500">
        <Icon name="upload" className="size-6" />
      </span>
      <h2 id={`${id}-title`} className="text-lg font-semibold tracking-tight">
        A place for every invoice.
      </h2>
      <p id={`${id}-limits`} className="mt-2 text-sm text-muted">
        {limits ? `PDF, PNG or JPG · Up to ${limits.maxFiles} documents` : 'PDF, PNG or JPG'}
      </p>
      <input
        ref={input}
        type="file"
        hidden
        multiple
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        aria-label="Choose documents"
        disabled={disabled}
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);
          event.currentTarget.value = '';
          if (files.length) void onFilesSelected(files);
        }}
      />
      <Button
        disabled={disabled}
        aria-describedby={`${id}-limits ${id}-hint`}
        className="mt-5"
        onClick={() => input.current?.click()}
      >
        <Icon name="plus" className="size-4" />
        {isPending ? 'Importing…' : 'Add documents'}
      </Button>
      <p id={`${id}-hint`} className="mt-3 text-xs text-muted">
        {limits
          ? `Or drop files here · ${limits.maxFileSizeBytes / 1024 / 1024} MB per file`
          : 'Connecting to the document service…'}
      </p>
      {error ? (
        <p role="alert" className="mt-3 max-w-sm text-sm text-warning">
          {error}
        </p>
      ) : null}
      <p role="status" className="mt-3 max-w-sm text-sm text-plum-700">
        {isPending
          ? 'Saving and reading your documents. Scans may take a little longer…'
          : (summary ?? '')}
      </p>
    </section>
  );
}
