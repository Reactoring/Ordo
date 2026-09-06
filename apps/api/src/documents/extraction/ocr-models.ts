import { createRequire } from 'node:module';
import { rmSync } from 'node:fs';
import { copyFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
let languagePath: Promise<string> | undefined;

async function prepareModels() {
  // Tesseract requires the installed models to share a single language directory.
  const directory = await mkdtemp(join(tmpdir(), 'ordo-ocr-'));
  try {
    for (const code of ['eng', 'fra']) {
      await copyFile(
        require.resolve(`@tesseract.js-data/${code}/4.0.0_best_int/${code}.traineddata.gz`),
        join(directory, `${code}.traineddata.gz`),
      );
    }
  } catch (error) {
    await rm(directory, { recursive: true, force: true, maxRetries: 3 });
    throw error;
  }
  // Workers only read the models. Keep them until all processing has ended.
  process.once('exit', () => {
    try {
      rmSync(directory, { recursive: true, force: true, maxRetries: 3 });
    } catch {
      console.error('Could not remove temporary OCR models.');
    }
  });
  return directory;
}

export function getOcrLanguagePath(): Promise<string> {
  languagePath ??= prepareModels().catch((error: unknown) => {
    languagePath = undefined;
    throw error;
  });
  return languagePath;
}
