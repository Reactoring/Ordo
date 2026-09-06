import { json, Router, type ErrorRequestHandler, type Response } from 'express';
import multer from 'multer';
import type {
  ApiErrorResponse,
  DocumentResponse,
  DocumentsResponse,
  UploadDocumentsResponse,
} from '@ordo/contracts';
import { DocumentConflictError, documentIdPattern, type DocumentStore } from './document-store.js';
import { uploadLimits, UploadValidationError, validateUpload } from './validate-upload.js';
import { documentSummary } from './document-data.js';
import { createDocumentProcessor } from './extraction/process-document.js';
import type { DocumentTextReader } from './extraction/document-reader.js';
import { ReviewValidationError, validateReviewInput } from './validate-review.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: uploadLimits.maxFiles,
    fileSize: uploadLimits.maxFileSizeBytes,
    fields: 0,
    parts: 6,
  },
}).array('files', uploadLimits.maxFiles);

function sendDocumentNotFound(response: Response<ApiErrorResponse>) {
  response.status(404).json({
    error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found.' },
  });
}

export function createDocumentRouter(store: DocumentStore, readText: DocumentTextReader) {
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
      sendDocumentNotFound(response);
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
        sendDocumentNotFound(response);
        return;
      }
      response.json({ document });
    },
  );

  router.get('/:id/content', async (request, response) => {
    const id = request.params.id;
    const document = documentIdPattern.test(id) ? await store.find(id) : undefined;
    if (!document) {
      sendDocumentNotFound(response);
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
        'Cache-Control': 'private, max-age=31536000, immutable',
      })
      .send(await store.readOriginal(id));
  });

  router.patch(
    '/:id/review',
    json({ limit: '16kb' }),
    async (request, response: Response<DocumentResponse | ApiErrorResponse>) => {
      const current = documentIdPattern.test(request.params.id)
        ? await store.find(request.params.id)
        : undefined;
      if (!current) {
        sendDocumentNotFound(response);
        return;
      }
      const input = validateReviewInput(request.body as unknown);
      const document = await store.update(current.id, input.revision, {
        fields: input.fields,
        status: 'reviewed',
        reviewedAt: new Date().toISOString(),
        extraction:
          current.extraction.status === 'pending'
            ? { status: 'manual', message: 'Details were entered manually before extraction.' }
            : current.extraction,
      });
      if (!document) {
        sendDocumentNotFound(response);
        return;
      }
      response.json({ document });
    },
  );

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
    } else if (error instanceof DocumentConflictError) {
      response.status(409).json({
        error: { code: 'DOCUMENT_CONFLICT', message: error.message },
      } satisfies ApiErrorResponse);
    } else if (error instanceof ReviewValidationError) {
      response.status(400).json({
        error: { code: 'INVALID_REVIEW', message: error.message },
      } satisfies ApiErrorResponse);
    } else if (
      error instanceof Error &&
      'type' in error &&
      (error.type === 'entity.parse.failed' || error.type === 'entity.too.large')
    ) {
      const tooLarge = error.type === 'entity.too.large';
      response.status(tooLarge ? 413 : 400).json({
        error: {
          code: 'INVALID_JSON',
          message: tooLarge
            ? 'The review request is too large.'
            : 'Send a valid JSON review request.',
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
