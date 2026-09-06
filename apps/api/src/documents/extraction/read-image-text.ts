import { Worker } from 'node:worker_threads';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { imageSize } from 'image-size';
import { DocumentReadLimitError } from './document-reader.js';
import { ocrLimits } from './ocr-limits.js';
import { getOcrLanguagePath } from './ocr-models.js';

export type ImageTextReader = (bytes: Uint8Array) => Promise<string>;

async function normalizeImage(bytes: Uint8Array) {
  const { width, height } = imageSize(bytes);
  if (!width || !height || width * height > ocrLimits.maxInputPixels)
    throw new DocumentReadLimitError(
      'This image exceeds the 32-megapixel OCR limit. Enter its details manually.',
    );
  if (width < 20 || height < 20) return null;
  const image = await loadImage(Buffer.from(bytes));
  const scale = Math.min(
    ocrLimits.maxScale,
    ocrLimits.maxSide / Math.max(image.width, image.height),
    Math.sqrt(ocrLimits.maxOutputPixels / (image.width * image.height)),
  );
  const canvas = createCanvas(
    Math.max(1, Math.round(image.width * scale)),
    Math.max(1, Math.round(image.height * scale)),
  );
  const context = canvas.getContext('2d');
  context.fillStyle = 'white';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toBuffer('image/png');
}

async function runWorker(image: Uint8Array, timeoutMs: number): Promise<string> {
  const languagePath = await getOcrLanguagePath();
  const script = new URL(
    import.meta.url.endsWith('.ts') ? './ocr-worker.ts' : './ocr-worker.js',
    import.meta.url,
  );
  const worker = new Worker(script, {
    // Node 22.22+ can strip the worker's types in development; production uses compiled JS.
    execArgv: [],
    workerData: {
      image,
      languagePath,
    },
  });
  return await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(new Error('OCR took too long. Enter the details manually or try a clearer image.')),
      timeoutMs,
    );
    worker.once('message', (value: unknown) => {
      if (
        typeof value === 'object' &&
        value !== null &&
        'text' in value &&
        typeof value.text === 'string'
      )
        resolve(value.text);
      else reject(new Error('The image could not be read. Enter its details manually.'));
    });
    worker.once('error', reject);
    worker.once('exit', () => reject(new Error('The OCR worker stopped before returning text.')));
    worker.once('message', () => clearTimeout(timer));
    worker.once('error', () => clearTimeout(timer));
    worker.once('exit', () => clearTimeout(timer));
  }).finally(async () => {
    await worker.terminate();
  });
}

export function createImageTextReader(options: { timeoutMs?: number } = {}): ImageTextReader {
  let tail: Promise<unknown> = Promise.resolve();
  let pending = 0;
  return async (bytes) => {
    if (pending >= ocrLimits.maxPending)
      throw new Error('OCR is busy. Enter the details manually or try again later.');
    pending++;
    const job = tail.then(async () => {
      const image = await normalizeImage(bytes);
      return image ? runWorker(image, options.timeoutMs ?? ocrLimits.timeoutMs) : '';
    });
    tail = job.catch(() => undefined);
    try {
      return await job;
    } finally {
      pending--;
    }
  };
}

export const readImageText = createImageTextReader();
