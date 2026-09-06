// @vitest-environment node
import { readFile } from 'node:fs/promises';
import { createCanvas } from '@napi-rs/canvas';
import { imageSize } from 'image-size';
import { describe, expect, it, vi } from 'vitest';
import { createTextPdf } from '../../../../../tests/fixtures/create-pdf.js';
import { createScannedPdf } from '../../../../../tests/fixtures/create-scanned-pdf.js';
import { createDocumentTextReader, readDocumentText } from './read-document-text.js';
import { createImageTextReader, type ImageTextReader } from './read-image-text.js';
import { parseInvoiceText } from './parse-invoice.js';

const receipt = await readFile(
  new URL('../../../../../tests/fixtures/ocr-receipt.jpg', import.meta.url),
);
const size = imageSize(receipt);
const expected = {
  supplier: 'PAPER CORNER',
  invoiceNumber: 'RCPT-2026-0401',
  invoiceDate: '2026-09-04',
  currency: 'EUR',
  subtotalCents: 1260,
  taxCents: 252,
  totalCents: 1512,
};

describe('local document reading', () => {
  it('reads a real receipt with installed OCR models and reunites amount columns', async () => {
    const result = await readDocumentText({ bytes: receipt, fileType: 'JPG' });
    expect(result.method).toBe('ocr');
    expect(parseInvoiceText(result.text)).toEqual(expected);
  }, 20_000);

  it('renders and reads a scanned PDF with no embedded text', async () => {
    const bytes = createScannedPdf(receipt, size.width, size.height);
    const result = await readDocumentText({ bytes, fileType: 'PDF' });
    expect(result.method).toBe('ocr');
    expect(parseInvoiceText(result.text)).toEqual(expected);
  }, 20_000);

  it('keeps text PDFs on the fast path and reads only the scanned pages of a mixed PDF', async () => {
    const recognize = vi.fn<ImageTextReader>(async () => 'Recognized receipt');
    const read = createDocumentTextReader(recognize);
    const text = 'Supplier: Company with embedded invoice text here';
    expect((await read({ bytes: createTextPdf([text]), fileType: 'PDF' })).method).toBe('pdf_text');
    expect(recognize).not.toHaveBeenCalled();
    const result = await read({
      bytes: createScannedPdf(receipt, size.width, size.height, { textPage: text }),
      fileType: 'PDF',
    });
    expect(result).toMatchObject({ method: 'mixed' });
    expect(result.text).toContain(text);
    expect(result.text).toContain('Recognized receipt');
    expect(recognize).toHaveBeenCalledTimes(1);
    expect(imageSize(recognize.mock.calls[0]?.[0] ?? new Uint8Array()).type).toBe('png');
  });

  it('bounds scanned pages and skips oversized PDF collections before rendering', async () => {
    const recognize = vi.fn(async () => '');
    const read = createDocumentTextReader(recognize);
    await expect(
      read({
        bytes: createScannedPdf(receipt, size.width, size.height, { copies: 6 }),
        fileType: 'PDF',
      }),
    ).rejects.toThrow('five scanned-page');
    expect(recognize).toHaveBeenCalledTimes(5);
    recognize.mockClear();
    await expect(
      read({
        bytes: createScannedPdf(receipt, size.width, size.height, { copies: 21 }),
        fileType: 'PDF',
      }),
    ).rejects.toThrow('20-page');
    expect(recognize).not.toHaveBeenCalled();
  });

  it('terminates timed-out workers and lets subsequent jobs complete', async () => {
    const read = createImageTextReader({ timeoutMs: 1 });
    await expect(read(receipt)).rejects.toThrow('too long');
    expect(await read(createCanvas(1, 1).toBuffer('image/png'))).toBe('');
  });

  it('rejects excessive image dimensions before decoding', async () => {
    const bytes = createCanvas(1, 1).toBuffer('image/png');
    bytes.writeUInt32BE(100_000, 16);
    bytes.writeUInt32BE(100_000, 20);
    await expect(createImageTextReader()(bytes)).rejects.toThrow('32-megapixel');
  });
});
