import { fileURLToPath } from 'node:url';
import express, { type ErrorRequestHandler, type Response } from 'express';
import type { ApiErrorResponse, ServiceHealthResponse } from '@ordo/contracts';
import type { DocumentStore } from './documents/document-store.js';
import { LocalDocumentStore } from './documents/local-document-store.js';
import { createDocumentRouter } from './documents/document-routes.js';
import type { PdfTextReader } from './documents/extraction/read-pdf-text.js';

export function createApp(
  options: { documentStore?: DocumentStore; readPdfText?: PdfTextReader } = {},
) {
  const app = express();
  app.disable('x-powered-by');

  app.get('/api/health', (_request, response: Response<ServiceHealthResponse>) => {
    response.json({ status: 'ok' });
  });

  const store =
    options.documentStore ??
    new LocalDocumentStore(
      process.env.DATA_DIR ?? fileURLToPath(new URL('../.data/documents', import.meta.url)),
    );
  app.use('/api/documents', createDocumentRouter(store, options.readPdfText));

  app.use((_request, response) => {
    response
      .status(404)
      .json({ error: { code: 'NOT_FOUND', message: 'Not found.' } } satisfies ApiErrorResponse);
  });

  const handleError: ErrorRequestHandler = (error: unknown, _request, response, next) => {
    if (response.headersSent) {
      next(error);
      return;
    }
    console.error('API request failed:', error);
    response.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'The document service could not complete this request.',
      },
    } satisfies ApiErrorResponse);
  };
  app.use(handleError);

  return app;
}
