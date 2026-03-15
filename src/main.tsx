import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { NotesProvider } from "@features/notes/context/notes-provider";
import { Provider } from "react-redux";
import { store } from "@core/store";
import { TooltipProvider } from "@/components/ui/tooltip";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <NotesProvider>
        <TooltipProvider delayDuration={200} skipDelayDuration={300}>
          <App />
        </TooltipProvider>
      </NotesProvider>
    </Provider>
  </StrictMode>
);