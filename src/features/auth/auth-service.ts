import axios from "axios";
import { BASE_URL } from "@features/notes/services/notes-service";
import { extractMessage } from "@features/notes/utils/notes-utils";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  role?: string;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResult = {
  token: string;
  user: AuthUser | null;
};

export type LogoutResponse = { message: string };

const authApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

function extractToken(data: unknown): string {
  if (!data || typeof data !== "object") return "";

  const record = data as Record<string, unknown>;

  if (typeof record.token === "string") return record.token;
  if (typeof record.accessToken === "string") return record.accessToken;

  return "";
}

function normalizeAuthUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;

  return {
    id: Number(record.id ?? 0),
    name: typeof record.name === "string" ? record.name : "",
    email: typeof record.email === "string" ? record.email : "",
    avatarUrl: typeof record.avatarUrl === "string" ? record.avatarUrl : null,
    isActive:
      typeof record.isActive === "boolean" ? record.isActive : undefined,
    isDeleted:
      typeof record.isDeleted === "boolean" ? record.isDeleted : undefined,
    createdAt:
      typeof record.createdAt === "string" ? record.createdAt : undefined,
    updatedAt:
      typeof record.updatedAt === "string" ? record.updatedAt : undefined,
    role: typeof record.role === "string" ? record.role : "user",
  };
}

function decodeJwtSegment(segment: string): Record<string, unknown> | null {
  try {
    const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "=",
    );
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function deriveUserFromToken(token: string): AuthUser | null {
  if (!token) return null;

  const [, payloadSegment] = token.split(".");
  if (!payloadSegment) return null;

  const payload = decodeJwtSegment(payloadSegment);
  if (!payload) return null;

  return {
    id: Number(payload.userId ?? 0),
    name: typeof payload.name === "string" ? payload.name : "",
    email: typeof payload.email === "string" ? payload.email : "",
    avatarUrl: null,
    role: typeof payload.role === "string" ? payload.role : "user",
  };
}

export const authService = {
  async register(payload: RegisterPayload): Promise<void> {
    try {
      await authApi.post("/users/register", payload);
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async login(payload: LoginPayload): Promise<LoginResult> {
    try {
      const response = await authApi.post("/users/login", payload);
      // Handle responses that might be wrapped in a "data" object
      const data = response.data?.data ?? response.data;
      const token = extractToken(data);

      if (!token) {
        throw new Error("Login succeeded but token was not returned");
      }

      const user = normalizeAuthUser(
        data && typeof data === "object"
          ? (data as Record<string, unknown>).user
          : null,
      );

      return { token, user };
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async refresh(): Promise<string> {
    try {
      const response = await authApi.post("/users/refresh");
      const data = response.data?.data ?? response.data;
      const token = extractToken(data);

      if (!token) {
        throw new Error("Refresh succeeded but token was not returned");
      }

      return token;
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async logout(token: string): Promise<void> {
    try {
      await authApi.post(
        "/users/logout",
        {},
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },
};
