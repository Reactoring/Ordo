# ORDO

ORDO helps independent professionals collect purchase documents, review extracted information, and prepare an expense summary.

## Status

The project is at the planning stage. This repository currently contains the product scope. Application setup and UI implementation are the next steps.

## First release

The initial workflow supports a batch of up to five documents:

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

## Planned architecture

- **Workspace host:** document collection, navigation, filters, and batch status.
- **Review microfrontend:** document preview, editable extracted fields, and review actions.
- **Node.js API:** file processing, field extraction, and validation.

The host loads the review module at runtime through Module Federation. Each frontend has its own build and deployment. Integration uses explicit typed contracts, with state owned by each application.

Within each application, business rules remain separate from React components, HTTP handlers, and document-processing libraries.

## Planned stack

- React and TypeScript with strict checking
- Webpack 5 and Module Federation
- Redux Toolkit, React Hook Form, and Tailwind CSS
- React Testing Library for user-facing behavior
- ESLint and Prettier
- Node.js, PDF.js, and Tesseract.js
- Azure Pipelines for checks and deployment
- Azure hosting for the frontend applications and backend

The backend hosting service will be selected after verifying the OCR runtime requirements. Deployment is not configured yet.

## Development

Application commands will be documented when the development environment is initialized.
