import { createContext } from "react";
import type { AdminProfile } from "@core/store/admin-auth-slice";
import type { AdminLoginPayload } from "../admin-service";

export type AdminContextValue = {
  token: string;
  admin: AdminProfile | null;
  isAuthenticated: boolean;
  authInitialized: boolean;
  loading: boolean;
  error: string | null;
  login: (payload: AdminLoginPayload) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
};

export const AdminContext = createContext<AdminContextValue | undefined>(
  undefined,
);
