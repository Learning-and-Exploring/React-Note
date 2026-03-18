import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useNotes } from "@features/notes/hooks/use-notes";
import { Home } from "@features/notes/pages/Home";
import { AuthPage } from "@features/auth/pages/auth";
import { SharedNotePage } from "@features/notes/pages/shared-note";
import { NotFound } from "@shared/pages/not-found";
import { ThemeProvider } from "@core/providers/theme-provider";
import { ProtectedRoute } from "@core/routes/protected-route";


function AppRoutes() {
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

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
