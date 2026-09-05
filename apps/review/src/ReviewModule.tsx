import type { ReviewModuleProps } from '@ordo/contracts';
import '@ordo/ui/styles.css';

export default function ReviewModule({ onClose }: ReviewModuleProps) {
  return (
    <section className="workspace-panel">
      <p className="eyebrow">Document review</p>
      <h1>No document selected</h1>
      <p>Choose a document from your library to review its details.</p>
      <div className="actions">
        <button className="button button-secondary" onClick={onClose}>
          Back to documents
        </button>
      </div>
    </section>
  );
}
