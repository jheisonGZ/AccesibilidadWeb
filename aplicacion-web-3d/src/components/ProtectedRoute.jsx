import { Navigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 20 }}>Cargando...</div>;

  if (!user) return <Navigate to="/" replace />;

  return children;
}
