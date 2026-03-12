import axios from "axios";
import { extractMessage } from "./utils";

// Use Vite-provided API URL when set, otherwise default to a same-origin
// "/api" path so requests keep working when front and API are served through
// Nginx on one host. Trailing slashes are trimmed to avoid double slashes.
function resolveBaseUrl() {
  const envUrl =
    typeof import.meta !== "undefined"
      ? import.meta.env?.VITE_API_URL
      : undefined;

  if (typeof envUrl === "string" && envUrl.trim().length > 0) {
    const normalized = envUrl.trim().replace(/\/$/, "");
    if (normalized.startsWith("http")) return normalized;
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  }

  return "";
}

const BASE_URL = resolveBaseUrl();

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

function buildFrontendShareUrl(apiShareUrl: string) {
  if (!apiShareUrl) return "";

  const tokenMatch = apiShareUrl.match(/\/([^/?#]+)\/?$/);
  const token = tokenMatch?.[1];
  if (!token) return apiShareUrl;

  const base =
    typeof import.meta !== "undefined" && typeof import.meta.env?.BASE_URL === "string"
      ? import.meta.env.BASE_URL
      : "/";

  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const path = `${normalizedBase}/shared/${token}`;

  return origin ? `${origin}${path}` : path;
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
      const response = await api.patch(
        `/notes/one-user/${id}/favorite`,
        undefined,
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

  async share(id: number, token: string): Promise<ShareLink> {
    try {
      const response = await api.post(
        `/notes/one-user/${id}/share`,
        undefined,
        {
          headers: authHeaders(token),
        },
      );

      const apiShareUrl = String(response.data?.shareUrl ?? "");
      return { shareUrl: buildFrontendShareUrl(apiShareUrl) };
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
