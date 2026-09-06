// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { exampleDocumentDetails } from '../../../../tests/fixtures/documents.js';
import { emptyDocumentFields, parseStoredDocument } from './document-data.js';

describe('stored extraction upgrades', () => {
  const previous = {
    ...exampleDocumentDetails,
    fields: emptyDocumentFields(),
    extraction: {
      status: 'manual',
      message: 'Image OCR is not available yet. Enter the details from the original.',
    },
  };
  it('offers OCR once to untouched imports that previously required manual entry', () => {
    expect(parseStoredDocument(previous, previous.id)).toMatchObject({
      extraction: { status: 'pending' },
      revision: previous.revision,
    });
  });
  it('preserves reviewed documents and partially entered fields', () => {
    for (const document of [
      { ...previous, status: 'reviewed' },
      { ...previous, fields: { ...previous.fields, supplier: 'Entered supplier' } },
    ])
      expect(parseStoredDocument(document, document.id).extraction.status).toBe('manual');
  });
  it('preserves completed OCR outcomes, including blank images, across reads', () => {
    const document = { ...previous, extraction: { ...previous.extraction, method: 'ocr' } };
    expect(parseStoredDocument(document, document.id)).toEqual(document);
    expect(() =>
      parseStoredDocument(
        { ...document, extraction: { ...document.extraction, method: 'unknown' } },
        document.id,
      ),
    ).toThrow('Invalid extraction method');
  });
});
