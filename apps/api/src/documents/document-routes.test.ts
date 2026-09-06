// @vitest-environment node
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { DocumentsResponse, UploadDocumentsResponse } from '@ordo/contracts';
import { createApp } from '../app.js';
import { LocalDocumentStore } from './local-document-store.js';

const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH0kAAAAASUVORK5CYII=',
  'base64',
);
let directory: string;
let server: Server;
let baseUrl: string;

async function startServer() {
  server = createApp({ documentStore: new LocalDocumentStore(directory) }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected an HTTP address.');
  baseUrl = `http://127.0.0.1:${address.port}`;
}

async function stopServer() {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
    server.closeAllConnections();
  });
}

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'ordo-import-'));
  await startServer();
});

afterEach(async () => {
  await stopServer();
  if (
    path.dirname(directory) !== path.resolve(tmpdir()) ||
    !path.basename(directory).startsWith('ordo-import-')
  ) {
    throw new Error('Unexpected test directory.');
  }
  await rm(directory, { recursive: true, force: true });
});

function sendFiles(files: { name: string; bytes: Uint8Array; type?: string }[]) {
  const body = new FormData();
  for (const file of files)
    body.append(
      'files',
      new Blob([new Uint8Array(file.bytes)], { type: file.type ?? 'image/png' }),
      file.name,
    );
  return fetch(`${baseUrl}/api/documents`, { method: 'POST', body });
}

describe('document import API', () => {
  it('keeps originals and metadata after restarting the application', async () => {
    const response = await sendFiles([{ name: 'receipt.png', bytes: png }]);
    expect(response.status).toBe(201);
    const imported: UploadDocumentsResponse = await response.json();
    const document = imported.results[0]?.document;
    expect(document).toMatchObject({
      fileName: 'receipt.png',
      fileType: 'PNG',
      status: 'uploaded',
      sizeBytes: png.length,
    });
    await stopServer();
    await startServer();
    const list: DocumentsResponse = await (await fetch(`${baseUrl}/api/documents`)).json();
    expect(list.documents).toEqual([document]);
    const original = await fetch(`${baseUrl}/api/documents/${document?.id}/content`);
    expect(original.headers.get('content-type')).toContain('image/png');
    expect(Buffer.from(await original.arrayBuffer())).toEqual(png);
  });

  it('deduplicates identical bytes even when uploaded concurrently under different names', async () => {
    const responses = await Promise.all(
      ['first.png', 'second.png'].map((name) => sendFiles([{ name, bytes: png }])),
    );
    const bodies: UploadDocumentsResponse[] = await Promise.all(
      responses.map((response) => response.json()),
    );
    expect(bodies.flatMap((body) => body.results.map((result) => result.outcome)).sort()).toEqual([
      'duplicate',
      'imported',
    ]);
    const list: DocumentsResponse = await (await fetch(`${baseUrl}/api/documents`)).json();
    expect(list.documents).toHaveLength(1);
  });

  it('rejects a disguised file before persisting any file in the selection', async () => {
    const response = await sendFiles([
      { name: 'receipt.png', bytes: png },
      { name: 'fake.pdf', bytes: Buffer.from('not a PDF'), type: 'application/pdf' },
    ]);
    expect(response.status).toBe(400);
    const list: DocumentsResponse = await (await fetch(`${baseUrl}/api/documents`)).json();
    expect(list.documents).toEqual([]);
  });

  it('rejects too many files and empty selections', async () => {
    expect(
      (
        await sendFiles(
          Array.from({ length: 6 }, (_, index) => ({ name: `${index}.png`, bytes: png })),
        )
      ).status,
    ).toBe(400);
    expect((await sendFiles([])).status).toBe(400);
  });

  it('rejects oversized files and unsafe content identifiers', async () => {
    expect(
      (await sendFiles([{ name: 'large.png', bytes: Buffer.alloc(10 * 1024 * 1024 + 1) }])).status,
    ).toBe(413);
    expect((await fetch(`${baseUrl}/api/documents/not-an-id/content`)).status).toBe(404);
    expect((await fetch(`${baseUrl}/api/documents/${'a'.repeat(64)}/content`)).status).toBe(404);
  });
});
