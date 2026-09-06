// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { exampleDocumentDetails } from '../../../../tests/fixtures/documents.js';
import { parseStoredDocument } from './document-data.js';

describe('stored documents', () => {
  it('rejects metadata belonging to a different document directory', () => {
    expect(() => parseStoredDocument(exampleDocumentDetails, 'b'.repeat(64))).toThrow(
      'Invalid stored document',
    );
  });

  it('preserves saved fields and completed extraction outcomes', () => {
    expect(parseStoredDocument(exampleDocumentDetails, exampleDocumentDetails.id)).toEqual(
      exampleDocumentDetails,
    );
  });
});
