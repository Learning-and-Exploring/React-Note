import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  noteService,
  type CreateNotePayload,
  type Note,
  type UpdateNotePayload,
} from "../services/note-service";
import { authService } from "../services/auth-service";
import {
  clearToken as clearTokenAction,
  setToken as setTokenAction,
} from "../store/auth-slice";
import {
  selectAuthToken,
  selectIsAuthenticated,
  type AppDispatch,
} from "../store";

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
  createNote: (payload: CreateNotePayload) => Promise<Note | null>;
  updateNote: (id: number, payload: UpdateNotePayload) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  toggleFavorite: (id: number) => Promise<void>;
  shareNote: (id: number) => Promise<string | null>;
  unshareNote: (id: number) => Promise<boolean>;
  clearSelection: () => void;
  register: (payload: RegisterInput) => Promise<boolean>;
  login: (payload: LoginInput) => Promise<boolean>;
  logout: () => void;
};

export const NotesContext = createContext<NotesContextValue | undefined>(undefined);

export function NotesProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector(selectAuthToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setToken = useCallback((nextToken: string) => {
    if (nextToken) {
      dispatch(setTokenAction(nextToken));
    } else {
      dispatch(clearTokenAction());
    }
  }, [dispatch]);

  const runWithState = useCallback(async (task: () => Promise<void>) => {
    setLoading(true);
    setError(null);

    try {
      await task();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (payload: RegisterInput) => {
      return runWithState(async () => {
        await authService.register(payload);
      });
    },
    [runWithState]
  );

  const login = useCallback(
    async (payload: LoginInput) => {
      return runWithState(async () => {
        const nextToken = await authService.login(payload);
        setToken(nextToken);
      });
    },
    [runWithState, setToken]
  );

  const logout = useCallback(() => {
    const doLogout = async () => {
      if (token) {
        try {
          await authService.logout(token);
        } catch (err) {
          // Ignore logout API failures to allow client-side sign-out
          console.warn("Logout API failed", err);
        }
      }

      setToken("");
      setNotes([]);
      setSelectedNote(null);
      setError(null);
    };

    void doLogout();
  }, [setToken, token]);

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
        return null;
      }

      let createdNote: Note | null = null;

      const ok = await runWithState(async () => {
        const created = await noteService.create(payload, token);
        createdNote = created;
        setNotes((current) => [created, ...current]);
      });

      return ok ? createdNote : null;
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

  const toggleFavorite = useCallback(
    async (id: number) => {
      if (!token) {
        setError("Token is required");
        return;
      }

      await runWithState(async () => {
        const updated = await noteService.toggleFavorite(id, token);

        setNotes((current) =>
          current.map((item) =>
            item.id === id ? { ...item, isFavorite: updated.isFavorite } : item
          )
        );

        setSelectedNote((current) =>
          current && current.id === id
            ? { ...current, isFavorite: updated.isFavorite }
            : current
        );
      });
    },
    [token, runWithState]
  );

  const shareNote = useCallback(
    async (id: number) => {
      if (!token) {
        setError("Token is required");
        return null;
      }

      let link: string | null = null;
      const ok = await runWithState(async () => {
        const { shareUrl } = await noteService.share(id, token);
        link = shareUrl || null;
      });

      return ok ? link : null;
    },
    [token, runWithState]
  );

  const unshareNote = useCallback(
    async (id: number) => {
      if (!token) {
        setError("Token is required");
        return false;
      }

      return runWithState(async () => {
        await noteService.unshare(id, token);
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
      toggleFavorite,
      shareNote,
      unshareNote,
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
      toggleFavorite,
      shareNote,
      unshareNote,
      register,
      login,
      logout,
    ]
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}
