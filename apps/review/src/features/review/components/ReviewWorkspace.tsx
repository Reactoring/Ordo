import type { DocumentDetails, ReviewDocumentInput } from '@ordo/contracts';
import { Badge, Button, Icon, SelectField, TextField } from '@ordo/ui';
import { useReviewForm } from '../hooks/useReviewForm';
import { OriginalDocument } from './OriginalDocument';

interface ReviewWorkspaceProps {
  document: DocumentDetails;
  originalUrl: string;
  onSave: (input: ReviewDocumentInput) => Promise<DocumentDetails>;
  onClose: () => void;
  saveLabel?: string;
  saveHint?: string;
}

export function ReviewWorkspace({
  document,
  originalUrl,
  onSave,
  onClose,
  saveLabel = 'Save and validate',
  saveHint = 'Your corrections are saved when you validate.',
}: ReviewWorkspaceProps) {
  const form = useReviewForm(document, onSave);
  const { errors, isSubmitting, isDirty } = form.formState;
  const reviewed = form.saved || (document.status === 'reviewed' && !isDirty);
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={onClose} disabled={isSubmitting}>
          <Icon name="arrowRight" className="size-4 rotate-180" /> Back to documents
        </Button>
        <Badge tone={reviewed ? 'success' : 'warning'}>
          <Icon name={reviewed ? 'check' : 'clock'} className="size-3.5" />
          {reviewed ? 'Reviewed' : isDirty ? 'Unsaved changes' : 'Needs review'}
        </Badge>
      </div>
      <div className="mb-7">
        <p className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-plum-600 uppercase">
          Document review
        </p>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">A closer look.</h1>
        <p className="mt-2 truncate text-sm text-muted" title={document.fileName}>
          {document.fileName}
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_1fr]">
        <OriginalDocument document={document} url={originalUrl} />
        <form
          noValidate
          onSubmit={(event) => void form.submit(event)}
          aria-label="Review document"
          className="min-w-0 rounded-2xl border border-line bg-white p-5 sm:p-7"
        >
          <h2 className="text-xl font-semibold tracking-tight">Make the details yours.</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Check each field against the original before you validate.
          </p>
          <div className="mt-5 rounded-xl bg-plum-50 px-4 py-3 text-xs leading-5 text-plum-800">
            {document.extraction.message ?? 'Enter the details from the original document.'}
          </div>
          {form.hasNewerVersion ? (
            <p role="alert" className="mt-4 text-sm text-warning">
              A newer version is available. Reopen this document before saving.
            </p>
          ) : null}
          <fieldset disabled={isSubmitting} className="mt-6 grid gap-4">
            <legend className="sr-only">Document details</legend>
            <TextField
              label="Supplier"
              autoComplete="organization"
              {...form.register('supplier')}
              error={errors.supplier?.message}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Document reference"
                {...form.register('invoiceNumber')}
                error={errors.invoiceNumber?.message}
              />
              <TextField
                label="Document date"
                type="date"
                {...form.register('invoiceDate')}
                error={errors.invoiceDate?.message}
              />
            </div>
            <SelectField
              label="Currency"
              {...form.register('currency')}
              error={errors.currency?.message}
            >
              <option value="">Choose a currency</option>
              <option value="EUR">EUR - Euro</option>
              <option value="USD">USD - US dollar</option>
              <option value="GBP">GBP - Pound sterling</option>
            </SelectField>
            <div className="my-1 h-px bg-line" />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Subtotal (before tax)"
                inputMode="decimal"
                placeholder="0.00"
                {...form.register('subtotalCents')}
                error={errors.subtotalCents?.message}
              />
              <TextField
                label="Tax amount"
                inputMode="decimal"
                placeholder="0.00"
                {...form.register('taxCents')}
                error={errors.taxCents?.message}
              />
            </div>
            <TextField
              label="Total (including tax)"
              inputMode="decimal"
              placeholder="0.00"
              {...form.register('totalCents')}
              error={errors.totalCents?.message}
            />
          </fieldset>
          <p className={`mt-4 text-xs ${form.balanced === false ? 'text-warning' : 'text-muted'}`}>
            {form.balanced === undefined
              ? 'Fill in the amounts to check the total.'
              : form.balanced
                ? 'Subtotal + tax = total. The amounts agree.'
                : 'The amounts do not add up. Check them against the original.'}
          </p>
          {errors.root?.server ? (
            <p role="alert" className="mt-5 rounded-xl bg-warning-soft p-3 text-sm text-warning">
              {errors.root.server.message}
            </p>
          ) : null}
          <div className="mt-6 border-t border-line pt-5">
            <Button
              type="submit"
              disabled={isSubmitting || form.hasNewerVersion}
              className="w-full"
            >
              <Icon name="check" className="size-4" /> {isSubmitting ? 'Saving…' : saveLabel}
            </Button>
            <p role="status" className="mt-3 text-center text-xs leading-5 text-muted">
              {form.saved ? 'Changes saved. This document is reviewed.' : saveHint}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
