// @vitest-environment node
import { execFile } from 'node:child_process';
import { access, copyFile, rm } from 'node:fs/promises';
import { dirname } from 'node:path';
import { promisify } from 'node:util';
import { describe, expect, it, vi } from 'vitest';

vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>();
  return { ...actual, copyFile: vi.fn(actual.copyFile) };
});

describe('OCR language models', () => {
  it('shares one complete directory across requests and removes it when the process exits', async () => {
    const moduleUrl = new URL('./ocr-models.ts', import.meta.url).href;
    const script = `
      import { stat } from 'node:fs/promises';
      import { join } from 'node:path';
      const { getOcrLanguagePath } = await import(${JSON.stringify(moduleUrl)});
      const paths = await Promise.all(Array.from({ length: 8 }, () => getOcrLanguagePath()));
      paths.push(await getOcrLanguagePath());
      const sizes = await Promise.all(['eng', 'fra'].map(async code =>
        (await stat(join(paths[0], code + '.traineddata.gz'))).size));
      console.log(JSON.stringify({ directory: paths[0], directories: new Set(paths).size, sizes }));
    `;
    const { stdout } = await promisify(execFile)(
      process.execPath,
      ['--input-type=module', '-e', script],
      {
        timeout: 10_000,
      },
    );
    const result = JSON.parse(stdout) as {
      directory: string;
      directories: number;
      sizes: number[];
    };
    expect(result.directories).toBe(1);
    expect(result.sizes).toHaveLength(2);
    expect(result.sizes.every((size) => size > 0)).toBe(true);
    await expect(access(result.directory)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('removes partially copied models and allows a later preparation to succeed', async () => {
    const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises');
    const copy = vi.mocked(copyFile);
    copy.mockImplementationOnce(actual.copyFile).mockRejectedValueOnce(new Error('Copy failed'));
    const { getOcrLanguagePath } = await import('./ocr-models.js');
    const preparation = getOcrLanguagePath();
    expect(getOcrLanguagePath()).toBe(preparation);
    await expect(preparation).rejects.toThrow('Copy failed');
    const destination = copy.mock.calls[0]?.[1];
    if (typeof destination !== 'string') throw new Error('Expected a model destination.');
    await expect(access(dirname(destination))).rejects.toMatchObject({ code: 'ENOENT' });

    const directory = await getOcrLanguagePath();
    try {
      await expect(access(directory)).resolves.toBeUndefined();
      expect(copy).toHaveBeenCalledTimes(4);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
