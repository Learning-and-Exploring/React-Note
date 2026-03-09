import { useNotes } from "./hooks/use-notes";
import { Home } from "./pages/Home";
import { AuthPage } from "./pages/auth";

function App() {
  const { isAuthenticated } = useNotes();

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <Home />;
}

export default App;
