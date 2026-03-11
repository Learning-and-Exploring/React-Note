import axios from "axios";
import { extractMessage } from "./utils";

// Prefer Vite-provided API URL, fallback to local dev server
const BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  "http://localhost:4000";

export type Note = {
  id: number;
  title: string;
  body: string;
  isFavorite: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateNotePayload = {
  title: string;
  body: string;
  isFavorite?: boolean;
};

export type UpdateNotePayload = Partial<CreateNotePayload>;

export type ShareLink = { shareUrl: string };

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function normalizeNote(raw: unknown): Note {
  const record = raw as Record<string, unknown>;

  return {
    id: Number(record.id ?? record.noteId ?? 0),
    title: String(record.title ?? ""),
    body: String(record.body ?? ""),
    isFavorite:
      typeof record.isFavorite === "boolean"
        ? record.isFavorite
        : Boolean(record.isFavorite),
    createdAt:
      typeof record.createdAt === "string" ? record.createdAt : undefined,
    updatedAt:
      typeof record.updatedAt === "string" ? record.updatedAt : undefined,
  };
}

function normalizeNotes(raw: unknown): Note[] {
  if (Array.isArray(raw)) return raw.map(normalizeNote);

  if (raw && typeof raw === "object") {
    const record = raw as Record<string, unknown>;

    if (Array.isArray(record.data)) return record.data.map(normalizeNote);
    if (Array.isArray(record.notes)) return record.notes.map(normalizeNote);
  }

  return [];
}

export const noteService = {
  async create(payload: CreateNotePayload, token: string): Promise<Note> {
    try {
      const response = await api.post(
        "/notes",
        { ...payload, isFavorite: Boolean(payload.isFavorite) },
        {
          headers: authHeaders(token),
        },
      );

      const data = response.data?.data ?? response.data;
      return normalizeNote(data);
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async listMyNotes(token: string): Promise<Note[]> {
    try {
      const response = await api.get("/notes/one-user", {
        headers: authHeaders(token),
      });

      return normalizeNotes(response.data);
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async getById(id: number, token: string): Promise<Note> {
    try {
      const response = await api.get(`/notes/one-user/${id}`, {
        headers: authHeaders(token),
      });

      const data = response.data?.data ?? response.data;
      return normalizeNote(data);
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async update(
    id: number,
    payload: UpdateNotePayload,
    token: string,
  ): Promise<Note> {
    try {
      const response = await api.patch(`/notes/one-user/${id}`, payload, {
        headers: authHeaders(token),
      });

      const data = response.data?.data ?? response.data;
      return normalizeNote(data);
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async softDelete(id: number, token?: string): Promise<void> {
    try {
      await api.patch(`/notes/one-user/${id}/delete`, undefined, {
        headers: authHeaders(token),
      });
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async toggleFavorite(id: number, token: string): Promise<Note> {
    try {
      const response = await api.patch(`/notes/one-user/${id}/favorite`, undefined, {
        headers: authHeaders(token),
      });

      const data = response.data?.data ?? response.data;
      return normalizeNote(data);
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async share(id: number, token: string): Promise<ShareLink> {
    try {
      const response = await api.post(`/notes/one-user/${id}/share`, undefined, {
        headers: authHeaders(token),
      });

      return { shareUrl: String(response.data?.shareUrl ?? "") };
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async unshare(id: number, token: string): Promise<void> {
    try {
      await api.patch(`/notes/one-user/${id}/unshare`, undefined, {
        headers: authHeaders(token),
      });
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async getSharedByToken(token: string): Promise<Note> {
    try {
      const response = await api.get(`/notes/shared/${token}`);
      const data = response.data?.data ?? response.data;
      return normalizeNote(data);
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },
};

export { BASE_URL };
