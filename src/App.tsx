import { useNotes } from "./hooks/use-notes";
import { Home } from "./pages/Home";
import { AuthPage } from "./pages/auth";
import { ThemeProvider } from "./components/theme-provider";

function App() {
  const { isAuthenticated } = useNotes();

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
