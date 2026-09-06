import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import type { RenderParameters } from 'pdfjs-dist/types/src/display/api.js';
import type { ImageTextReader } from './read-image-text.js';

export type PdfTextReader = (bytes: Uint8Array) => Promise<string>;
export const extractionLimits = { maxPages: 20, maxOcrPages: 5, maxCharacters: 100_000 };
const pdfRoot = path.dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json'));

export class PdfTextLimitError extends Error {}

export async function readPdfDocument(bytes: Uint8Array, recognize?: ImageTextReader) {
  const loading = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
    disableFontFace: true,
    stopAtErrors: true,
    verbosity: 0,
    cMapUrl: `${path.join(pdfRoot, 'cmaps')}/`,
    cMapPacked: true,
    standardFontDataUrl: `${path.join(pdfRoot, 'standard_fonts')}/`,
    wasmUrl: `${path.join(pdfRoot, 'wasm')}/`,
  });
  try {
    const pdf = await loading.promise;
    if (pdf.numPages > extractionLimits.maxPages)
      throw new PdfTextLimitError(
        'This PDF exceeds the 20-page extraction limit. Enter its details manually.',
      );
    let text = '';
    let ocrPages = 0;
    let textPages = 0;
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = await pdf.getPage(number);
      try {
        const content = await page.getTextContent();
        let pageText = '';
        let previous: { end: number; y: number } | undefined;
        for (const item of content.items) {
          if (!('str' in item)) continue;
          const x = Number(item.transform[4]);
          const y = Number(item.transform[5]);
          // Keep nearby runs together while separating columns and labelled values.
          if (previous)
            pageText +=
              Math.abs(y - previous.y) > 2 || x < previous.end - 2 || x - previous.end > 24
                ? '\n'
                : ' ';
          pageText += item.str;
          previous = { end: x + item.width, y };
          if (item.hasEOL) {
            pageText += '\n';
            previous = undefined;
          }
          if (text.length + pageText.length > extractionLimits.maxCharacters)
            throw new PdfTextLimitError(
              'This PDF contains too much text for automatic extraction. Enter its details manually.',
            );
        }
        if (recognize && pageText.replace(/\s/g, '').length < 40) {
          if (++ocrPages > extractionLimits.maxOcrPages)
            throw new PdfTextLimitError(
              'This PDF exceeds the five scanned-page OCR limit. Enter its details manually.',
            );
          const original = page.getViewport({ scale: 1 });
          const scale = Math.min(
            2,
            2400 / Math.max(original.width, original.height),
            Math.sqrt(4_000_000 / (original.width * original.height)),
          );
          const viewport = page.getViewport({ scale });
          const canvas = createCanvas(
            Math.max(1, Math.ceil(viewport.width)),
            Math.max(1, Math.ceil(viewport.height)),
          );
          try {
            // PDF.js accepts the native canvas API; its public types describe browser canvases.
            await page.render({
              canvas: null,
              canvasContext: canvas.getContext(
                '2d',
              ) as unknown as RenderParameters['canvasContext'],
              viewport,
            }).promise;
            pageText = (await recognize(canvas.toBuffer('image/png'))) || pageText;
          } finally {
            canvas.width = 1;
            canvas.height = 1;
          }
        } else if (pageText.trim()) textPages++;
        text += `${pageText}\n`;
        if (text.length > extractionLimits.maxCharacters)
          throw new PdfTextLimitError(
            'This PDF contains too much text for automatic extraction. Enter its details manually.',
          );
      } finally {
        page.cleanup();
      }
    }
    return {
      text: text.trim(),
      method: ocrPages
        ? textPages
          ? ('mixed' as const)
          : ('ocr' as const)
        : ('pdf_text' as const),
    };
  } finally {
    await loading.destroy();
  }
}

export const readPdfText: PdfTextReader = async (bytes) => (await readPdfDocument(bytes)).text;
