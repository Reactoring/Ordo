import { Button, Icon } from '@ordo/ui';

export function UploadCard() {
  return (
    <section
      aria-labelledby="upload-title"
      className="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-plum-200 bg-plum-50/50 px-6 py-8 text-center"
    >
      <span className="mb-4 flex size-14 items-center justify-center rounded-full border border-plum-200 bg-white/60 text-plum-500">
        <Icon name="upload" className="size-6" />
      </span>
      <h2 id="upload-title" className="text-lg font-semibold tracking-tight">
        A place for every invoice.
      </h2>
      <p className="mt-2 text-sm text-muted">PDF, PNG or JPG · Up to 5 documents</p>
      <Button disabled aria-describedby="upload-availability" className="mt-5">
        <Icon name="plus" className="size-4" />
        Add documents
      </Button>
      <p id="upload-availability" className="mt-3 text-xs text-muted">
        File import is not available yet.
      </p>
    </section>
  );
}
