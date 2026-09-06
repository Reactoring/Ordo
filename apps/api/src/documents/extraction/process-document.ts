import type { DocumentExtraction, DocumentFields } from '@ordo/contracts';
import { DocumentConflictError, type DocumentStore } from '../document-store.js';
import { emptyDocumentFields } from '../document-data.js';
import { parseInvoiceText } from './parse-invoice.js';
import { PdfTextLimitError, readPdfText, type PdfTextReader } from './read-pdf-text.js';

export function createDocumentProcessor(
  store: DocumentStore,
  readText: PdfTextReader = readPdfText,
) {
  return async function processDocument(id: string) {
    const current = await store.find(id);
    if (!current || current.extraction.status !== 'pending' || current.status === 'reviewed')
      return current;
    let fields: DocumentFields = emptyDocumentFields();
    let extraction: DocumentExtraction = {
      status: 'manual',
      message: 'Image OCR is not available yet. Enter the details from the original.',
    };
    if (current.fileType === 'PDF') {
      // Storage errors must remain request failures; only parsing errors allow manual review.
      const original = await store.readOriginal(id);
      try {
        const text = await readText(original);
        if (text.trim()) {
          fields = parseInvoiceText(text);
          extraction = {
            status: 'extracted',
            message:
              'Check the suggested values against the original. Missing fields need your input.',
          };
        } else {
          extraction = {
            status: 'manual',
            message:
              'No embedded text was found. Scanned PDF OCR is not available yet; enter the details manually.',
          };
        }
      } catch (error) {
        extraction =
          error instanceof PdfTextLimitError
            ? { status: 'manual', message: error.message }
            : {
                status: 'failed',
                message:
                  'Text could not be read from this PDF. The original is saved; enter its details manually.',
              };
      }
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
