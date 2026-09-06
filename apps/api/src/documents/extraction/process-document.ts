import type { DocumentExtraction, DocumentFields } from '@ordo/contracts';
import { DocumentConflictError, type DocumentStore } from '../document-store.js';
import { emptyDocumentFields } from '../document-data.js';
import { parseInvoiceText } from './parse-invoice.js';
import { PdfTextLimitError } from './read-pdf-text.js';
import { readDocumentText, type DocumentTextReader } from './read-document-text.js';

export function createDocumentProcessor(
  store: DocumentStore,
  readText: DocumentTextReader = readDocumentText,
) {
  return async function processDocument(id: string) {
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
        error instanceof PdfTextLimitError
          ? { status: 'manual', method: 'ocr', message: error.message }
          : {
              status: 'failed',
              method: current.fileType === 'PDF' ? 'mixed' : 'ocr',
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
  };
}
