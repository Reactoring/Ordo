import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, readFile, readdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import type { UploadedDocument } from '@ordo/contracts';
import { documentIdPattern, type DocumentFile, type DocumentStore } from './document-store.js';

function isMissing(error: unknown) {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function parseDocument(value: unknown, id: string): UploadedDocument {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('id' in value) ||
    value.id !== id ||
    !('fileName' in value) ||
    typeof value.fileName !== 'string' ||
    !value.fileName ||
    !('fileType' in value) ||
    (value.fileType !== 'PDF' && value.fileType !== 'PNG' && value.fileType !== 'JPG') ||
    !('sizeBytes' in value) ||
    typeof value.sizeBytes !== 'number' ||
    !Number.isSafeInteger(value.sizeBytes) ||
    value.sizeBytes <= 0 ||
    !('uploadedAt' in value) ||
    typeof value.uploadedAt !== 'string' ||
    !Number.isFinite(Date.parse(value.uploadedAt)) ||
    !('status' in value) ||
    value.status !== 'uploaded'
  ) {
    throw new Error(`Invalid stored document: ${id}`);
  }
  return {
    id,
    fileName: value.fileName,
    fileType: value.fileType,
    sizeBytes: value.sizeBytes,
    uploadedAt: value.uploadedAt,
    status: value.status,
  };
}

async function writeDurably(filePath: string, data: string | Buffer) {
  const handle = await open(filePath, 'wx');
  try {
    await handle.writeFile(data);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

export class LocalDocumentStore implements DocumentStore {
  private readonly directory: string;

  constructor(directory: string) {
    this.directory = path.resolve(directory);
  }

  private documentDirectory(id: string) {
    if (!documentIdPattern.test(id)) throw new Error('Invalid document identifier.');
    return path.join(this.directory, id);
  }

  async find(id: string) {
    try {
      const text = await readFile(path.join(this.documentDirectory(id), 'document.json'), 'utf8');
      const value: unknown = JSON.parse(text);
      return parseDocument(value, id);
    } catch (error) {
      if (isMissing(error)) return undefined;
      throw error;
    }
  }

  async list() {
    await mkdir(this.directory, { recursive: true });
    const entries = await readdir(this.directory, { withFileTypes: true });
    const documents = await Promise.all(
      entries
        .filter((entry) => entry.isDirectory() && documentIdPattern.test(entry.name))
        .map((entry) => this.find(entry.name)),
    );
    return documents
      .filter((document): document is UploadedDocument => document !== undefined)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt) || a.id.localeCompare(b.id));
  }

  async import(file: DocumentFile) {
    const id = createHash('sha256').update(file.bytes).digest('hex');
    const existing = await this.find(id);
    if (existing) return { document: existing, outcome: 'duplicate' as const };

    const document: UploadedDocument = {
      id,
      fileName: file.fileName,
      fileType: file.fileType,
      sizeBytes: file.bytes.length,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
    };
    const staging = path.join(this.directory, `.upload-${randomUUID()}`);
    if (
      path.dirname(staging) !== this.directory ||
      !path.basename(staging).startsWith('.upload-')
    ) {
      throw new Error('Invalid staging directory.');
    }
    await mkdir(staging, { recursive: true });
    try {
      await writeDurably(path.join(staging, 'original'), file.bytes);
      await writeDurably(path.join(staging, 'document.json'), JSON.stringify(document, null, 2));
      // Publish both files together; concurrent identical uploads keep the first complete record.
      try {
        await rename(staging, this.documentDirectory(id));
      } catch (error) {
        const concurrent = await this.find(id);
        if (concurrent) return { document: concurrent, outcome: 'duplicate' as const };
        throw error;
      }
      return { document, outcome: 'imported' as const };
    } finally {
      await rm(staging, { recursive: true, force: true });
    }
  }

  readOriginal(id: string) {
    return readFile(path.join(this.documentDirectory(id), 'original'));
  }
}
