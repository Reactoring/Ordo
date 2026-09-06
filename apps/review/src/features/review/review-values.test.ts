import { describe, expect, it } from 'vitest';
import { parseCents, toDocumentFields, toFormValues, validateReviewValues } from './review-values';

const fields = {
  supplier: 'Cedar Workspace',
  invoiceNumber: 'INV-42',
  invoiceDate: '2026-09-02',
  currency: 'EUR' as const,
  subtotalCents: 12500,
  taxCents: 2500,
  totalCents: 15000,
};

describe('review form values', () => {
  it('round-trips amounts as integer cents and accepts decimal commas', () => {
    expect(toDocumentFields(toFormValues(fields))).toEqual(fields);
    expect(parseCents('0.29')).toBe(29);
    expect(parseCents('109,80')).toBe(10980);
    expect(parseCents('0')).toBe(0);
    expect(parseCents('12.345')).toBeNull();
    expect(parseCents('1e2')).toBeNull();
    expect(parseCents('-2')).toBeNull();
  });
  it('requires real dates, a currency and consistent totals', () => {
    expect(validateReviewValues(toFormValues(fields))).toEqual({});
    expect(
      validateReviewValues({
        ...toFormValues(fields),
        invoiceDate: '2026-02-30',
        totalCents: '149.99',
        currency: '',
      }),
    ).toHaveProperty('invoiceDate');
    expect(validateReviewValues({ ...toFormValues(fields), totalCents: '149.99' })).toEqual({
      totalCents: 'Subtotal plus tax must equal the total.',
    });
    expect(
      validateReviewValues({ ...toFormValues(fields), taxCents: '0', totalCents: '125' }),
    ).toEqual({});
  });
});
