import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export type PdfTextReader = (bytes: Uint8Array) => Promise<string>;
export const extractionLimits = { maxPages: 20, maxCharacters: 100_000 };

export class PdfTextLimitError extends Error {}

export const readPdfText: PdfTextReader = async (bytes) => {
  const loading = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
    disableFontFace: true,
    stopAtErrors: true,
    verbosity: 0,
  });
  try {
    const pdf = await loading.promise;
    if (pdf.numPages > extractionLimits.maxPages)
      throw new PdfTextLimitError(
        'This PDF exceeds the 20-page extraction limit. Enter its details manually.',
      );
    let text = '';
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      try {
        const content = await page.getTextContent();
        let previous: { end: number; y: number } | undefined;
        for (const item of content.items) {
          if (!('str' in item)) continue;
          const x = Number(item.transform[4]);
          const y = Number(item.transform[5]);
          // Keep nearby runs together while separating columns and labelled values.
          if (previous)
            text +=
              Math.abs(y - previous.y) > 2 || x < previous.end - 2 || x - previous.end > 24
                ? '\n'
                : ' ';
          text += item.str;
          previous = { end: x + item.width, y };
          if (item.hasEOL) {
            text += '\n';
            previous = undefined;
          }
          if (text.length > extractionLimits.maxCharacters)
            throw new PdfTextLimitError(
              'This PDF contains too much text for automatic extraction. Enter its details manually.',
            );
        }
        text += '\n';
      } finally {
        page.cleanup();
      }
    }
    return text.trim();
  } finally {
    await loading.destroy();
  }
};
