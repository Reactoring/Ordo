import { Navigate, Route, Routes } from 'react-router';
import { OrdoBrand } from '@ordo/ui';
import { DocumentsPage } from './pages/DocumentsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ReviewPage } from './pages/ReviewPage';

export function App() {
  return (
    <>
      <header className="app-header">
        <OrdoBrand />
        <span>Purchase documents</span>
      </header>
      <main className="workspace">
        <Routes>
          <Route path="/" element={<Navigate to="/documents" replace />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </>
  );
}
