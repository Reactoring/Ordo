// @vitest-environment node
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exampleDocumentDetails } from '../../../../../tests/fixtures/documents.js';
import { LocalDocumentStore } from '../local-document-store.js';
import { DocumentReadLimitError, type DocumentTextReader } from './document-reader.js';
import { createDocumentProcessor } from './process-document.js';

let directory: string;
let store: LocalDocumentStore;
let id: string;
beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'ordo-processing-'));
  store = new LocalDocumentStore(directory);
  id = (
    await store.import({
      fileName: 'receipt.png',
      fileType: 'PNG',
      bytes: Buffer.from('original bytes'),
    })
  ).document.id;
});
afterEach(async () => {
  if (
    path.dirname(directory) !== path.resolve(tmpdir()) ||
    !path.basename(directory).startsWith('ordo-processing-')
  )
    throw new Error('Unexpected test directory.');
  await rm(directory, { recursive: true, force: true });
});

function controlledReader() {
  let finish!: (result: Awaited<ReturnType<DocumentTextReader>>) => void;
  const reader = vi.fn<DocumentTextReader>(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  return { reader, finish: () => finish({ text: 'Supplier: Extracted Company', method: 'ocr' }) };
}

describe('document processing coordination', () => {
  it('shares one reader job across simultaneous requests for the same document', async () => {
    const { reader, finish } = controlledReader();
    const process = createDocumentProcessor(store, reader);
    const requests = Array.from({ length: 8 }, () => process(id));
    await vi.waitFor(() => expect(reader).toHaveBeenCalledTimes(1));
    finish();
    const results = await Promise.all(requests);
    for (const result of results)
      expect(result).toMatchObject({ revision: 1, fields: { supplier: 'Extracted Company' } });
    expect(await process(id)).toEqual(results[0]);
    expect(reader).toHaveBeenCalledTimes(1);
  });

  it('preserves a review saved while the reader was running', async () => {
    const { reader, finish } = controlledReader();
    const process = createDocumentProcessor(store, reader);
    const reading = process(id);
    await vi.waitFor(() => expect(reader).toHaveBeenCalledTimes(1));
    const saved = await store.update(id, 0, {
      fields: exampleDocumentDetails.fields,
      status: 'reviewed',
      reviewedAt: '2026-09-06T12:00:00.000Z',
      extraction: { status: 'manual', message: 'Entered manually.' },
    });
    finish();
    expect(await reading).toEqual(saved);
    expect(await store.find(id)).toEqual(saved);
  });

  it('explains reading limits without retrying completed manual outcomes', async () => {
    const reader = vi
      .fn<DocumentTextReader>()
      .mockRejectedValue(
        new DocumentReadLimitError('Image is too large. Enter the details manually.'),
      );
    const process = createDocumentProcessor(store, reader);
    const result = await process(id);
    expect(result?.extraction).toEqual({
      status: 'manual',
      message: 'Image is too large. Enter the details manually.',
    });
    expect(await process(id)).toEqual(result);
    expect(reader).toHaveBeenCalledTimes(1);
  });

  it('releases failed storage operations so a later request can retry', async () => {
    const reader = vi.fn<DocumentTextReader>().mockResolvedValue({ text: '', method: 'ocr' });
    vi.spyOn(store, 'readOriginal').mockRejectedValueOnce(new Error('Temporary storage failure.'));
    const process = createDocumentProcessor(store, reader);
    await expect(process(id)).rejects.toThrow('Temporary storage failure.');
    expect(reader).not.toHaveBeenCalled();
    expect(await process(id)).toMatchObject({
      revision: 1,
      extraction: { status: 'manual', method: 'ocr' },
    });
  });
});
