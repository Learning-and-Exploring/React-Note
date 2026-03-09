import axios, { AxiosError } from "axios";

const BASE_URL = "http://192.168.1.151:4000";

export type Note = {
  id: number;
  title: string;
  body: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateNotePayload = {
  title: string;
  body: string;
};

export type UpdateNotePayload = Partial<CreateNotePayload>;

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
    createdAt: typeof record.createdAt === "string" ? record.createdAt : undefined,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : undefined,
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

function extractMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return axiosError.response?.data?.message ?? axiosError.message;
  }

  return "Unexpected error";
}

export const noteService = {
  async create(payload: CreateNotePayload, token: string): Promise<Note> {
    try {
      const response = await api.post("/notes", payload, {
        headers: authHeaders(token),
      });

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

  async update(id: number, payload: UpdateNotePayload, token: string): Promise<Note> {
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
      await api.patch(`/notes/${id}/delete`, undefined, {
        headers: authHeaders(token),
      });
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },
};

export { BASE_URL };
