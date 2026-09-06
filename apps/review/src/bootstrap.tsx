import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppShell } from '@ordo/ui';
import '@ordo/ui/theme.css';
import ReviewModule from './ReviewModule';

const root = document.getElementById('root');
if (!root) throw new Error('The application root element is missing.');

createRoot(root).render(
  <StrictMode>
    <div className="ordo-review">
      <AppShell navigation={<span className="text-sm font-semibold">Document review</span>}>
        <ReviewModule onClose={() => window.location.assign(ORDO_HOST_URL)} />
      </AppShell>
    </div>
  </StrictMode>,
);
