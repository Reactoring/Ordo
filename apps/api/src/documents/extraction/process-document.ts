import type { DocumentDetails, DocumentExtraction, DocumentFields } from '@ordo/contracts';
import { DocumentConflictError, type DocumentStore } from '../document-store.js';
import { emptyDocumentFields } from '../document-data.js';
import { parseInvoiceText } from './parse-invoice.js';
import { DocumentReadLimitError, type DocumentTextReader } from './document-reader.js';

export function createDocumentProcessor(store: DocumentStore, readText: DocumentTextReader) {
  const pending = new Map<string, Promise<DocumentDetails | undefined>>();
  async function extract(id: string) {
    const current = await store.find(id);
    if (!current || current.extraction.status !== 'pending' || current.status === 'reviewed')
      return current;
    let fields: DocumentFields = emptyDocumentFields();
    let extraction: DocumentExtraction;
    // Storage errors must remain request failures; only parsing errors allow manual review.
    const original = await store.readOriginal(id);
    try {
      const { text, method } = await readText({ bytes: original, fileType: current.fileType });
      if (text.trim()) {
        fields = parseInvoiceText(text);
        extraction = {
          status: 'extracted',
          method,
          message:
            method === 'pdf_text'
              ? 'Check the suggested values against the original. Missing fields need your input.'
              : 'Read with OCR. Check each value against the original; unclear fields may need correction.',
        };
      } else {
        extraction = {
          status: 'manual',
          method,
          message: 'No readable text was found. Enter the details from the original.',
        };
      }
    } catch (error) {
      extraction =
        error instanceof DocumentReadLimitError
          ? { status: 'manual', message: error.message }
          : {
              status: 'failed',
              message:
                'Automatic reading could not be completed. The original is saved; enter its details manually.',
            };
    }
    try {
      return await store.update(id, current.revision, {
        fields,
        extraction,
        status: 'needs_review',
        reviewedAt: null,
      });
    } catch (error) {
      // A concurrent extraction or review wins; never replace newer user data.
      if (error instanceof DocumentConflictError) return store.find(id);
      throw error;
    }
  }
  return function processDocument(id: string) {
    const existing = pending.get(id);
    if (existing) return existing;
    // Requests for the same pending document share one reader job and one stored result.
    const operation = extract(id).finally(() => pending.delete(id));
    pending.set(id, operation);
    return operation;
  };
}
