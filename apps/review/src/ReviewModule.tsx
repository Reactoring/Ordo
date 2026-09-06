import type { ReviewModuleProps } from '@ordo/contracts';
import { Button, PageMessage } from '@ordo/ui';
import './styles.css';

export default function ReviewModule({ onClose }: ReviewModuleProps) {
  return (
    <div className="ordo-review">
      <PageMessage
        label="Document review"
        title="No document selected"
        description="Choose a document from your library to review its details."
      >
        <Button variant="secondary" onClick={onClose}>
          Back to documents
        </Button>
      </PageMessage>
    </div>
  );
}
