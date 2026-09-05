import { Link } from 'react-router';
import { buttonClassName } from '@ordo/ui';
import { ServiceStatus } from '../features/service-health/ServiceStatus';

export function DocumentsPage() {
  return (
    <section className="workspace-panel">
      <p className="eyebrow">Your workspace</p>
      <h1>Documents, in order.</h1>
      <p>No documents yet. Your purchase documents will appear here.</p>
      <div className="actions">
        <Link className={buttonClassName()} to="/review">
          Open review workspace
        </Link>
      </div>
      <ServiceStatus />
    </section>
  );
}
