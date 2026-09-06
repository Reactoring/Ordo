import type { ReviewModuleProps } from '@ordo/contracts';
import { Button, PageMessage } from '@ordo/ui';
import { ReviewWorkspace } from './features/review/components/ReviewWorkspace';
import './styles.css';

export default function ReviewModule(props: ReviewModuleProps) {
  if (props.document) {
    return (
      <div className="ordo-review">
        <ReviewWorkspace key={props.document.id} {...props} />
      </div>
    );
  }
  const { onClose } = props;
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
