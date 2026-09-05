import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <section className="workspace-panel">
      <p className="eyebrow">404</p>
      <h1>Page not found</h1>
      <p>This page does not exist. You can return to your documents.</p>
      <div className="actions">
        <Link className="button button-secondary" to="/documents">
          Back to documents
        </Link>
      </div>
    </section>
  );
}
