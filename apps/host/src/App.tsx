import { lazy, Suspense, useState } from 'react';
import { OrdoBrand } from '@ordo/ui';
import { RemoteBoundary } from './RemoteBoundary';

const ReviewModule = lazy(() => import('review/ReviewModule'));

export function App() {
  const [reviewIsOpen, setReviewIsOpen] = useState(false);

  return (
    <>
      <header className="app-header">
        <OrdoBrand />
        <span>Purchase documents</span>
      </header>
      <main className="workspace">
        {reviewIsOpen ? (
          <RemoteBoundary onClose={() => setReviewIsOpen(false)}>
            <Suspense fallback={<p role="status">Opening review…</p>}>
              <ReviewModule onClose={() => setReviewIsOpen(false)} />
            </Suspense>
          </RemoteBoundary>
        ) : (
          <section className="workspace-panel">
            <p className="eyebrow">Your workspace</p>
            <h1>Documents, in order.</h1>
            <p>No documents yet. Your purchase documents will appear here.</p>
            <div className="actions">
              <button className="button" onClick={() => setReviewIsOpen(true)}>
                Open review workspace
              </button>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
