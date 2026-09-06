import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DocumentDetails, ReviewDocumentInput } from '@ordo/contracts';
import ReviewModule from './ReviewModule';

const document: DocumentDetails = {
  id: 'a'.repeat(64),
  fileName: 'coworking.pdf',
  fileType: 'PDF',
  sizeBytes: 1024,
  uploadedAt: '2026-09-06T10:00:00.000Z',
  status: 'needs_review',
  revision: 1,
  reviewedAt: null,
  extraction: { status: 'extracted', message: 'Check the suggested values against the original.' },
  fields: {
    supplier: 'Cedar Workspace',
    invoiceNumber: 'INV-42',
    invoiceDate: '2026-09-02',
    currency: 'EUR',
    subtotalCents: 12500,
    taxCents: 2500,
    totalCents: 15000,
  },
};
const saved = {
  ...document,
  status: 'reviewed' as const,
  revision: 2,
  reviewedAt: '2026-09-06T11:00:00.000Z',
};
const originalUrl = '/api/documents/example/content';
afterEach(cleanup);

describe('review module', () => {
  it('edits and saves through the public callback without a router or query provider', async () => {
    const onSave = vi.fn<(input: ReviewDocumentInput) => Promise<DocumentDetails>>();
    let finish: ((result: DocumentDetails) => void) | undefined;
    onSave.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <ReviewModule
        document={document}
        originalUrl={originalUrl}
        onSave={onSave}
        onClose={onClose}
      />,
    );
    expect(screen.getByTitle('Original coworking.pdf')).toHaveAttribute('src', originalUrl);
    expect(screen.getByLabelText('Subtotal (before tax)')).toHaveValue('125.00');
    await user.clear(screen.getByLabelText('Supplier'));
    await user.type(screen.getByLabelText('Supplier'), 'Corrected supplier');
    await user.click(screen.getByRole('button', { name: 'Save and validate' }));
    expect(onSave).toHaveBeenCalledWith({
      revision: 1,
      fields: { ...document.fields, supplier: 'Corrected supplier' },
    });
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled();
    expect(screen.getByLabelText('Supplier')).toBeDisabled();
    await act(async () =>
      finish?.({ ...saved, fields: { ...saved.fields, supplier: 'Corrected supplier' } }),
    );
    expect(await screen.findByText('Changes saved. This document is reviewed.')).toBeVisible();
    onSave.mockResolvedValue({ ...saved, revision: 3 });
    await user.click(screen.getByRole('button', { name: 'Save and validate' }));
    expect(onSave).toHaveBeenLastCalledWith(expect.objectContaining({ revision: 2 }));
    await user.click(screen.getByRole('button', { name: 'Back to documents' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('links validation errors to fields and does not submit inconsistent totals', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    render(
      <ReviewModule
        document={document}
        originalUrl={originalUrl}
        onSave={onSave}
        onClose={() => {}}
      />,
    );
    await user.clear(screen.getByLabelText('Supplier'));
    await user.clear(screen.getByLabelText('Total (including tax)'));
    await user.type(screen.getByLabelText('Total (including tax)'), '149.99');
    await user.click(screen.getByRole('button', { name: 'Save and validate' }));
    expect(screen.getByLabelText('Supplier')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Total (including tax)')).toHaveAccessibleDescription(
      'Subtotal plus tax must equal the total.',
    );
    expect(screen.getByLabelText('Supplier')).toHaveFocus();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('preserves corrections after a failed save and retries the same revision', async () => {
    const onSave = vi
      .fn<(input: ReviewDocumentInput) => Promise<DocumentDetails>>()
      .mockRejectedValueOnce(new Error('The service is unavailable.'))
      .mockResolvedValue(saved);
    const user = userEvent.setup();
    render(
      <ReviewModule
        document={document}
        originalUrl={originalUrl}
        onSave={onSave}
        onClose={() => {}}
      />,
    );
    await user.type(screen.getByLabelText('Document reference'), '-NEW');
    await user.click(screen.getByRole('button', { name: 'Save and validate' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The service is unavailable.');
    expect(screen.getByLabelText('Document reference')).toHaveValue('INV-42-NEW');
    await user.click(screen.getByRole('button', { name: 'Save and validate' }));
    await screen.findByText('Changes saved. This document is reviewed.');
    expect(onSave.mock.calls.map(([input]) => input.revision)).toEqual([1, 1]);
  });

  it('keeps the draft when newer server data arrives and blocks stale submission', async () => {
    const onSave = vi.fn();
    const user = userEvent.setup();
    const props = { originalUrl, onSave, onClose: () => {} };
    const view = render(<ReviewModule {...props} document={document} />);
    await user.type(screen.getByLabelText('Supplier'), ' edited');
    view.rerender(<ReviewModule {...props} document={{ ...document, revision: 2 }} />);
    expect(screen.getByLabelText('Supplier')).toHaveValue('Cedar Workspace edited');
    expect(screen.getByRole('button', { name: 'Save and validate' })).toBeDisabled();
    expect(screen.getByRole('alert')).toHaveTextContent('A newer version is available.');
    view.rerender(
      <ReviewModule
        {...props}
        document={{ ...document, id: 'b'.repeat(64), fileName: 'another.pdf' }}
      />,
    );
    await waitFor(() => expect(screen.getByLabelText('Supplier')).toHaveValue('Cedar Workspace'));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
