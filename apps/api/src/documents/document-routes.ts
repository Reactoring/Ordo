import { Router, type ErrorRequestHandler, type Response } from 'express';
import multer from 'multer';
import type { ApiErrorResponse, DocumentsResponse, UploadDocumentsResponse } from '@ordo/contracts';
import { documentIdPattern, type DocumentStore } from './document-store.js';
import { uploadLimits, UploadValidationError, validateUpload } from './validate-upload.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: uploadLimits.maxFiles,
    fileSize: uploadLimits.maxFileSizeBytes,
    fields: 0,
    parts: 6,
  },
}).array('files', uploadLimits.maxFiles);

export function createDocumentRouter(store: DocumentStore) {
  const router = Router();
  router.get('/', async (_request, response: Response<DocumentsResponse>) => {
    response.json({ documents: await store.list(), uploadLimits });
  });

  router.post('/', upload, async (request, response: Response<UploadDocumentsResponse>) => {
    if (!Array.isArray(request.files) || request.files.length === 0) {
      throw new UploadValidationError('Choose at least one document.');
    }
    // Validate the whole selection before storing any of its documents.
    const files = await Promise.all(request.files.map(validateUpload));
    const results = [];
    for (const file of files) results.push(await store.import(file));
    response
      .status(results.some((result) => result.outcome === 'imported') ? 201 : 200)
      .json({ results });
  });

  router.get('/:id/content', async (request, response) => {
    const id = request.params.id;
    const document = documentIdPattern.test(id) ? await store.find(id) : undefined;
    if (!document) {
      response.status(404).json({
        error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' },
      } satisfies ApiErrorResponse);
      return;
    }
    const contentType = { PDF: 'application/pdf', PNG: 'image/png', JPG: 'image/jpeg' }[
      document.fileType
    ];
    response
      .set({
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="document.${document.fileType.toLowerCase()}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
      })
      .send(await store.readOriginal(id));
  });

  const handleError: ErrorRequestHandler = (error: unknown, _request, response, next) => {
    if (error instanceof multer.MulterError) {
      const tooLarge = error.code === 'LIMIT_FILE_SIZE';
      response.status(tooLarge ? 413 : 400).json({
        error: {
          code: error.code,
          message: tooLarge
            ? 'Each file must be 10 MB or smaller.'
            : 'Upload up to 5 files using the files field.',
        },
      } satisfies ApiErrorResponse);
    } else if (error instanceof UploadValidationError) {
      response.status(400).json({
        error: { code: 'INVALID_UPLOAD', message: error.message },
      } satisfies ApiErrorResponse);
    } else {
      next(error);
    }
  };
  router.use(handleError);
  return router;
}
