// ─────────────────────────────────────────────────────────────────────────────
// NavigationContext.jsx — src/providers/NavigationContext.jsx
//
// FLUJO SIN FLASH BLANCO:
//   1. Página A llama navigate(path, msg)
//      → loading se activa + React navega inmediatamente a la nueva ruta
//   2. Página B monta DETRÁS del loading (usuario no ve nada blanco)
//   3. Página B llama usePageReady() al montar
//      → loading desaparece, usuario ve la página ya lista
//
// HOOKS:
//   useAppNavigate() → navegar con loading   (páginas que SALEN)
//   usePageReady()   → señal de listo         (páginas que ENTRAN)
//   useLoadingState()→ leer estado            (Home.jsx)
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const NavigationContext = createContext(null);

// ── Navegar con loading ───────────────────────────────────────────────────────
export function useAppNavigate() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useAppNavigate debe usarse dentro de NavigationProvider");
  return ctx.navigate;
}

// ── Señal de página lista ─────────────────────────────────────────────────────
// Llama este hook al inicio del componente destino.
// El loading desaparece 120ms después de que la página monta.
export function usePageReady() {
  const ctx = useContext(NavigationContext);
  useEffect(() => {
    if (ctx?.isLoading) {
      const t = setTimeout(() => ctx.setIsLoading(false), 120);
      return () => clearTimeout(t);
    }
  }, []);
}

// ── Leer estado (Home.jsx) ────────────────────────────────────────────────────
export function useLoadingState() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error("useLoadingState debe usarse dentro de NavigationProvider");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function NavigationProvider({ children }) {
  const rawNavigate              = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message,   setMessage]   = useState("Cargando");

  // Activa loading + navega de inmediato.
  // La página destino usa usePageReady() para apagar el loading.
  const navigate = useCallback((path, msg = "Cargando") => {
    setMessage(msg);
    setIsLoading(true);
    rawNavigate(path);
  }, [rawNavigate]);

  return (
    <NavigationContext.Provider value={{ isLoading, setIsLoading, message, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}