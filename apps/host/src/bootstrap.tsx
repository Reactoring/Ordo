import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import '@ordo/ui/theme.css';
import './styles.css';
import { App } from './App';
import { createQueryClient } from './app/query-client';

const root = document.getElementById('root');
if (!root) throw new Error('The application root element is missing.');

const queryClient = createQueryClient();

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
