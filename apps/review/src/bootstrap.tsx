import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OrdoBrand } from '@ordo/ui';
import ReviewModule from './ReviewModule';

const root = document.getElementById('root');
if (!root) throw new Error('The application root element is missing.');

createRoot(root).render(
  <StrictMode>
    <header className="app-header">
      <OrdoBrand />
      <span>Document review</span>
    </header>
    <main className="workspace">
      <ReviewModule onClose={() => window.location.assign('http://127.0.0.1:3000')} />
    </main>
  </StrictMode>,
);
