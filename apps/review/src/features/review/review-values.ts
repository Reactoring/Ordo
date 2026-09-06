import type { DocumentFields } from '@ordo/contracts';

export type ReviewFormValues = Record<keyof DocumentFields, string>;
export type ReviewFormErrors = Partial<Record<keyof ReviewFormValues, string>>;

export function parseCents(value: string): number | null {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(value.trim())) return null;
  const [whole = '', fraction = ''] = value.trim().replace(',', '.').split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function toFormValues(fields: DocumentFields): ReviewFormValues {
  const amount = (cents: number | null) =>
    cents === null ? '' : `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`;
  return {
    supplier: fields.supplier ?? '',
    invoiceNumber: fields.invoiceNumber ?? '',
    invoiceDate: fields.invoiceDate ?? '',
    currency: fields.currency ?? '',
    subtotalCents: amount(fields.subtotalCents),
    taxCents: amount(fields.taxCents),
    totalCents: amount(fields.totalCents),
  };
}

export function toDocumentFields(values: ReviewFormValues): DocumentFields {
  return {
    supplier: values.supplier.trim() || null,
    invoiceNumber: values.invoiceNumber.trim() || null,
    invoiceDate: values.invoiceDate || null,
    currency:
      values.currency === 'EUR' || values.currency === 'USD' || values.currency === 'GBP'
        ? values.currency
        : null,
    subtotalCents: parseCents(values.subtotalCents),
    taxCents: parseCents(values.taxCents),
    totalCents: parseCents(values.totalCents),
  };
}

export function validateReviewValues(values: ReviewFormValues): ReviewFormErrors {
  const fields = toDocumentFields(values);
  const errors: ReviewFormErrors = {};
  if (!fields.supplier || fields.supplier.length > 200)
    errors.supplier = 'Enter a supplier name (up to 200 characters).';
  if (!fields.invoiceNumber || fields.invoiceNumber.length > 200)
    errors.invoiceNumber = 'Enter a document reference (up to 200 characters).';
  const date = new Date(`${values.invoiceDate}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(values.invoiceDate) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== values.invoiceDate
  )
    errors.invoiceDate = 'Enter a valid document date.';
  if (!fields.currency) errors.currency = 'Choose a currency.';
  for (const key of ['subtotalCents', 'taxCents', 'totalCents'] as const) {
    if (fields[key] === null)
      errors[key] = 'Enter a positive amount or zero, with up to two decimal places.';
  }
  if (
    fields.subtotalCents !== null &&
    fields.taxCents !== null &&
    fields.totalCents !== null &&
    fields.subtotalCents + fields.taxCents !== fields.totalCents
  ) {
    errors.totalCents = 'Subtotal plus tax must equal the total.';
  }
  return errors;
}
