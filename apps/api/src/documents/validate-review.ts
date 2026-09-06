import type { ReviewDocumentInput } from '@ordo/contracts';
import { isDocumentFields, isRecord } from './document-data.js';

export class ReviewValidationError extends Error {}

export function validateReviewInput(value: unknown): ReviewDocumentInput {
  if (
    !isRecord(value) ||
    typeof value.revision !== 'number' ||
    !Number.isSafeInteger(value.revision) ||
    value.revision < 0 ||
    !isDocumentFields(value.fields)
  ) {
    throw new ReviewValidationError('Provide a document revision and valid review fields.');
  }
  const { supplier, invoiceNumber, invoiceDate, currency, subtotalCents, taxCents, totalCents } =
    value.fields;
  if (!supplier?.trim() || !invoiceNumber?.trim())
    throw new ReviewValidationError('Supplier and document reference are required.');
  const date = new Date(`${invoiceDate}T00:00:00.000Z`);
  if (
    !invoiceDate ||
    !/^\d{4}-\d{2}-\d{2}$/.test(invoiceDate) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== invoiceDate
  ) {
    throw new ReviewValidationError('Enter a valid document date.');
  }
  if (!currency) throw new ReviewValidationError('Choose EUR, USD or GBP as the currency.');
  if (subtotalCents === null || taxCents === null || totalCents === null)
    throw new ReviewValidationError('Subtotal, tax and total are required in integer cents.');
  if (!Number.isSafeInteger(subtotalCents + taxCents) || subtotalCents + taxCents !== totalCents)
    throw new ReviewValidationError('Subtotal plus tax must equal the total.');
  return {
    revision: value.revision,
    fields: {
      supplier: supplier.trim(),
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate,
      currency,
      subtotalCents,
      taxCents,
      totalCents,
    },
  };
}
