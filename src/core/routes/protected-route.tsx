import { Navigate, useLocation } from "react-router-dom";
import { type ReactElement } from "react";        
import { useNotes } from "@/features/notes/hooks/use-notes";

type ProtectedRouteProps = {
  children: ReactElement;                       
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated } = useNotes();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
}
