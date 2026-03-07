// ─────────────────────────────────────────────────────────────────────────────
// src/providers/AuthProvider.jsx
//
// Proveedor central de autenticación para la aplicación.
// Encapsula toda la lógica de Firebase Auth y la expone a través de Context API,
// evitando que los componentes accedan directamente a `auth.currentUser`.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from "firebase/auth";
import { auth } from "../services/firebase";

// ─────────────────────────────────────────────────────────────────────────────
// 1. CONTEXTO
//    Se inicializa en null para poder detectar si el hook se usa fuera del
//    proveedor y lanzar un error descriptivo (ver useAuth al final).
// ─────────────────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

// ─────────────────────────────────────────────────────────────────────────────
// 2. PROVEEDOR
//    Componente que envuelve la app (o la parte que necesita auth).
//    Mantiene el estado del usuario y expone las funciones de autenticación.
// ─────────────────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  // Estado del usuario autenticado (objeto Firebase User o null)
  const [user, setUser] = useState(null);

  // Bandera que indica si Firebase aún está verificando la sesión inicial.
  // Mientras sea `true`, los componentes protegidos deben mostrar un loader
  // en lugar de redirigir prematuramente al login.
  const [loading, setLoading] = useState(true);

  // ───────────────────────────────────────────────────────────────────────────
  // 2a. ESCUCHA DE CAMBIOS DE SESIÓN
  //     `onAuthStateChanged` se dispara al montar el componente y cada vez que
  //     el usuario inicia o cierra sesión. La función de limpieza (`unsub`)
  //     cancela la suscripción cuando el proveedor se desmonta.
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);   // null si no hay sesión activa
      setLoading(false);       // Firebase ya respondió → dejar de bloquear la UI
    });

    return () => unsub(); // Limpieza: evita memory leaks
  }, []);

  // ───────────────────────────────────────────────────────────────────────────
  // 2b. ALIAS DEL USUARIO
  //     Derivado de `displayName` (configurado en el perfil de Google o
  //     manualmente). Si no existe, se usa "Usuario" como fallback seguro.
  //     Se recalcula solo cuando `user` cambia gracias a `useMemo`.
  // ───────────────────────────────────────────────────────────────────────────
  const alias = useMemo(
    () => user?.displayName?.trim() || "Usuario",
    [user]
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 2c. LOGIN CON CORREO Y CONTRASEÑA
  //     Devuelve `null` si el inicio de sesión fue exitoso, o un string con
  //     el mensaje de error para que el componente lo muestre al usuario.
  //     Así el componente NO necesita importar Firebase ni manejar errores raw.
  // ───────────────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return null; // Éxito: sin errores
    } catch {
      return "No se pudo iniciar sesión. Revisa el correo y la contraseña.";
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 2d. LOGIN CON GOOGLE (popup)
  //     Abre el selector de cuentas de Google. Si el usuario cancela o hay
  //     un error, la excepción se propaga para que el componente la maneje
  //     (o se puede envolver en try/catch según la necesidad del proyecto).
  // ───────────────────────────────────────────────────────────────────────────
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 2e. LOGOUT
  //     Cierra la sesión activa en Firebase. `onAuthStateChanged` actualizará
  //     automáticamente el estado `user` a null tras ejecutarse.
  // ───────────────────────────────────────────────────────────────────────────
  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      setUser({ ...auth.currentUser });
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 2f. VALOR DEL CONTEXTO
  //     Se memoriza con `useMemo` para evitar re-renders innecesarios en los
  //     consumidores cuando el componente padre se re-renderiza por otras causas.
  // ───────────────────────────────────────────────────────────────────────────
  const contextValue = useMemo(
    () => ({ user, alias, loading, login, loginWithGoogle, logout, refreshUser }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, alias, loading]
  );

  // Mientras Firebase verifica la sesión inicial no renderizamos nada,
  // evitando parpadeos o redirecciones incorrectas en rutas protegidas.
  if (loading) return null;

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. HOOK PERSONALIZADO useAuth()
//    Abstracción que permite consumir el contexto desde cualquier componente
//    hijo del proveedor con una sola línea:
//
//      const { user, alias, login, loginWithGoogle, logout } = useAuth();
//
//    Lanza un error explícito si se usa fuera de <AuthProvider>, facilitando
//    la depuración durante el desarrollo.
// ─────────────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth() debe usarse dentro de <AuthProvider>.");
  }
  return ctx;
}