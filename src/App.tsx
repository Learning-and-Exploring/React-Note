import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useNotes } from "./hooks/use-notes";
import { Home } from "./pages/Home";
import { AuthPage } from "./pages/auth";
import { SharedNotePage } from "./pages/shared-note";
import { NotFound } from "./pages/not-found";
import { ThemeProvider } from "./components/theme-provider";
import { ProtectedRoute } from "./routes/protected-route";

function AppRoutes() {
  const { isAuthenticated } = useNotes();

  return (
    <Routes>
      <Route path="/shared/:token" element={<SharedNotePage />} />
      <Route path="/notes/shared/:token" element={<SharedNotePage />} />
      <Route
        path="/auth"
        element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />}
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
