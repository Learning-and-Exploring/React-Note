import { Navigate, useLocation } from "react-router-dom";
import { type ReactElement } from "react";          // ✅ add this
import { useNotes } from "@/hooks/use-notes";

type ProtectedRouteProps = {
  children: ReactElement;                            // ✅ was JSX.Element
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useNotes();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
}
