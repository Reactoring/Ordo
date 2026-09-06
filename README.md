# ORDO

ORDO helps independent professionals collect purchase documents, review extracted information, and prepare an expense summary.

## Status

The local application supports import, PDF text extraction, local OCR, review, and saved corrections. The Documents screen accepts PDF, PNG, and JPEG files through selection or drag-and-drop and provides file-name search. Each document opens in the federated Review module with its original beside an editable form. Validating saves the corrected fields and updates the collection's review status. Originals, extraction results, and corrections survive reloads and API restarts. Export is not implemented yet.

## First release

The first release will support a batch of up to five documents:

1. Upload purchase invoices as text-based PDFs or PNG/JPEG images.
2. Follow the processing status of each document independently.
3. Review the original document beside an editable form.
4. Correct extracted supplier names, invoice references, dates, currencies, and totals.
5. Confirm reviewed documents and export their data as CSV.

Processing failures will remain isolated per document. File hashes will identify exact duplicate uploads.

## Document processing

The backend uses PDF.js for embedded PDF text and TypeScript rules for field extraction. New imports are processed before the import response returns. PDF extraction reads up to 20 pages and 100,000 characters; supported English and French labels identify supplier, reference, invoice date, currency, subtotal, tax, and total. Amounts are stored as integer cents. Ambiguous or missing values remain empty, and missing amounts are never calculated from other extracted fields. EUR, USD, and GBP are currently supported.

Tesseract.js reads PNG/JPEG images locally using installed English and French models. PDF.js renders pages with fewer than 40 non-whitespace text characters before OCR; mixed PDFs can use both readers. OCR line positions reunite labels with right-aligned amounts before applying the field rules. Simple receipts with an `RCPT` reference can also suggest their merchant header and date. No document is sent to an external service and no LLM is required.

OCR accepts images up to 32 megapixels, normalizes them to at most 4 megapixels and 2,400 pixels per side, and reads at most five scanned pages per PDF. One OCR worker runs at a time, with up to six active or waiting jobs; recognition has a 30-second deadline per image. Workers are terminated after each job. Language files come from pinned npm packages and are copied into a private temporary directory, removed after processing; there is no runtime model download. `@napi-rs/canvas` supplies the native image decoder and PDF render surface.

Unreadable or oversized documents remain available for manual entry without blocking the rest of a batch. The extraction outcome records `pdf_text`, `ocr`, or `mixed` when available. Earlier, untouched manual imports receive one OCR attempt when opened; completed OCR and reviewed documents are preserved.

Extracted values require human review; missing values remain empty. Arithmetic checks are review aids, not accounting or tax guarantees.

Automatic extraction targets simple printed invoices and receipts. Blurred photos, handwriting, complex tables, and unfamiliar layouts may need manual correction. Detailed line items are a later extension.

### Import and local persistence

`POST /api/documents` accepts a multipart `files` field with up to five files, 10 MB each. The API checks PDF/PNG/JPEG signatures and matching extensions before storing the selection. Signature checks identify the format; they do not guarantee a document can be parsed. `GET /api/documents` returns the collection and upload limits, `GET /api/documents/:id` returns document details, and `GET /api/documents/:id/content` serves an original file. `POST /api/documents/:id/extract` processes earlier imports whose extraction is still pending; repeating it preserves completed processing and user data.

`PATCH /api/documents/:id/review` accepts `{ revision, fields }` as JSON. The API validates required fields, calendar dates, currency, integer cents, and matching totals independently of the form. Successful validation records `reviewed`, a review timestamp, and the next revision. Invalid input returns 400; a stale revision returns 409 without changing stored data. API errors use a structured code and message.

Each document has its own directory under `apps/api/.data/documents`, containing `original` and `document.json`. Metadata includes file information, status, extracted fields, extraction outcome, revision, and review timestamp. Earlier metadata-only records are read as pending imports without replacing originals. Processing moves a document from `uploaded` to `needs_review`. `DATA_DIR` overrides the storage directory. Originals and metadata survive page reloads and API restarts and are ignored by Git.

The API depends on a `DocumentStore` interface. Its local implementation identifies exact duplicates by SHA-256, writes both files into a temporary directory, then publishes the complete directory by renaming it. Concurrent identical uploads keep the first complete document. Validation rejects an invalid selection before any writes; an unexpected storage failure may leave earlier documents in a batch imported, so retrying safely reuses them. Interrupted staging directories are ignored by the collection.

JSON storage is intended for this small local workspace. Azure deployment will require durable storage behind the same interface; the API container's filesystem is not the planned persistent store.

Metadata changes are serialized per document within one API process, check the expected revision, and replace the JSON through a flushed temporary file and rename. Windows destination locks receive a bounded retry. A stale revision cannot overwrite newer fields. This local adapter does not coordinate multiple API processes; a future shared-storage adapter must enforce the same revision check atomically.

## Architecture

This repository is a pnpm monorepo. **Applications** run independently; **packages** provide reusable code consumed by those applications.

| Directory            | Responsibility                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `apps/host`          | React application shell, navigation, and the document collection workflow.                     |
| `apps/review`        | Review microfrontend with its own development server and build; exposes `review/ReviewModule`. |
| `apps/api`           | Express API for imports, PDF/OCR extraction, review persistence, listing, and original access. |
| `packages/contracts` | Framework-independent types for review props, API query parameters, and responses.             |
| `packages/ui`        | Shared React components, button variants, styles, and locally bundled fonts.                   |
| `config`             | Common Webpack configuration and HTML template used by both frontends.                         |
| `tests`              | Shared test setup; behavior tests live beside the code they exercise.                          |

Each workspace has its own `package.json`. pnpm links `"@ordo/ui": "workspace:*"` to the local package, which is included at build time. Shared package changes require rebuilding their consumers. Dependencies, build output, and local caches are excluded from Git.

`@ordo/ui` exports buttons, badges, filter chips, icons, empty states, form fields, and a shared application shell. `Button` supports primary, secondary, and ghost variants, two sizes, native button props, and `type="button"` by default. Navigation links use the same appearance through `buttonClassName`, keeping the UI package independent of React Router. `TextField` and `SelectField` associate native controls with labels, hints, and validation errors, and accept React Hook Form registration through native refs and events.

Components use Tailwind utilities. `@ordo/ui/theme.css` provides fonts, Preflight, theme tokens, and base styles. Only the document owner imports it: the host bootstrap or Review's standalone bootstrap. Theme variables use `static` so they remain available to independently compiled utilities.

Each frontend's `src/styles.css` references the theme without emitting it and generates utilities from its own sources and `packages/ui/src`. Review nests its utility selectors under `.ordo-review`, used by the exposed module and standalone page. Its utilities cannot restyle the host when the remote loads, including after returning to Documents. The exposed module does not inject another theme, reset, or set of fonts. Both applications still rely on compatible shared theme tokens; this is selector scoping, not full CSS isolation.

### How the microfrontend loads

```mermaid
flowchart LR
    Host["Host :3000"] -->|"Loads ReviewModule at runtime"| Review["Review :3001"]
    Review -->|"Calls onSave / onClose"| Host
    UI["Shared UI package"] -.->|"Included at build time"| Host
    UI -.->|"Included at build time"| Review
```

1. Review's Webpack `exposes` publishes `ReviewModule.tsx` through a generated `remoteEntry.js`.
2. The host's `remotes` maps `review` to that URL. `React.lazy(() => import('review/ReviewModule'))` loads the component asynchronously.
3. The host fetches the selected document and renders Review with typed data, its original URL, and callbacks. `onSave` persists corrections through the host; `onClose` returns to Documents.

`Suspense` handles loading; an error boundary handles remote failures. React and React DOM are shared singletons, initialized through the asynchronous `index.ts` → `bootstrap.tsx` entry. `remotes.d.ts` supplies compile-time types, not runtime validation.

Review also has a standalone development page, initially showing its empty state. The host uses the exposed component without running that page's `createRoot()`. Use the host to exercise real documents, or the module's provider-free tests to inspect form behavior independently.

### Boundaries and configuration

The host owns navigation, Review owns its interface, and the API owns processing. Applications communicate through public contracts. Shared packages contain no application state. Extraction rules are separate from PDF.js and Express; form conversion and validation are separate from React components. The API independently validates every save request.

`ReviewModuleProps` accepts either an empty state with `onClose`, or document details, an original URL, and typed `onSave`/`onClose` callbacks. Optional `saveLabel` and `saveHint` describe the host's next action. The host owns requests, save mutations, and cache invalidation; Review owns its React Hook Form draft, validation, and feedback. `onSave` resolves with the saved document or rejects with an error. Review does not import the host's query client, endpoints, or router; its behavior tests exercise the same props without either provider.

The review form uses decimal strings for editing and converts them to integer cents before saving. It requires a supplier, document reference, real calendar date, supported currency, and non-negative amounts with at most two decimal places. Subtotal plus tax must equal the total. Failed saves preserve the draft; successful saves reset the form to the returned fields and revision. Background data updates do not reset a draft. A newer revision disables saving until the user reopens the document. Changing document IDs starts a fresh form.

The common Webpack factory handles TypeScript, CSS, fonts, and federation. Each frontend supplies its name, port, and exposed or consumed modules. Query dependencies form a separate chunk. Frontends have separate builds and can be deployed independently while their contracts and shared dependencies remain compatible.

Root scripts coordinate checks: strict TypeScript settings come from `tsconfig.base.json`, with ESLint, Prettier, and Vitest for code quality, formatting, and behavior tests. Type checking runs separately from Webpack transpilation.

Across all applications and shared packages, custom React hooks live in a `hooks` directory. Each hook's filename matches its export, such as `useTypedQuery.ts`, with tests alongside it. Conditional JSX rendering uses explicit ternaries (`condition ? content : null`); ESLint flags short-circuit rendering with `&&`.

### Navigation

One React Router `BrowserRouter` runs in the host. `/` redirects to `/documents`; `/review/:documentId` opens a selected document, and `/review` shows the empty review state. Unknown pages and unavailable documents have recovery screens. Direct links, refresh, and browser history are supported. `App.tsx` declares routes; page components compose screens.

Review stays router-independent through `onClose`. Vitest navigation tests use the actual review component through a local alias; browser checks verify network-based federation.

Opening a document card starts an individual review: **Save and return** validates it and opens `/documents?status=reviewed` with a confirmation. **Open review** in the summary starts a queue at `/review/:documentId?mode=queue`. **Save and next** validates the current document and opens the next unreviewed file; **Save and finish** returns to Reviewed when the queue is empty. The URL preserves queue mode on refresh. Queue counts come from the collection, and already reviewed documents are skipped.

`useReviewFlow` coordinates these transitions in the host. It checks the refreshed collection after a successful save and announces the saved and next filenames in a dismissible, focused confirmation banner, including while the next document loads. If the queue cannot be refreshed, the user returns to Reviewed with confirmation that the save succeeded. Failed saves preserve the current document and draft. Leaving the page during a save prevents a later queue transition from taking over navigation.

### API requests and cache

One TanStack Query client is created above the router in `bootstrap.tsx`, preserving cache across navigation. The real `GET /api/health` request demonstrates loading, availability, connection, and retry states.

| Host source directory      | Responsibility                                                                  |
| -------------------------- | ------------------------------------------------------------------------------- |
| `app`                      | Application-level setup, including query defaults.                              |
| `pages`                    | Route-level screen composition.                                                 |
| `api`                      | Typed endpoint catalog, query options, JSON transport, and response validation. |
| `hooks`                    | Shared React hooks, named after their exports, such as `useTypedQuery.ts`.      |
| `features/documents`       | Document cards, filters, selection validation, and import/workspace hooks.      |
| `features/document-review` | Document loading, preparation of earlier imports, saves, and cache updates.     |
| `features/service-health`  | Service status UI and its behavior tests.                                       |

Components call `useTypedQuery` with a registered GET endpoint. `ApiQueries` in `@ordo/contracts` associates each endpoint with its parameters and response; the host catalog supplies its URL builder and runtime decoder. Responses enter as `unknown` and are validated before success. Query cancellation reaches `fetch` through `AbortSignal`.

The API also imports `ServiceHealthResponse` from `@ordo/contracts` to type the health route's Express response. Both sides check the same response contract at compile time; the frontend decoder still validates the actual JSON at runtime.

```tsx
const health = useTypedQuery('serviceHealth');
// health.data: ServiceHealthResponse | undefined

const status = useTypedQuery('serviceHealth', undefined, {
  select: (response) => response.status,
  staleTime: 60_000,
});
// status.data: 'ok' | undefined
```

Endpoint parameters are inferred and required when declared. The hook retains options such as `enabled`, `select`, and `staleTime`; it owns the query function and cache key. Initial cache data and custom key hashing are excluded. `getTypedQueryOptions` supplies the same typed key and request for prefetching or invalidation. Compile-time tests reject unknown endpoints, incorrect parameters, and incompatible responses.

Data stays fresh for 30 seconds; inactive cache entries expire after 5 minutes. Stale queries refetch on mount, focus, or reconnection. Network and HTTP 5xx failures retry once; HTTP 4xx and invalid responses do not. Cache is memory-only, with no polling.

Keys follow `['api', endpoint, params]`, separating endpoint and parameter combinations. `serviceHealth`, `documents`, and `document` are registered; document details require an `id`. New queries require a contract, URL builder, and decoder. TanStack Query owns server state; React owns transient UI state. Review makes no API requests and does not consume the host's query client.

`useTypedMutation` follows the same endpoint-based approach for writes. The mutation catalog owns the request and response decoder, while the hook exposes typed variables, results, and callbacks. The upload input uses browser `File` objects, so its variable type lives in the host; response types are shared through `@ordo/contracts`. Uploads use multipart form data and are not retried automatically. Feature hooks own invalidation of affected queries.

`useDocumentUpload` validates the selection, reports upload and duplicate outcomes, and invalidates the document collection after each attempt. This also reveals any files saved before an unexpected batch failure. Successful uploads clear search and the status filter so the imported documents are visible. Example metadata lives only in `tests/fixtures` and is not used by the running application.

`useDocumentReview` loads details and prepares earlier pending imports once when opened. Successful extraction and review mutations cancel stale detail requests, update the typed detail cache without replacing a newer revision, update the cached collection's status, and invalidate the collection. A conflicting save refreshes details while Review retains the draft. Failed background reads do not unmount an open form. The save callback resolves after cache updates, so returning to Documents shows the saved status even when the collection refresh fails.

## Stack

- React and TypeScript with strict checking
- Webpack 5 and Module Federation
- React Router for URL-based navigation
- TanStack Query for server state, requests, and caching
- React Hook Form for the review draft and validation
- Tailwind CSS 4 through PostCSS, with shared theme tokens and responsive utilities
- Vitest and React Testing Library for user-facing behavior
- ESLint and Prettier
- Node.js and Express
- pnpm workspaces with a committed lockfile

PDF.js and Tesseract.js handle document reading in the API. Redux Toolkit will accompany a feature that needs it. Azure Pipelines and Azure hosting are planned; the API deployment must include its OCR models and a compatible native canvas package. Deployment is not configured yet.

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

Use **Add documents** or drop files onto the import card. Each selection accepts up to five PDF/PNG/JPEG files, 10 MB each. The collection displays image previews and a PDF placeholder; **Open original** opens the saved file in a new tab. Reimporting identical bytes reports a duplicate. **All documents**, **Needs review**, and **Reviewed** filters combine with file-name search. The selected status lives in the URL (`?status=needs_review` or `?status=reviewed`) and survives refresh and browser history. Successful imports clear filters so new files are visible; files are not grouped by format.

Select **Review** on a card for an individual review, or **Open review** in the summary to review pending documents one by one. Earlier imports are prepared on first opening. Check or complete the form; the save button explains whether it will return to Reviewed, open the next document, or finish the queue. Every successful save has a visible confirmation. The card becomes **Reviewed** and can be reopened with **View details**. Images and scanned PDFs show OCR suggestions with a reminder to check them, or a manual-entry explanation when reading fails. The original preview uses the browser's PDF viewer or an image; a new-tab link remains available if the browser cannot display it inline. Unsaved edits stay in the current form and are discarded when leaving the page.

The host proxies `/api` to the backend. Development servers bind to loopback by default.

Both `localhost` and `127.0.0.1` work locally. WebSocket clients follow the page's hostname while retaining their own frontend's port. Cross-origin assets are allowed only for the host's two local origins. Restart `pnpm dev` after changing Webpack configuration, then reload open pages.

```sh
pnpm check          # Formatting, lint, types, tests, and production builds
pnpm test:watch     # Watch behavior tests
pnpm format        # Apply formatting
pnpm --filter @ordo/host build
pnpm --filter @ordo/review build
pnpm --filter @ordo/api build
```

Build output lives in each application's `dist` directory. `REVIEW_REMOTE_URL` overrides the remote entry URL when building or starting the host; the default is `http://127.0.0.1:3001/remoteEntry.js`. The API accepts `PORT`, `HOST`, and `DATA_DIR`. Environment variables must be set in the shell; `.env` files are not loaded automatically.

Frontends currently expect hosting at the root of their respective origins. Future hosting must serve their assets, allow the host origin through CORS on review assets, route API requests, and provide the deployed review URL. The host needs an SPA fallback for page URLs, excluding assets and `/api`. Nothing is deployed by the development or build commands.
