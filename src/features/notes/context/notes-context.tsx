import { createContext } from "react";
import type { CreateNotePayload, Note, UpdateNotePayload } from "../services/notes-service";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

type LoginInput = {
  email: string;
  password: string;
};

export type NotesContextValue = {
  token: string;
  isAuthenticated: boolean;
  authInitialized: boolean;
  notes: Note[];
  selectedNote: Note | null;
  loading: boolean;
  error: string | null;
  fetchNotes: () => Promise<void>;
  fetchNextNotesPage: () => Promise<void>;
  hasMoreNotes: boolean;
  loadingMoreNotes: boolean;
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
