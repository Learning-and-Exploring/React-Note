import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  noteService,
  type CreateNotePayload,
  type Note,
  type UpdateNotePayload,
} from "../services/note-service";
import { authService } from "../services/auth-service";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type NotesContextValue = {
  token: string;
  isAuthenticated: boolean;
  notes: Note[];
  selectedNote: Note | null;
  loading: boolean;
  error: string | null;
  fetchNotes: () => Promise<void>;
  fetchNoteById: (id: number) => Promise<void>;
  createNote: (payload: CreateNotePayload) => Promise<void>;
  updateNote: (id: number, payload: UpdateNotePayload) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  clearSelection: () => void;
  register: (payload: RegisterInput) => Promise<void>;
  login: (payload: LoginInput) => Promise<void>;
  logout: () => void;
};

export const NotesContext = createContext<NotesContextValue | undefined>(undefined);

const TOKEN_STORAGE_KEY = "note_app_token";

export function NotesProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string>(() =>
    localStorage.getItem(TOKEN_STORAGE_KEY) ?? ""
  );
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = Boolean(token);

  const setToken = useCallback((nextToken: string) => {
    setTokenState(nextToken);

    if (nextToken) {
      localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, []);

  const runWithState = useCallback(async (task: () => Promise<void>) => {
    setLoading(true);
    setError(null);

    try {
      await task();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (payload: RegisterInput) => {
      await runWithState(async () => {
        await authService.register(payload);
      });
    },
    [runWithState]
  );

  const login = useCallback(
    async (payload: LoginInput) => {
      await runWithState(async () => {
        const nextToken = await authService.login(payload);
        setToken(nextToken);
      });
    },
    [runWithState, setToken]
  );

  const logout = useCallback(() => {
    setToken("");
    setNotes([]);
    setSelectedNote(null);
    setError(null);
  }, [setToken]);

  const fetchNotes = useCallback(async () => {
    if (!token) {
      setNotes([]);
      return;
    }

    await runWithState(async () => {
      const data = await noteService.listMyNotes(token);
      setNotes(data);
    });
  }, [token, runWithState]);

  const fetchNoteById = useCallback(
    async (id: number) => {
      if (!token) return;

      await runWithState(async () => {
        const note = await noteService.getById(id, token);
        setSelectedNote(note);
      });
    },
    [token, runWithState]
  );

  const createNote = useCallback(
    async (payload: CreateNotePayload) => {
      if (!token) {
        setError("Token is required");
        return;
      }

      await runWithState(async () => {
        const created = await noteService.create(payload, token);
        setNotes((current) => [created, ...current]);
      });
    },
    [token, runWithState]
  );

  const updateNote = useCallback(
    async (id: number, payload: UpdateNotePayload) => {
      if (!token) {
        setError("Token is required");
        return;
      }

      await runWithState(async () => {
        const updated = await noteService.update(id, payload, token);

        setNotes((current) =>
          current.map((item) => (item.id === id ? { ...item, ...updated } : item))
        );

        setSelectedNote((current) =>
          current && current.id === id ? { ...current, ...updated } : current
        );
      });
    },
    [token, runWithState]
  );

  const deleteNote = useCallback(
    async (id: number) => {
      await runWithState(async () => {
        await noteService.softDelete(id, token || undefined);
        setNotes((current) => current.filter((item) => item.id !== id));

        setSelectedNote((current) => {
          if (!current) return null;
          return current.id === id ? null : current;
        });
      });
    },
    [token, runWithState]
  );

  const clearSelection = useCallback(() => {
    setSelectedNote(null);
  }, []);

  useEffect(() => {
    if (!token) return;

    void fetchNotes();
  }, [token, fetchNotes]);

  const value = useMemo<NotesContextValue>(
    () => ({
      token,
      isAuthenticated,
      notes,
      selectedNote,
      loading,
      error,
      fetchNotes,
      fetchNoteById,
      createNote,
      updateNote,
      deleteNote,
      clearSelection,
      register,
      login,
      logout,
    }),
    [
      token,
      isAuthenticated,
      notes,
      selectedNote,
      loading,
      error,
      fetchNotes,
      fetchNoteById,
      createNote,
      updateNote,
      deleteNote,
      clearSelection,
      register,
      login,
      logout,
    ]
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}
