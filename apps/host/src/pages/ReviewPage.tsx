import { lazy, Suspense } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Button, PageMessage } from '@ordo/ui';
import { RemoteBoundary } from '../RemoteBoundary';
import { useDocumentReview } from '../features/document-review/hooks/useDocumentReview';
import { documentContentUrl } from '../features/documents/format-document';

const ReviewModule = lazy(() => import('review/ReviewModule'));

export function ReviewPage() {
  const navigate = useNavigate();
  const { documentId } = useParams();
  const closeReview = () => void navigate('/documents');

  return (
    <RemoteBoundary onClose={closeReview}>
      <Suspense fallback={<p role="status">Opening review…</p>}>
        {documentId ? (
          <ConnectedReview key={documentId} documentId={documentId} onClose={closeReview} />
        ) : (
          <ReviewModule onClose={closeReview} />
        )}
      </Suspense>
    </RemoteBoundary>
  );
}

function ConnectedReview({ documentId, onClose }: { documentId: string; onClose: () => void }) {
  const review = useDocumentReview(documentId);
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
    <ReviewModule
      document={review.document}
      originalUrl={documentContentUrl(documentId)}
      onSave={review.save}
      onClose={onClose}
    />
  );
}
