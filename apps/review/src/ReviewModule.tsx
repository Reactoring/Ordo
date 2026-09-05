import type { ReviewModuleProps } from '@ordo/contracts';
import { Button } from '@ordo/ui';
import '@ordo/ui/styles.css';

export default function ReviewModule({ onClose }: ReviewModuleProps) {
  return (
    <section className="workspace-panel">
      <p className="eyebrow">Document review</p>
      <h1>No document selected</h1>
      <p>Choose a document from your library to review its details.</p>
      <div className="actions">
        <Button variant="secondary" onClick={onClose}>
          Back to documents
        </Button>
      </div>
    </section>
  );
}
