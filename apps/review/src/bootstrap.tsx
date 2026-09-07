import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@ordo/ui/theme.css';
import ReviewModule from './ReviewModule';

const root = document.getElementById('root');
if (!root) throw new Error('The application root element is missing.');

createRoot(root).render(
  <StrictMode>
    <div className="ordo-review">
      <main className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 lg:px-12 lg:py-10">
        <ReviewModule onClose={() => window.location.assign(ORDO_HOST_URL)} />
      </main>
    </div>
  </StrictMode>,
);
