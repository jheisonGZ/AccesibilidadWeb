import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import LoadingScreen from "./LoadingScreen";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Bloquea el botón "atrás" del navegador reemplazando el historial
  // para que no se pueda volver a páginas previas del flujo
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePop = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [location]);

  if (loading) return <LoadingScreen message="Verificando sesión" />;
  if (!user)   return <Navigate to="/" replace />;

  return children;
}