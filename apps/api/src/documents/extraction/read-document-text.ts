import type { DocumentExtraction, DocumentFileType } from '@ordo/contracts';
import { readImageText, type ImageTextReader } from './read-image-text.js';
import { extractionLimits, readPdfDocument } from './read-pdf-text.js';

export type DocumentTextReader = (file: {
  bytes: Uint8Array;
  fileType: DocumentFileType;
}) => Promise<{ text: string; method: NonNullable<DocumentExtraction['method']> }>;

export function createDocumentTextReader(
  recognize: ImageTextReader = readImageText,
): DocumentTextReader {
  return async ({ bytes, fileType }) => {
    if (fileType === 'PDF') return readPdfDocument(bytes, recognize);
    const text = await recognize(bytes);
    if (text.length > extractionLimits.maxCharacters)
      throw new Error('The OCR result contains too much text.');
    return { text, method: 'ocr' };
  };
}

export const readDocumentText = createDocumentTextReader();
