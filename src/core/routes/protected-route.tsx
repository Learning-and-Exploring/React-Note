import { Navigate, useLocation } from "react-router-dom";
import { type ReactElement } from "react";        
import { useNotes } from "@/features/notes/hooks/use-notes";

type ProtectedRouteProps = {
  children: ReactElement;                       
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authInitialized, isAuthenticated } = useNotes();
  const location = useLocation();

  if (!authInitialized) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
}
