import axios from "axios";
import { BASE_URL } from "@features/notes/services/notes-service";
import { extractMessage } from "@features/notes/utils/notes-utils";
import type { AdminProfile } from "@core/store/admin-auth-slice";

export type AdminLoginPayload = {
  email: string;
  password: string;
  privateKey: string;
};

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  isDeleted?: boolean;
};

export type AdminUsersMeta = {
  totalCount?: number;
  pageCount?: number;
  currentPage?: number;
  perPage?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
  page?: number;
  totalPages?: number;
};

export type AdminUsersParams = {
  page?: number;
  limit?: number;
  name?: string;
  email?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
};

export type AdminUsersResponse = {
  data: AdminUser[];
  meta: AdminUsersMeta | null;
};

export type AdminUserDevice = {
  id: number;
  userId: number;
  browser: string;
  os: string;
  ip: string | null;
  isDeleted: boolean;
  createdAt?: string;
  user?: AdminUser | null;
};

export type AdminUserDevicesParams = {
  page?: number;
  limit?: number;
  includeDeleted?: boolean;
};

export type AdminUserDevicesResponse = {
  data: AdminUserDevice[];
  meta: AdminUsersMeta | null;
};

const adminApi = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function normalizeAdmin(raw: unknown): AdminProfile | null {
  if (!raw || typeof raw !== "object") return null;

  const record = raw as Record<string, unknown>;

  return {
    id: Number(record.id ?? 0),
    name: String(record.name ?? ""),
    email: String(record.email ?? ""),
    role: String(record.role ?? "admin"),
  };
}

function normalizeUser(raw: unknown): AdminUser {
  const record = (raw ?? {}) as Record<string, unknown>;

  return {
    id: Number(record.id ?? 0),
    name: String(record.name ?? ""),
    email: String(record.email ?? ""),
    avatarUrl:
      typeof record.avatarUrl === "string" ? record.avatarUrl : null,
    createdAt:
      typeof record.createdAt === "string" ? record.createdAt : undefined,
    updatedAt:
      typeof record.updatedAt === "string" ? record.updatedAt : undefined,
    isActive:
      typeof record.isActive === "boolean" ? record.isActive : undefined,
    isDeleted:
      typeof record.isDeleted === "boolean" ? record.isDeleted : undefined,
  };
}

function normalizeUsers(raw: unknown): AdminUser[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeUser);
}

function normalizeUserDevice(raw: unknown): AdminUserDevice {
  const record = (raw ?? {}) as Record<string, unknown>;
  const browserValue =
    typeof record.browser === "string"
      ? record.browser
      : typeof record.broswer === "string"
        ? record.broswer
        : "";

  return {
    id: Number(record.id ?? 0),
    userId: Number(record.userId ?? 0),
    browser: browserValue,
    os: typeof record.os === "string" ? record.os : "",
    ip: typeof record.ip === "string" ? record.ip : null,
    isDeleted: Boolean(record.isDeleted),
    createdAt:
      typeof record.createdAt === "string" ? record.createdAt : undefined,
    user:
      record.user && typeof record.user === "object"
        ? normalizeUser(record.user)
        : null,
  };
}

function normalizeUserDevices(raw: unknown): AdminUserDevice[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeUserDevice);
}

function extractToken(data: unknown): string {
  if (!data || typeof data !== "object") return "";

  const record = data as Record<string, unknown>;

  if (typeof record.accessToken === "string") return record.accessToken;
  if (typeof record.token === "string") return record.token;

  return "";
}

export const adminService = {
  async login(payload: AdminLoginPayload): Promise<{
    token: string;
    admin: AdminProfile | null;
  }> {
    try {
      const response = await adminApi.post("/admin/login", payload);
      const data = response.data?.data ?? response.data;
      const token = extractToken(data);

      if (!token) {
        throw new Error("Login succeeded but token was not returned");
      }

      return {
        token,
        admin: normalizeAdmin(
          data && typeof data === "object"
            ? (data as Record<string, unknown>).admin
            : null,
        ),
      };
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async refresh(): Promise<string> {
    try {
      const response = await adminApi.post("/admin/refresh");
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
      await adminApi.post(
        "/admin/logout",
        {},
        {
          headers: authHeaders(token),
        },
      );
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async listUsers(
    params: AdminUsersParams,
    token: string,
  ): Promise<AdminUsersResponse> {
    try {
      const response = await adminApi.get("/admin/users", {
        headers: authHeaders(token),
        params,
      });
      const raw = response.data ?? {};

      return {
        data: normalizeUsers((raw as Record<string, unknown>).data),
        meta: ((raw as Record<string, unknown>).meta as AdminUsersMeta) ?? null,
      };
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async getUserById(
    id: number,
    token: string,
    includeDeleted = false,
  ): Promise<AdminUser> {
    try {
      const response = await adminApi.get(`/admin/users/${id}`, {
        headers: authHeaders(token),
        params: { includeDeleted },
      });

      return normalizeUser(response.data?.data ?? response.data);
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async listUserDevices(
    params: AdminUserDevicesParams,
    token: string,
  ): Promise<AdminUserDevicesResponse> {
    try {
      const response = await adminApi.get("/admin/users/devices", {
        headers: authHeaders(token),
        params,
      });
      const raw = response.data ?? {};

      return {
        data: normalizeUserDevices((raw as Record<string, unknown>).data),
        meta: ((raw as Record<string, unknown>).meta as AdminUsersMeta) ?? null,
      };
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async toggleUserActive(
    id: number,
    token: string,
  ): Promise<{ message: string; user: AdminUser }> {
    try {
      const response = await adminApi.patch(
        `/admin/users/${id}/active/toggle`,
        {},
        {
          headers: authHeaders(token),
        },
      );

      const data = response.data?.data ?? response.data;
      const record = (data ?? {}) as Record<string, unknown>;

      return {
        message:
          typeof record.message === "string"
            ? record.message
            : "User status updated.",
        user: normalizeUser(record.user),
      };
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },
};
