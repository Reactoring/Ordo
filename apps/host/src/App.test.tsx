import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from './App';

function CurrentPath() {
  return <output aria-label="Current path">{useLocation().pathname}</output>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CurrentPath />
      <App />
    </MemoryRouter>,
  );
}

describe('workspace navigation', () => {
  it('redirects the home URL and navigates through review using the public callback', async () => {
    const user = userEvent.setup();
    renderAt('/');

    expect(await screen.findByRole('heading', { name: 'Documents, in order.' })).toBeVisible();
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/documents');

    await user.click(screen.getByRole('link', { name: 'Open review workspace' }));
    expect(await screen.findByRole('heading', { name: 'No document selected' })).toBeVisible();
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/review');

    await user.click(screen.getByRole('button', { name: 'Back to documents' }));
    expect(await screen.findByRole('heading', { name: 'Documents, in order.' })).toBeVisible();
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/documents');
  });

  it('opens a direct review URL and returns to documents without requiring previous history', async () => {
    const user = userEvent.setup();
    renderAt('/review');

    expect(await screen.findByRole('heading', { name: 'No document selected' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Back to documents' }));
    expect(screen.getByLabelText('Current path')).toHaveTextContent('/documents');
  });

  it('provides a way back when a URL does not match a page', async () => {
    const user = userEvent.setup();
    renderAt('/missing-page');

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Back to documents' }));
    expect(screen.getByRole('heading', { name: 'Documents, in order.' })).toBeVisible();
  });
});
