import { Component, type ReactNode } from 'react';

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
            <button className="button" onClick={() => window.location.reload()}>
              Reload page
            </button>
            <button className="button button-secondary" onClick={this.props.onClose}>
              Back to documents
            </button>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}
