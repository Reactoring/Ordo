import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router';
import { RemoteBoundary } from '../RemoteBoundary';

const ReviewModule = lazy(() => import('review/ReviewModule'));

export function ReviewPage() {
  const navigate = useNavigate();
  const closeReview = () => void navigate('/documents');

  return (
    <RemoteBoundary onClose={closeReview}>
      <Suspense fallback={<p role="status">Opening review…</p>}>
        <ReviewModule onClose={closeReview} />
      </Suspense>
    </RemoteBoundary>
  );
}
