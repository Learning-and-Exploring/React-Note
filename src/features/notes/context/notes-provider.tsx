import {
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
  type NotesPageMeta,
} from "../services/notes-service";
import { authService } from "@features/auth/auth-service";
import { deriveUserFromToken } from "@features/auth/auth-service";
import {
  clearToken as clearTokenAction,
  setAuthInitialized as setAuthInitializedAction,
  setSession as setSessionAction,
  setToken as setTokenAction,
} from "@core/store/auth-slice";
import {
  selectAuthInitialized,
  selectAuthToken,
  selectAuthUser,
  selectIsAuthenticated,
  type AppDispatch,
} from "@core/store";
import { NotesContext } from "./notes-context";

let authBootstrapPromise: Promise<string | null> | null = null;

function restoreSession() {
  if (!authBootstrapPromise) {
    authBootstrapPromise = authService.refresh().catch(() => null);
  }

  return authBootstrapPromise;
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector(selectAuthToken);
  const currentUser = useSelector(selectAuthUser);
  const authInitialized = useSelector(selectAuthInitialized);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notesMeta, setNotesMeta] = useState<NotesPageMeta | null>(null);
  const [hasMoreNotes, setHasMoreNotes] = useState(true);
  const [loadingMoreNotes, setLoadingMoreNotes] = useState(false);

  const getCurrentPageFromMeta = (meta: NotesPageMeta | null | undefined) => {
    if (!meta) return 1;
    return meta.currentPage ?? meta.page ?? 1;
  };

  const getPageCountFromMeta = (meta: NotesPageMeta | null | undefined) => {
    if (!meta) return 1;
    return meta.pageCount ?? meta.totalPages ?? 1;
  };

  const setToken = useCallback(
    (nextToken: string) => {
      if (nextToken) {
        dispatch(setTokenAction(nextToken));
      } else {
        dispatch(clearTokenAction());
      }
    },
    [dispatch]
  );

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
    async (payload: { name: string; email: string; password: string }) => {
      return runWithState(async () => {
        await authService.register(payload);
      });
    },
    [runWithState]
  );

  const login = useCallback(
    async (payload: { email: string; password: string }) => {
      return runWithState(async () => {
        const session = await authService.login(payload);
        dispatch(setSessionAction(session));
      });
    },
    [dispatch, runWithState]
  );

  const logout = useCallback(() => {
    const doLogout = async () => {
      if (token) {
        try {
          await authService.logout(token);
        } catch (err) {
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

  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      try {
        const nextToken = await restoreSession();
        if (!active) return;
        if (nextToken) {
          dispatch(
            setSessionAction({
              token: nextToken,
              user: deriveUserFromToken(nextToken),
            }),
          );
        } else {
          dispatch(clearTokenAction());
        }
      } finally {
        if (!active) return;
        dispatch(setAuthInitializedAction(true));
      }
    };

    void initializeAuth();

    return () => {
      active = false;
    };
  }, [dispatch]);

  const fetchNotes = useCallback(async () => {
    if (!authInitialized) {
      return;
    }
    if (!token) {
      setNotes([]);
      setNotesMeta(null);
      setHasMoreNotes(true);
      return;
    }
    await runWithState(async () => {
      const { data, meta } = await noteService.listMyNotes(token, 1);
      setNotes(data);
      setNotesMeta(meta ?? null);
      if (meta) {
        const hasNext =
          typeof meta.hasNextPage === "boolean"
            ? meta.hasNextPage
            : getCurrentPageFromMeta(meta) < getPageCountFromMeta(meta);
        setHasMoreNotes(hasNext);
      } else {
        setHasMoreNotes(false);
      }
    });
  }, [authInitialized, token, runWithState]);

  const fetchNextNotesPage = useCallback(async () => {
    if (!token || loadingMoreNotes || !hasMoreNotes) return;
    setLoadingMoreNotes(true);
    setError(null);
    try {
      const currentPage = getCurrentPageFromMeta(notesMeta);
      const nextPage = currentPage + 1;
      const { data, meta } = await noteService.listMyNotes(token, nextPage);
      setNotes((current) => {
        const existingIds = new Set(current.map((n) => n.id));
        const merged = [...current];
        for (const note of data) {
          if (!existingIds.has(note.id)) merged.push(note);
        }
        return merged;
      });
      setNotesMeta(meta ?? null);
      if (meta) {
        const hasNext =
          typeof meta.hasNextPage === "boolean"
            ? meta.hasNextPage
            : getCurrentPageFromMeta(meta) < getPageCountFromMeta(meta);
        setHasMoreNotes(hasNext);
      } else {
        setHasMoreNotes(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
    } finally {
      setLoadingMoreNotes(false);
    }
  }, [token, notesMeta, hasMoreNotes, loadingMoreNotes]);

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
      if (!token) { setError("Token is required"); return null; }
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
      if (!token) { setError("Token is required"); return; }
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
        setSelectedNote((current) =>
          current && current.id === id ? null : current
        );
      });
    },
    [token, runWithState]
  );

  const toggleFavorite = useCallback(
    async (id: number) => {
      if (!token) { setError("Token is required"); return; }
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
      if (!token) { setError("Token is required"); return null; }
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
      if (!token) { setError("Token is required"); return false; }
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
    if (!authInitialized || !token) return;
    void fetchNotes();
  }, [authInitialized, token, fetchNotes]);

  const value = useMemo(
    () => ({
      token,
      currentUser,
      isAuthenticated,
      authInitialized,
      notes,
      selectedNote,
      loading,
      error,
      fetchNotes,
      fetchNextNotesPage,
      hasMoreNotes,
      loadingMoreNotes,
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
      token, currentUser, isAuthenticated, authInitialized, notes, selectedNote, loading, error,
      fetchNotes, fetchNextNotesPage, hasMoreNotes, loadingMoreNotes,
      fetchNoteById, createNote, updateNote, deleteNote, clearSelection,
      toggleFavorite, shareNote, unshareNote, register, login, logout,
    ]
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}
