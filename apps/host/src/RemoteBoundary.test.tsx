import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RemoteBoundary } from './RemoteBoundary';

function UnavailableReview(): never {
  throw new Error('The review module could not be loaded.');
}

describe('review module isolation', () => {
  it('keeps navigation available when the review module fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <>
        <header>ORDO</header>
        <RemoteBoundary onClose={onClose}>
          <UnavailableReview />
        </RemoteBoundary>
      </>,
    );

    expect(screen.getByRole('banner')).toHaveTextContent('ORDO');
    expect(screen.getByRole('alert')).toHaveTextContent('Review is temporarily unavailable');
    await user.click(screen.getByRole('button', { name: 'Back to documents' }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
