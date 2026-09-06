import { Router, type ErrorRequestHandler, type Response } from 'express';
import multer from 'multer';
import type {
  ApiErrorResponse,
  DocumentResponse,
  DocumentsResponse,
  UploadDocumentsResponse,
} from '@ordo/contracts';
import { documentIdPattern, type DocumentStore } from './document-store.js';
import { uploadLimits, UploadValidationError, validateUpload } from './validate-upload.js';
import { documentSummary } from './document-data.js';
import { createDocumentProcessor } from './extraction/process-document.js';
import type { PdfTextReader } from './extraction/read-pdf-text.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: uploadLimits.maxFiles,
    fileSize: uploadLimits.maxFileSizeBytes,
    fields: 0,
    parts: 6,
  },
}).array('files', uploadLimits.maxFiles);

export function createDocumentRouter(store: DocumentStore, readText?: PdfTextReader) {
  const router = Router();
  const processDocument = createDocumentProcessor(store, readText);
  router.get('/', async (_request, response: Response<DocumentsResponse>) => {
    response.json({ documents: (await store.list()).map(documentSummary), uploadLimits });
  });

  router.post('/', upload, async (request, response: Response<UploadDocumentsResponse>) => {
    if (!Array.isArray(request.files) || request.files.length === 0) {
      throw new UploadValidationError('Choose at least one document.');
    }
    // Validate the whole selection before storing any of its documents.
    const files = await Promise.all(request.files.map(validateUpload));
    const results = [];
    for (const file of files) {
      const result = await store.import(file);
      const document = await processDocument(result.document.id);
      if (!document) throw new Error('An imported document could not be found.');
      results.push({ outcome: result.outcome, document: documentSummary(document) });
    }
    response
      .status(results.some((result) => result.outcome === 'imported') ? 201 : 200)
      .json({ results });
  });

  router.get('/:id', async (request, response: Response<DocumentResponse | ApiErrorResponse>) => {
    const document = documentIdPattern.test(request.params.id)
      ? await store.find(request.params.id)
      : undefined;
    if (!document) {
      response
        .status(404)
        .json({ error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' } });
      return;
    }
    response.json({ document });
  });

  router.post(
    '/:id/extract',
    async (request, response: Response<DocumentResponse | ApiErrorResponse>) => {
      const document = documentIdPattern.test(request.params.id)
        ? await processDocument(request.params.id)
        : undefined;
      if (!document) {
        response
          .status(404)
          .json({ error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' } });
        return;
      }
      response.json({ document });
    },
  );

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
