import { Link, NavLink, Navigate, Route, Routes } from 'react-router';
import { AppShell, OrdoBrand } from '@ordo/ui';
import { DocumentsPage } from './pages/DocumentsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ReviewPage } from './pages/ReviewPage';

export function App() {
  return (
    <AppShell
      brand={
        <Link to="/documents" aria-label="ORDO home" className="shrink-0 rounded-lg">
          <OrdoBrand />
        </Link>
      }
      navigation={
        <nav aria-label="Main navigation" className="self-stretch">
          <NavLink
            to="/documents"
            className="inline-flex h-full items-center border-b-3 border-transparent px-1 text-sm font-semibold text-plum-100 transition-colors hover:text-white aria-[current=page]:border-plum-200 aria-[current=page]:text-white"
          >
            Documents
          </NavLink>
        </nav>
      }
      aside={<span className="text-xs text-plum-200">A little less paperwork.</span>}
    >
      <Routes>
        <Route path="/" element={<Navigate to="/documents" replace />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/review/:documentId" element={<ReviewPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
