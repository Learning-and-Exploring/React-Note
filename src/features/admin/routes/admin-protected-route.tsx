import { type ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdmin } from "../hooks/use-admin";

type AdminProtectedRouteProps = {
  children: ReactElement;
};

export function AdminProtectedRoute({
  children,
}: AdminProtectedRouteProps) {
  const { authInitialized, isAuthenticated } = useAdmin();
  const location = useLocation();

  if (!authInitialized) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return children;
}
