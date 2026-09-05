import { Link } from 'react-router';
import { PageMessage, buttonClassName } from '@ordo/ui';

export function NotFoundPage() {
  return (
    <PageMessage
      label="404"
      title="Page not found"
      description="This page does not exist. You can return to your documents."
    >
      <Link className={buttonClassName({ variant: 'secondary' })} to="/documents">
        Back to documents
      </Link>
    </PageMessage>
  );
}
