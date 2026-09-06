import { createHash, randomUUID } from 'node:crypto';
import { mkdir, open, readFile, readdir, rename, rm } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import type { DocumentDetails } from '@ordo/contracts';
import {
  DocumentConflictError,
  documentIdPattern,
  type DocumentChanges,
  type DocumentFile,
  type DocumentStore,
} from './document-store.js';
import { emptyDocumentFields, parseStoredDocument } from './document-data.js';

function isMissing(error: unknown) {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
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

async function replaceMetadata(staging: string, target: string) {
  for (let attempt = 0; ; attempt++) {
    try {
      await rename(staging, target);
      return;
    } catch (error) {
      // Windows can briefly lock the destination while another request reads it.
      const locked =
        process.platform === 'win32' &&
        error instanceof Error &&
        'code' in error &&
        (error.code === 'EPERM' || error.code === 'EACCES' || error.code === 'EBUSY');
      if (!locked || attempt >= 5) throw error;
      await delay(10 * 2 ** attempt);
    }
  }
}

export class LocalDocumentStore implements DocumentStore {
  private readonly directory: string;
  private readonly pendingUpdates = new Map<string, Promise<unknown>>();

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
      return parseStoredDocument(value, id);
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
      .filter((document): document is DocumentDetails => document !== undefined)
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt) || a.id.localeCompare(b.id));
  }

  async import(file: DocumentFile) {
    const id = createHash('sha256').update(file.bytes).digest('hex');
    const existing = await this.find(id);
    if (existing) return { document: existing, outcome: 'duplicate' as const };

    const document: DocumentDetails = {
      id,
      fileName: file.fileName,
      fileType: file.fileType,
      sizeBytes: file.bytes.length,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
      fields: emptyDocumentFields(),
      extraction: { status: 'pending', message: null },
      revision: 0,
      reviewedAt: null,
    };
    const staging = path.join(this.directory, `.upload-${randomUUID()}`);
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

  async update(id: string, revision: number, changes: DocumentChanges) {
    const directory = this.documentDirectory(id);
    const previous = this.pendingUpdates.get(id) ?? Promise.resolve();
    // Serialize the revision check and replacement within this API process.
    const operation = previous
      .catch(() => undefined)
      .then(async () => {
        const current = await this.find(id);
        if (!current) return undefined;
        if (current.revision !== revision) throw new DocumentConflictError();
        const next: DocumentDetails = { ...current, ...changes, revision: current.revision + 1 };
        const staging = path.join(directory, `.metadata-${randomUUID()}.json`);
        try {
          await writeDurably(staging, JSON.stringify(next, null, 2));
          await replaceMetadata(staging, path.join(directory, 'document.json'));
        } finally {
          await rm(staging, { force: true });
        }
        return next;
      });
    this.pendingUpdates.set(id, operation);
    try {
      return await operation;
    } finally {
      if (this.pendingUpdates.get(id) === operation) this.pendingUpdates.delete(id);
    }
  }
}
