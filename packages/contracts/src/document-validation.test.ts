// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { exampleDocumentDetails } from '../../../tests/fixtures/documents.js';
import { isDocumentDetails, isDocumentFields } from './document-validation.js';

describe('document validation', () => {
  it('accepts incomplete extracted fields and completed OCR outcomes without changing them', () => {
    for (const status of ['pending', 'extracted', 'manual', 'failed'] as const) {
      const document = {
        ...exampleDocumentDetails,
        fields: { ...exampleDocumentDetails.fields, supplier: null, totalCents: null },
        extraction: { status, method: 'ocr', message: null },
      };
      const before = structuredClone(document);
      expect(isDocumentDetails(document)).toBe(true);
      expect(document).toEqual(before);
    }
  });

  it('rejects malformed fields at the shared boundary', () => {
    for (const fields of [
      { ...exampleDocumentDetails.fields, supplier: 'x'.repeat(201) },
      { ...exampleDocumentDetails.fields, totalCents: -1 },
      { ...exampleDocumentDetails.fields, taxCents: 1.5 },
      { ...exampleDocumentDetails.fields, subtotalCents: Number.MAX_SAFE_INTEGER + 1 },
      { ...exampleDocumentDetails.fields, totalCents: NaN },
      { ...exampleDocumentDetails.fields, currency: 'XYZ' },
      { ...exampleDocumentDetails.fields, invoiceNumber: undefined },
    ]) {
      expect(isDocumentFields(fields)).toBe(false);
      expect(isDocumentDetails({ ...exampleDocumentDetails, fields })).toBe(false);
    }
  });

  it('rejects invalid metadata, extraction methods, and revisions', () => {
    for (const changes of [
      { id: '../original' },
      { fileType: 'SVG' },
      { sizeBytes: 0 },
      { uploadedAt: 'not a date' },
      { status: 'unknown' },
      { extraction: { status: 'manual', method: 'unknown', message: null } },
      { extraction: { status: 'unknown', message: null } },
      { revision: -1 },
      { reviewedAt: 'not a date' },
    ]) {
      expect(isDocumentDetails({ ...exampleDocumentDetails, ...changes })).toBe(false);
    }
  });
});
