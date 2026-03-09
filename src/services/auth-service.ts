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

function extractToken(data: unknown): string {
  if (!data || typeof data !== "object") return "";

  const record = data as Record<string, unknown>;

  if (typeof record.token === "string") return record.token;
  if (typeof record.accessToken === "string") return record.accessToken;

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
      // Handle responses that might be wrapped in a "data" object
      const data = response.data?.data ?? response.data;
      const token = extractToken(data);

      if (!token) {
        throw new Error("Login succeeded but token was not returned");
      }

      return token;
    } catch (error) {
      throw new Error(extractMessage(error));
    }
  },
};
