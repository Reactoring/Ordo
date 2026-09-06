import { Button, EmptyState, Icon } from '@ordo/ui';
import { DocumentCard } from '../features/documents/components/DocumentCard';
import { DocumentToolbar } from '../features/documents/components/DocumentToolbar';
import { ReviewSummary } from '../features/documents/components/ReviewSummary';
import { UploadCard } from '../features/documents/components/UploadCard';
import { useDocumentsWorkspace } from '../features/documents/hooks/useDocumentsWorkspace';
import { useDocumentUpload } from '../features/documents/hooks/useDocumentUpload';
import { ServiceStatus } from '../features/service-health/ServiceStatus';

export function DocumentsPage() {
  const workspace = useDocumentsWorkspace();
  const upload = useDocumentUpload(workspace.query.data?.uploadLimits, workspace.resetFilters);
  const hasDocuments = workspace.counts.all > 0;
  const hasResults = workspace.visibleDocuments.length > 0;
  const uploadCard = (
    <UploadCard
      limits={workspace.query.data?.uploadLimits}
      isPending={upload.isPending}
      error={upload.error}
      summary={upload.summary}
      onFilesSelected={upload.submitFiles}
    />
  );
  return (
    <div>
      <div className="mb-7 grid items-center gap-6 lg:grid-cols-[1.2fr_1fr] lg:gap-10">
        <div>
          <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-plum-600 uppercase">
            Your workspace, a little clearer
          </p>
          <h1 className="text-[clamp(2rem,4vw,3.25rem)] leading-[1.12] font-semibold tracking-[-0.045em]">
            Documents, in order.
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
            One home for your invoices. One less thing on your mind.
          </p>
        </div>
        <ReviewSummary
          total={workspace.counts.all}
          remaining={workspace.counts.needsReview}
          nextDocumentId={workspace.nextDocumentId}
        />
      </div>
      <DocumentToolbar
        counts={workspace.counts}
        status={workspace.status}
        onStatusChange={workspace.setStatus}
        search={workspace.search}
        onSearchChange={workspace.setSearch}
      />
      {workspace.query.isError ? (
        <div
          role="alert"
          className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white p-4 text-sm"
        >
          <p>We couldn’t load your documents. Please try again.</p>
          <Button
            variant="secondary"
            size="sm"
            disabled={workspace.query.isFetching}
            onClick={() => void workspace.query.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : null}
      <p role="status" className="mt-5 mb-3 text-xs text-muted">
        {workspace.query.isPending
          ? 'Loading documents…'
          : `Showing ${workspace.visibleDocuments.length} of ${workspace.counts.all} ${workspace.counts.all === 1 ? 'document' : 'documents'}`}
      </p>
      {hasResults ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {workspace.visibleDocuments.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
          {uploadCard}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-line bg-white">
            {workspace.query.isPending ? (
              <div className="flex min-h-72 items-center justify-center text-sm text-muted">
                Getting your workspace ready…
              </div>
            ) : workspace.query.isError ? (
              <EmptyState
                icon={<Icon name="document" className="size-7" />}
                title="Your documents are unavailable"
                description="Reconnect to the document service to see your saved files."
              />
            ) : hasDocuments && !workspace.search.trim() && workspace.status !== 'all' ? (
              <EmptyState
                icon={<Icon name="stack" className="size-7" />}
                title={
                  workspace.status === 'reviewed'
                    ? 'No reviewed documents yet'
                    : 'Everything is reviewed'
                }
                description={
                  workspace.status === 'reviewed'
                    ? 'Validate a document and it will appear here.'
                    : 'You’re all caught up. Your validated documents are in Reviewed.'
                }
              >
                <Button variant="secondary" onClick={workspace.resetFilters}>
                  Show all documents
                </Button>
              </EmptyState>
            ) : hasDocuments ? (
              <EmptyState
                icon={<Icon name="search" className="size-7" />}
                title="No matching documents"
                description="Try another file name or clear your search."
              >
                <Button variant="secondary" onClick={workspace.resetSearch}>
                  Clear search
                </Button>
              </EmptyState>
            ) : (
              <EmptyState
                icon={<Icon name="stack" className="size-7" />}
                title="A clean slate."
                description="Add your first purchase document. Your originals will stay here when you return."
              />
            )}
          </div>
          {uploadCard}
        </div>
      )}
      <footer className="mt-7 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">Collect. Review. Carry on.</p>
        <ServiceStatus />
      </footer>
    </div>
  );
}
