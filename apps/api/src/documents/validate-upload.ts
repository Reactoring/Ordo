import path from 'node:path';
import { fileTypeFromBuffer } from 'file-type';
import type { UploadLimits } from '@ordo/contracts';
import type { DocumentFile } from './document-store.js';

export const uploadLimits: UploadLimits = { maxFiles: 5, maxFileSizeBytes: 10 * 1024 * 1024 };

export class UploadValidationError extends Error {}

export async function validateUpload(file: Express.Multer.File): Promise<DocumentFile> {
  const detected = await fileTypeFromBuffer(file.buffer).catch(() => undefined);
  const extension = path.extname(file.originalname).toLowerCase();
  const fileType =
    detected?.mime === 'application/pdf' && extension === '.pdf'
      ? 'PDF'
      : detected?.mime === 'image/png' && extension === '.png'
        ? 'PNG'
        : detected?.mime === 'image/jpeg' && ['.jpg', '.jpeg'].includes(extension)
          ? 'JPG'
          : undefined;
  if (!fileType) {
    throw new UploadValidationError('Use a valid PDF, PNG or JPEG file with a matching extension.');
  }
  const fileName = Array.from(path.basename(file.originalname.replaceAll('\\', '/')))
    .filter((character) => character.charCodeAt(0) >= 32 && character.charCodeAt(0) !== 127)
    .join('')
    .trim();
  if (!fileName || fileName.length > 180) {
    throw new UploadValidationError('File names must contain between 1 and 180 characters.');
  }
  return { fileName, fileType, bytes: file.buffer };
}
