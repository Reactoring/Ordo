import { lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button, PageMessage } from '@ordo/ui';
import { RemoteBoundary } from '../RemoteBoundary';
import { useDocumentReview } from '../features/document-review/hooks/useDocumentReview';
import { useReviewFlow } from '../features/document-review/hooks/useReviewFlow';
import { ReviewConfirmation } from '../features/document-review/components/ReviewConfirmation';
import { documentContentUrl } from '../features/documents/format-document';

const ReviewModule = lazy(() => import('review/ReviewModule'));

export function ReviewPage() {
  const navigate = useNavigate();
  const { documentId } = useParams();
  const closeReview = () => void navigate('/documents');

  return (
    <div>
      <ReviewConfirmation />
      <RemoteBoundary onClose={closeReview}>
        <Suspense fallback={<p role="status">Opening review…</p>}>
          {documentId ? (
            <ConnectedReview key={documentId} documentId={documentId} onClose={closeReview} />
          ) : (
            <ReviewModule onClose={closeReview} />
          )}
        </Suspense>
      </RemoteBoundary>
    </div>
  );
}

function ConnectedReview({ documentId, onClose }: { documentId: string; onClose: () => void }) {
  const review = useDocumentReview(documentId);
  const flow = useReviewFlow(documentId, review.save);
  if (review.notFound) {
    return (
      <PageMessage
        title="Document not found"
        description="This document is unavailable. Choose another one from your workspace."
      >
        <Button onClick={onClose}>Back to documents</Button>
      </PageMessage>
    );
  }
  if (review.error) {
    return (
      <PageMessage
        role="alert"
        title="We couldn’t open this document"
        description={review.error.message}
      >
        <Button disabled={review.isRetrying} onClick={review.retry}>
          Try again
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Back to documents
        </Button>
      </PageMessage>
    );
  }
  if (review.isLoading || !review.document)
    return (
      <p role="status" className="py-12 text-center text-muted">
        Preparing your document for review…
      </p>
    );
  return (
    <div>
      {flow.isQueue ? (
        <div className="mb-5 rounded-xl border border-plum-200 bg-plum-50 px-4 py-3 text-sm text-plum-800">
          <p className="font-semibold">
            Review queue
            {flow.remaining !== undefined
              ? ` · ${flow.remaining} ${flow.remaining === 1 ? 'document' : 'documents'} remaining`
              : ''}
          </p>
          <p className="mt-1 text-xs leading-5">
            Each validation saves your changes and opens the next document.
          </p>
        </div>
      ) : null}
      <ReviewModule
        document={review.document}
        originalUrl={documentContentUrl(documentId)}
        onSave={flow.save}
        saveLabel={flow.saveLabel}
        saveHint={flow.saveHint}
        onClose={onClose}
      />
    </div>
  );
}
