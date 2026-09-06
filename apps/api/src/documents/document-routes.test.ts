// @vitest-environment node
import { once } from 'node:events';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type {
  DocumentResponse,
  DocumentsResponse,
  ReviewDocumentInput,
  UploadDocumentsResponse,
} from '@ordo/contracts';
import { createApp } from '../app.js';
import { LocalDocumentStore } from './local-document-store.js';
import { createTextPdf } from '../../../../tests/fixtures/create-pdf.js';

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
  it('extracts embedded PDF text and persists review fields across restarts', async () => {
    const bytes = createTextPdf([
      'Supplier: Cedar Workspace',
      'Invoice: INV-42',
      'Issued: 2026-09-02',
      'Subtotal 125.00 EUR',
      'VAT (20%) 25.00 EUR',
      'TOTAL 150.00 EUR',
    ]);
    const response = await sendFiles([{ name: 'invoice.pdf', bytes, type: 'application/pdf' }]);
    expect(response.status).toBe(201);
    const imported: UploadDocumentsResponse = await response.json();
    const id = imported.results[0]?.document.id;
    await stopServer();
    await startServer();
    const details: DocumentResponse = await (await fetch(`${baseUrl}/api/documents/${id}`)).json();
    expect(details.document).toMatchObject({
      status: 'needs_review',
      revision: 1,
      extraction: { status: 'extracted' },
      fields: {
        supplier: 'Cedar Workspace',
        invoiceNumber: 'INV-42',
        invoiceDate: '2026-09-02',
        currency: 'EUR',
        subtotalCents: 12500,
        taxCents: 2500,
        totalCents: 15000,
      },
    });
    const repeated: DocumentResponse = await (
      await fetch(`${baseUrl}/api/documents/${id}/extract`, { method: 'POST' })
    ).json();
    expect(repeated).toEqual(details);
  });

  it('keeps unreadable and text-free PDFs available for manual review without failing other files', async () => {
    const response = await sendFiles([
      {
        name: 'broken.pdf',
        bytes: Buffer.from('%PDF-1.7\ninvalid document'),
        type: 'application/pdf',
      },
      { name: 'blank.pdf', bytes: createTextPdf([]), type: 'application/pdf' },
      { name: 'receipt.png', bytes: png },
    ]);
    expect(response.status).toBe(201);
    const imported: UploadDocumentsResponse = await response.json();
    const details: DocumentResponse[] = await Promise.all(
      imported.results.map(async (result) =>
        (await fetch(`${baseUrl}/api/documents/${result.document.id}`)).json(),
      ),
    );
    expect(details.map(({ document }) => document.extraction.status)).toEqual([
      'failed',
      'manual',
      'manual',
    ]);
    expect(
      details.every(
        ({ document }) => document.fields.totalCents === null && document.status === 'needs_review',
      ),
    ).toBe(true);
  });

  it('opens metadata from earlier imports and processes it without replacing the original', async () => {
    const imported: UploadDocumentsResponse = await (
      await sendFiles([{ name: 'old.png', bytes: png }])
    ).json();
    const document = imported.results[0]?.document;
    if (!document) throw new Error('Expected an imported document.');
    await writeFile(
      path.join(directory, document.id, 'document.json'),
      JSON.stringify({ ...document, status: 'uploaded' }),
    );
    const previous: DocumentResponse = await (
      await fetch(`${baseUrl}/api/documents/${document.id}`)
    ).json();
    expect(previous.document).toMatchObject({ revision: 0, extraction: { status: 'pending' } });
    const processed: DocumentResponse = await (
      await fetch(`${baseUrl}/api/documents/${document.id}/extract`, { method: 'POST' })
    ).json();
    expect(processed.document).toMatchObject({ revision: 1, status: 'needs_review' });
    expect(await readFile(path.join(directory, document.id, 'original'))).toEqual(png);
  });

  it('keeps originals and metadata after restarting the application', async () => {
    const response = await sendFiles([{ name: 'receipt.png', bytes: png }]);
    expect(response.status).toBe(201);
    const imported: UploadDocumentsResponse = await response.json();
    const document = imported.results[0]?.document;
    expect(document).toMatchObject({
      fileName: 'receipt.png',
      fileType: 'PNG',
      status: 'needs_review',
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

describe('document review API', () => {
  async function importForReview() {
    const response: UploadDocumentsResponse = await (
      await sendFiles([{ name: 'receipt.png', bytes: png }])
    ).json();
    const id = response.results[0]?.document.id;
    if (!id) throw new Error('Expected a document.');
    const details: DocumentResponse = await (await fetch(`${baseUrl}/api/documents/${id}`)).json();
    return details.document;
  }
  const fields = {
    supplier: 'Demo Supplier',
    invoiceNumber: 'REC-42',
    invoiceDate: '2026-09-05',
    currency: 'EUR' as const,
    subtotalCents: 1000,
    taxCents: 200,
    totalCents: 1200,
  };
  function save(id: string, input: ReviewDocumentInput) {
    return fetch(`${baseUrl}/api/documents/${id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
  }

  it('persists corrected values and the reviewed status without changing the original', async () => {
    const current = await importForReview();
    const response = await save(current.id, {
      revision: current.revision,
      fields: { ...fields, supplier: '  Corrected Supplier  ' },
    });
    expect(response.status).toBe(200);
    const result: DocumentResponse = await response.json();
    expect(result.document).toMatchObject({
      status: 'reviewed',
      revision: current.revision + 1,
      fields: { ...fields, supplier: 'Corrected Supplier' },
    });
    expect(result.document.reviewedAt).toEqual(expect.any(String));
    await stopServer();
    await startServer();
    const reopened: DocumentResponse = await (
      await fetch(`${baseUrl}/api/documents/${current.id}`)
    ).json();
    expect(reopened).toEqual(result);
    const repeated = await fetch(`${baseUrl}/api/documents/${current.id}/extract`, {
      method: 'POST',
    });
    expect(await repeated.json()).toEqual(result);
    expect(await readFile(path.join(directory, current.id, 'original'))).toEqual(png);
    const list: DocumentsResponse = await (await fetch(`${baseUrl}/api/documents`)).json();
    expect(list.documents[0]?.status).toBe('reviewed');
  });

  it('rejects invalid review data without changing the stored revision', async () => {
    const current = await importForReview();
    for (const invalid of [
      { ...fields, totalCents: 1199 },
      { ...fields, taxCents: 200.5 },
      { ...fields, subtotalCents: -1000 },
      { ...fields, supplier: ' ' },
      { ...fields, invoiceDate: '2026-02-30' },
      { ...fields, currency: null },
      { ...fields, totalCents: null },
    ]) {
      expect((await save(current.id, { revision: current.revision, fields: invalid })).status).toBe(
        400,
      );
    }
    const malformed = await fetch(`${baseUrl}/api/documents/${current.id}/review`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    expect(malformed.status).toBe(400);
    const reopened: DocumentResponse = await (
      await fetch(`${baseUrl}/api/documents/${current.id}`)
    ).json();
    expect(reopened.document).toEqual(current);
  });

  it('allows only one of two concurrent saves at the same revision', async () => {
    const current = await importForReview();
    const responses = await Promise.all(
      ['First correction', 'Second correction'].map((supplier) =>
        save(current.id, { revision: current.revision, fields: { ...fields, supplier } }),
      ),
    );
    expect(responses.map((response) => response.status).sort()).toEqual([200, 409]);
    const winner = responses.find((response) => response.ok);
    if (!winner) throw new Error('Expected one successful save.');
    const saved: DocumentResponse = await winner.json();
    const reopened = await fetch(`${baseUrl}/api/documents/${current.id}`);
    expect(await reopened.json()).toEqual(saved);
    expect((await save(current.id, { revision: current.revision, fields })).status).toBe(409);
  });
});
