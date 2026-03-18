import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useNotes } from "@features/notes/hooks/use-notes";
import { Home } from "@features/notes/pages/Home";
import { AuthPage } from "@features/auth/pages/auth";
import { SharedNotePage } from "@features/notes/pages/shared-note";
import { NotFound } from "@shared/pages/not-found";
import { ThemeProvider } from "@core/providers/theme-provider";
import { ProtectedRoute } from "@core/routes/protected-route";
import { NotesProvider } from "@features/notes/context/notes-provider";
import { AdminProvider } from "@features/admin/context/admin-provider";
import { useAdmin } from "@features/admin/hooks/use-admin";
import { AdminProtectedRoute } from "@features/admin/routes/admin-protected-route";
import { AdminAuthPage } from "@features/admin/pages/admin-auth";
import { AdminDashboardPage } from "@features/admin/pages/admin-dashboard";

function NotesAppRoutes() {
  const { authInitialized, isAuthenticated } = useNotes();

  return (
    <Routes>
      <Route path="/shared/:token" element={<SharedNotePage />} />
      <Route path="/notes/shared/:token" element={<SharedNotePage />} />
      <Route
        path="/auth"
        element={
          !authInitialized ? null : isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes/:id"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function NotesApp() {
  return (
    <NotesProvider>
      <NotesAppRoutes />
    </NotesProvider>
  );
}

function AdminAppRoutes() {
  const { authInitialized, isAuthenticated } = useAdmin();

  return (
    <Routes>
      <Route
        path="login"
        element={
          !authInitialized ? null : isAuthenticated ? <Navigate to="/admin" replace /> : <AdminAuthPage />
        }
      />
      <Route
        index
        element={
          <AdminProtectedRoute>
            <AdminDashboardPage />
          </AdminProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

function AdminApp() {
  return (
    <AdminProvider>
      <AdminAppRoutes />
    </AdminProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="*" element={<NotesApp />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
