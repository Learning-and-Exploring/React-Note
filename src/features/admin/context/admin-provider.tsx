import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { adminService, type AdminLoginPayload } from "../admin-service";
import { AdminContext } from "./admin-context";
import {
  clearAdminCredentials,
  setAdminAuthInitialized,
  setAdminCredentials,
} from "@core/store/admin-auth-slice";
import {
  selectAdmin,
  selectAdminAuthInitialized,
  selectAdminToken,
  selectIsAdminAuthenticated,
  type AppDispatch,
} from "@core/store";

let adminAuthBootstrapPromise: Promise<string | null> | null = null;

function restoreAdminSession() {
  if (!adminAuthBootstrapPromise) {
    adminAuthBootstrapPromise = adminService.refresh().catch(() => null);
  }

  return adminAuthBootstrapPromise;
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector(selectAdminToken);
  const admin = useSelector(selectAdmin);
  const authInitialized = useSelector(selectAdminAuthInitialized);
  const isAuthenticated = useSelector(selectIsAdminAuthenticated);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runWithState = useCallback(async (task: () => Promise<void>) => {
    setLoading(true);
    setError(null);

    try {
      await task();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (payload: AdminLoginPayload) => {
      return runWithState(async () => {
        const result = await adminService.login(payload);
        dispatch(
          setAdminCredentials({
            token: result.token,
            admin: result.admin,
          }),
        );
      });
    },
    [dispatch, runWithState],
  );

  const logout = useCallback(() => {
    const doLogout = async () => {
      if (token) {
        try {
          await adminService.logout(token);
        } catch (err) {
          console.warn("Admin logout API failed", err);
        }
      }

      dispatch(clearAdminCredentials());
      setError(null);
    };

    void doLogout();
  }, [dispatch, token]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      try {
        const nextToken = await restoreAdminSession();

        if (!active) return;

        if (nextToken) {
          dispatch(
            setAdminCredentials({
              token: nextToken,
              admin: null,
            }),
          );
        } else {
          dispatch(clearAdminCredentials());
        }
      } finally {
        if (!active) return;
        dispatch(setAdminAuthInitialized(true));
      }
    };

    void initializeAuth();

    return () => {
      active = false;
    };
  }, [dispatch]);

  const value = useMemo(
    () => ({
      token,
      admin,
      isAuthenticated,
      authInitialized,
      loading,
      error,
      login,
      logout,
      clearError,
    }),
    [
      admin,
      authInitialized,
      clearError,
      error,
      isAuthenticated,
      loading,
      login,
      logout,
      token,
    ],
  );

  return (
    <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
  );
}
