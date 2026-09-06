import { readImageText, type ImageTextReader } from './read-image-text.js';
import { extractionLimits, readPdfDocument } from './read-pdf-text.js';
import { DocumentReadLimitError, type DocumentTextReader } from './document-reader.js';

export function createDocumentTextReader(
  recognize: ImageTextReader = readImageText,
): DocumentTextReader {
  return async ({ bytes, fileType }) => {
    if (fileType === 'PDF') return readPdfDocument(bytes, recognize);
    const text = await recognize(bytes);
    if (text.length > extractionLimits.maxCharacters)
      throw new DocumentReadLimitError(
        'The OCR result contains too much text. Enter the details manually.',
      );
    return { text, method: 'ocr' };
  };
}

export const readDocumentText = createDocumentTextReader();
