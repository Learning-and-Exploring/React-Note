import { useNotes } from "./hooks/use-notes";
import { Home } from "./pages/Home";
import { AuthPage } from "./pages/auth";
import { SharedNotePage } from "./pages/shared-note";
import { ThemeProvider } from "./components/theme-provider";

function extractShareToken() {
  if (typeof window === "undefined") return null;

  const pathname = window.location.pathname;
  const match = pathname.match(/\/(?:notes\/)?shared\/([^/]+)/i);
  return match?.[1] ?? null;
}

function App() {
  const shareToken = extractShareToken();
  const { isAuthenticated } = useNotes();

  if (shareToken) {
    return <SharedNotePage shareToken={shareToken} />;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <Home />;
}

function Root() {
  return (
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}

export default Root;
