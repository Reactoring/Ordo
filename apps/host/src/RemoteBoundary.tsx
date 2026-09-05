import { Component, type ReactNode } from 'react';
import { Button, PageMessage } from '@ordo/ui';

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
        <PageMessage
          role="alert"
          title="Review is temporarily unavailable"
          description="Your documents are still accessible. Reload the page to try again."
        >
          <Button onClick={() => window.location.reload()}>Reload page</Button>
          <Button variant="secondary" onClick={this.props.onClose}>
            Back to documents
          </Button>
        </PageMessage>
      );
    }

    return this.props.children;
  }
}
