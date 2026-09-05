import { Component, type ReactNode } from 'react';
import { Button } from '@ordo/ui';

interface RemoteBoundaryProps {
  children: ReactNode;
  onClose: () => void;
}

export class RemoteBoundary extends Component<RemoteBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="workspace-panel" role="alert">
          <h1>Review is temporarily unavailable</h1>
          <p>Your documents are still accessible. Reload the page to try again.</p>
          <div className="actions">
            <Button onClick={() => window.location.reload()}>Reload page</Button>
            <Button variant="secondary" onClick={this.props.onClose}>
              Back to documents
            </Button>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
