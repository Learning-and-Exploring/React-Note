import axios, { AxiosError } from "axios";
import { BASE_URL } from "./note-service";

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

const authApi = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

function extractMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string }>;
    return axiosError.response?.data?.message ?? axiosError.message;
  }

  return "Unexpected error";
}

function extractToken(raw: unknown): string {
  if (!raw || typeof raw !== "object") return "";

  const record = raw as Record<string, unknown>;

  const directToken =
    typeof record.token === "string"
      ? record.token
      : typeof record.accessToken === "string"
        ? record.accessToken
        : "";

  if (directToken) return directToken;

  const data = record.data;
  if (data && typeof data === "object") {
    const dataRecord = data as Record<string, unknown>;
    if (typeof dataRecord.token === "string") return dataRecord.token;
    if (typeof dataRecord.accessToken === "string") return dataRecord.accessToken;
  }

  return "";
}

export const authService = {
  async register(payload: RegisterPayload): Promise<void> {
    try {
      await authApi.post("/users", payload);
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },

  async login(payload: LoginPayload): Promise<string> {
    try {
      const response = await authApi.post("/users/login", payload);
      const token = extractToken(response.data);

      if (!token) {
        throw new Error("Login succeeded but token was not returned");
      }

      return token;
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error(extractMessage(error));
    }
  },
};
