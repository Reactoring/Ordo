import { parentPort, workerData } from 'node:worker_threads';
import { createWorker, OEM, PSM, type Line } from 'tesseract.js';

interface OcrInput {
  image: Uint8Array;
  languagePath: string;
}

const input = workerData as OcrInput;
try {
  const worker = await createWorker('eng+fra', OEM.LSTM_ONLY, {
    langPath: input.languagePath,
    cacheMethod: 'none',
    // Job failures reject their promises; do not rethrow them as uncaught worker errors.
    errorHandler: () => {},
  });
  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
      preserve_interword_spaces: '1',
      user_defined_dpi: '200',
    });
    const result = await worker.recognize(
      input.image,
      { rotateAuto: true },
      { text: true, blocks: true },
    );
    // OCR may separate labels and right-aligned amounts into different columns.
    // Restore visual rows before applying the same field rules as embedded PDF text.
    const lines =
      result.data.blocks?.flatMap((block) =>
        block.paragraphs.flatMap((paragraph) => paragraph.lines),
      ) ?? [];
    const rows: Line[][] = [];
    for (const line of lines.sort((a, b) => a.bbox.y0 + a.bbox.y1 - (b.bbox.y0 + b.bbox.y1))) {
      const row = rows.at(-1);
      const anchor = row?.[0];
      const sameRow =
        anchor &&
        Math.abs((line.bbox.y0 + line.bbox.y1) / 2 - (anchor.bbox.y0 + anchor.bbox.y1) / 2) <
          Math.min(line.bbox.y1 - line.bbox.y0, anchor.bbox.y1 - anchor.bbox.y0) / 2;
      if (sameRow) row?.push(line);
      else rows.push([line]);
    }
    const text = rows
      .map((row) =>
        row
          .sort((a, b) => a.bbox.x0 - b.bbox.x0)
          .map((line) => line.text.trim())
          .join(' '),
      )
      .join('\n');
    parentPort?.postMessage({ text: text || result.data.text });
  } finally {
    await worker.terminate();
  }
} catch {
  parentPort?.postMessage({ error: 'The image could not be read. Enter its details manually.' });
}
