import { Badge, Button, EmptyState, Icon } from '@ordo/ui';
import { DocumentCard } from '../features/documents/components/DocumentCard';
import { DocumentToolbar } from '../features/documents/components/DocumentToolbar';
import { ReviewSummary } from '../features/documents/components/ReviewSummary';
import { UploadCard } from '../features/documents/components/UploadCard';
import { useDocumentsWorkspace } from '../features/documents/hooks/useDocumentsWorkspace';
import { ServiceStatus } from '../features/service-health/ServiceStatus';

export function DocumentsPage() {
  const workspace = useDocumentsWorkspace();
  const hasDocuments = workspace.counts.all > 0;
  const hasResults = workspace.visibleDocuments.length > 0;

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
        <ReviewSummary count={workspace.counts['needs-review']} />
      </div>

      {workspace.showExamples ? (
        <div className="mb-6 grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2 border-y border-line py-3 sm:flex sm:flex-wrap">
          <Badge className="justify-self-start">Example documents</Badge>
          <p className="col-span-2 row-start-2 text-xs leading-5 text-muted sm:flex-1">
            Explore five sample invoices. No files have been uploaded.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="col-start-2 row-start-1"
            onClick={workspace.toggleExamples}
          >
            Clear examples
          </Button>
        </div>
      ) : null}

      <DocumentToolbar
        filter={workspace.filter}
        onFilterChange={workspace.setFilter}
        counts={workspace.counts}
        search={workspace.search}
        onSearchChange={workspace.setSearch}
      />
      <p role="status" className="mt-5 mb-3 text-xs text-muted">
        Showing {workspace.visibleDocuments.length} of {workspace.counts.all}{' '}
        {workspace.counts.all === 1 ? 'document' : 'documents'}
      </p>

      {hasResults ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {workspace.visibleDocuments.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
          <UploadCard />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-line bg-white">
            {hasDocuments ? (
              <EmptyState
                icon={<Icon name="search" className="size-7" />}
                title="No matching documents"
                description="Try another name, supplier or category, or clear your filters."
              >
                <Button variant="secondary" onClick={workspace.resetFilters}>
                  Clear filters
                </Button>
              </EmptyState>
            ) : (
              <EmptyState
                icon={<Icon name="stack" className="size-7" />}
                title="A clean slate."
                description="Your purchase documents will live here, with their details and review status in one place."
              >
                <Button variant="secondary" onClick={workspace.toggleExamples}>
                  Show examples
                  <Icon name="arrowRight" className="size-4" />
                </Button>
              </EmptyState>
            )}
          </div>
          <UploadCard />
        </div>
      )}

      <footer className="mt-7 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">Collect. Review. Carry on.</p>
        <ServiceStatus />
      </footer>
    </div>
  );
}
