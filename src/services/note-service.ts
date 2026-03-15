import axios from "axios";
import { extractMessage } from "./utils";

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

// ─── Types ────────────────────────────────────────────────────────────────────

export type Block = {
  id: string;
  type: string;
  content?: string;
  checked?: boolean;
  filePath?: string;
  fileId?: string;
  url?: string;
  caption?: string;
};

export type Note = {
  id: number;
  title: string;
  body: string;         // HTML string — used by contentEditable editor
  isFavorite: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateNotePayload = {
  title: string;
  body: string;         // editor sends HTML string
  isFavorite?: boolean;
};

export type UpdateNotePayload = Partial<CreateNotePayload>;

export type ShareLink = { shareUrl: string };

export type UploadedImage = {
  url: string;
  fileId: string;
  filePath: string;
};

export type NotesPageMeta = {
  totalCount?: number;
  pageCount?: number;
  currentPage?: number;
  perPage?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  page?: number;
  totalPages?: number;
};

export type NotesPage = {
  data: Note[];
  meta: NotesPageMeta | null;
};

// ─── Axios instance ───────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

// ─── HTML ↔ Block[] conversion ────────────────────────────────────────────────

const TAG_TO_TYPE: Record<string, string> = {
  p: "paragraph",
  h1: "heading1",
  h2: "heading2",
  blockquote: "quote",
  pre: "code",
  li: "bullet",
};

const TYPE_TO_TAG: Record<string, string> = {
  paragraph: "p",
  heading1: "h1",
  heading2: "h2",
  quote: "blockquote",
  code: "pre",
  bullet: "li",
};

// Convert HTML string → Block[] before sending to API
function htmlToBlocks(html: string): Block[] {
  if (!html || html.trim() === "") return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const blocks: Block[] = [];

  doc.body.childNodes.forEach((node) => {
    const el = node as HTMLElement;
    const tag = el.tagName?.toLowerCase();
    if (!tag) return;

    // Image block
    if (tag === "img") {
      blocks.push({
        id: crypto.randomUUID(),
        type: "image",
        filePath: el.getAttribute("data-file-path") || "",
        fileId: el.getAttribute("data-file-id") || "",
        url: el.getAttribute("src") || "",
      });
      return;
    }

    // Check for nested img (e.g. img inside a div)
    const nestedImg = el.querySelector("img");
    if (nestedImg) {
      blocks.push({
        id: crypto.randomUUID(),
        type: "image",
        filePath: nestedImg.getAttribute("data-file-path") || "",
        fileId: nestedImg.getAttribute("data-file-id") || "",
        url: nestedImg.getAttribute("src") || "",
      });
      return;
    }

    blocks.push({
      id: crypto.randomUUID(),
      type: TAG_TO_TYPE[tag] || "paragraph",
      content: el.innerText || el.textContent || "",
    });
  });

  return blocks;
}

// Convert Block[] → HTML string for the editor
function blocksToHtml(blocks: Block[]): string {
  if (!Array.isArray(blocks) || blocks.length === 0) return "";

  return blocks.map((block) => {
    if (block.type === "image") {
      return `<img
        src="${block.url || ""}"
        data-file-id="${block.fileId || ""}"
        data-file-path="${block.filePath || ""}"
        alt="note image"
        class="notion-image"
        style="max-width:100%;border-radius:8px;margin:8px 0;display:block;"
      />`;
    }
    const tag = TYPE_TO_TAG[block.type] || "p";
    return `<${tag}>${block.content || ""}</${tag}>`;
  }).join("");
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeNote(raw: unknown): Note {
  const record = raw as Record<string, unknown>;

  // API returns Block[] — convert to HTML for the editor
  const bodyBlocks = Array.isArray(record.body) ? (record.body as Block[]) : [];
  const bodyHtml = blocksToHtml(bodyBlocks);

  return {
    id: Number(record.id ?? 0),
    title: String(record.title ?? ""),
    body: bodyHtml,
    isFavorite: typeof record.isFavorite === "boolean"
      ? record.isFavorite
      : Boolean(record.isFavorite),
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

// ─── Service ──────────────────────────────────────────────────────────────────

export const noteService = {
  async create(payload: CreateNotePayload, token: string): Promise<Note> {
    try {
      const response = await api.post(
        "/notes",
        {
          title: payload.title,
          body: htmlToBlocks(payload.body),   // ✅ HTML → Block[]
          isFavorite: Boolean(payload.isFavorite),
        },
        { headers: authHeaders(token) }
      );
      return normalizeNote(response.data?.data ?? response.data);
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async listMyNotes(token: string, page = 1, limit = 10): Promise<NotesPage> {
    try {
      const response = await api.get("/notes/one-user", {
        headers: authHeaders(token),
        params: { page, limit },
      });
      const raw = response.data ?? {};
      return {
        data: normalizeNotes(raw),
        meta: (raw as Record<string, unknown>).meta as NotesPageMeta ?? null,
      };
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async getById(id: number, token: string): Promise<Note> {
    try {
      const response = await api.get(`/notes/one-user/${id}`, {
        headers: authHeaders(token),
      });
      return normalizeNote(response.data?.data ?? response.data);
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async update(id: number, payload: UpdateNotePayload, token: string): Promise<Note> {
    try {
      const response = await api.patch(
        `/notes/one-user/${id}`,
        {
          ...payload,
          body: payload.body ? htmlToBlocks(payload.body) : undefined, // ✅ HTML → Block[]
        },
        { headers: authHeaders(token) }
      );
      return normalizeNote(response.data?.data ?? response.data);
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
        { headers: authHeaders(token) }
      );
      return normalizeNote(response.data?.data ?? response.data);
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async share(id: number, token: string): Promise<ShareLink> {
    try {
      const response = await api.post(
        `/notes/one-user/${id}/share`,
        undefined,
        { headers: authHeaders(token) }
      );
      return { shareUrl: buildFrontendShareUrl(String(response.data?.shareUrl ?? "")) };
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
      return normalizeNote(response.data?.data ?? response.data);
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async uploadImage(file: File, token: string): Promise<UploadedImage> {
    try {
      const formData = new FormData();
      formData.append("files", file);
      const response = await api.post("/upload/notes", formData, {
        headers: {
          ...authHeaders(token),
          "Content-Type": "multipart/form-data",
        },
      });
      const upload = response.data?.uploads?.[0];
      if (!upload) throw new Error("Upload failed");
      return upload;
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },
};

export { BASE_URL };