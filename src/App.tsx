import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import AdminLayout  from './layouts/AdminLayout';
import RequireAuth  from './admin/components/RequireAuth';

// Public pages
import HomePage         from './pages/HomePage';
import ProjectsPage     from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import AboutPage        from './pages/AboutPage';
import ContactPage      from './pages/ContactPage';
import GalleryPage      from './pages/GalleryPage';
import TestimonialsPage from './pages/TestimonialsPage';
import NotFoundPage     from './pages/NotFoundPage';

// Admin pages
import LoginPage           from './admin/pages/LoginPage';
import DashboardPage       from './admin/pages/DashboardPage';
import LeadsPage           from './admin/pages/LeadsPage';
import AdminProjectsPage   from './admin/pages/AdminProjectsPage';
import AdminMediaPage      from './admin/pages/AdminMediaPage';
import AdminTestimonialsPage from './admin/pages/AdminTestimonialsPage';

function App() {
  return (
    <Routes>
      {/* ── Public routes (Navbar + Footer + Lenis) ── */}
      <Route element={<PublicLayout />}>
        <Route path="/"                   element={<HomePage />} />
        <Route path="/projects"           element={<ProjectsPage />} />
        <Route path="/projects/:slug"     element={<ProjectDetailPage />} />
        <Route path="/about"              element={<AboutPage />} />
        <Route path="/gallery"            element={<GalleryPage />} />
        <Route path="/testimonials"       element={<TestimonialsPage />} />
        <Route path="/contact"            element={<ContactPage />} />
      </Route>

      {/* ── Admin: Login (unauthenticated) ── */}
      <Route path="/admin/login" element={<LoginPage />} />

      {/* ── Admin: Protected shell ── */}
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index            element={<DashboardPage />} />
        <Route path="leads"     element={<LeadsPage />} />
        <Route path="projects"  element={<AdminProjectsPage />} />
        <Route path="media"     element={<AdminMediaPage />} />
        <Route path="testimonials" element={<AdminTestimonialsPage />} />
      </Route>

      {/* Redirect /admin/* typos back into the admin area */}
      <Route path="/admin/*" element={<Navigate to="/admin" replace />} />

      {/* ── 404 ── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;