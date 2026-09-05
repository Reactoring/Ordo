# ORDO

ORDO helps independent professionals collect purchase documents, review extracted information, and prepare an expense summary.

## Status

The application foundation is ready for local development: a React host loads a separate review application through Webpack Module Federation, and a Node.js API exposes a health endpoint. The screens currently contain empty states. Uploads, extraction, editing, and export are not implemented yet.

## First release

The first release will support a batch of up to five documents:

1. Upload purchase invoices as text-based PDFs or PNG/JPEG images.
2. Follow the processing status of each document independently.
3. Review the original document beside an editable form.
4. Correct extracted supplier names, invoice references, dates, currencies, and totals.
5. Confirm reviewed documents and export their data as CSV.

Processing errors remain specific to the affected document. Other documents can still be reviewed. Exact duplicate uploads are identified using file hashes.

## Document processing

The planned Node.js backend extracts embedded text from digital PDFs with PDF.js and recognizes text in images with Tesseract.js. TypeScript rules identify candidate fields and check arithmetic consistency.

Extraction may be incomplete or ambiguous. Missing values remain empty, and proposed values require review. Arithmetic checks provide review aids rather than a guarantee of accounting or tax compliance.

The first release targets a documented set of invoice layouts. Scanned PDFs, arbitrary receipt layouts, and detailed line-item extraction are later extensions. No LLM service is required.

## Architecture

- **`apps/host`:** application shell and navigation; owns the document collection workflow.
- **`apps/review`:** independently built review microfrontend; exposes `review/ReviewModule`.
- **`apps/api`:** Node.js API; currently provides `GET /api/health`.
- **`packages/contracts`:** TypeScript contracts for integration between applications.
- **`packages/ui`:** shared branding, styles, and locally bundled fonts.

The host loads the review module at runtime through Module Federation. Each frontend has its own build output. Integration uses explicit typed contracts, with state owned by each application. An error boundary preserves host navigation when the remote fails to load or render.

Within each application, business rules remain separate from React components, HTTP handlers, and document-processing libraries.

## Stack

- React and TypeScript with strict checking
- Webpack 5 and Module Federation
- Tailwind CSS
- Vitest and React Testing Library for user-facing behavior
- ESLint and Prettier
- Node.js and Express
- pnpm workspaces with a committed lockfile

Redux Toolkit, React Hook Form, PDF.js, and Tesseract.js will be added with the features that need them. Azure Pipelines and Azure hosting are planned. The backend hosting service will be selected after verifying the OCR runtime requirements. Deployment is not configured yet.

## Development

Use Node.js 22.22 or later in the 22.x line, or Node.js 24.19 or later in the 24.x line, and pnpm 11.19.0. npm can install the package manager:

```sh
npm install --global pnpm@11.19.0
pnpm install --frozen-lockfile
pnpm dev
```

| Application       | Local address                    |
| ----------------- | -------------------------------- |
| Workspace host    | http://127.0.0.1:3000            |
| Standalone review | http://127.0.0.1:3001            |
| API health        | http://127.0.0.1:4000/api/health |

Open the host and select **Open review workspace** to load the remote application. The standalone review address is a local development entry point. The host development server proxies `/api` requests to the API. All three servers bind to the loopback interface by default.

```sh
pnpm check          # Formatting, lint, types, tests, and production builds
pnpm test:watch     # Watch behavior tests
pnpm format        # Apply formatting
pnpm --filter @ordo/host build
pnpm --filter @ordo/review build
pnpm --filter @ordo/api build
```

Build output lives in each application's `dist` directory. `REVIEW_REMOTE_URL` overrides the remote entry URL when building or starting the host; the default is `http://127.0.0.1:3001/remoteEntry.js`. The API accepts `PORT` and `HOST`. Environment variables must be set in the shell; `.env` files are not loaded automatically.

Future hosting configuration must serve each frontend's assets, allow the host origin through CORS on review assets, route API requests, and provide the deployed review URL. Nothing is deployed by the development or build commands.
