import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../providers/AuthProvider";   // ✅ fuente de verdad única
import LoadingScreen from "./LoadingScreen";

export default function FlowGuard({ requireEmotion = false, requireAvatar = false, children }) {
  const { user, loading: authLoading } = useAuth();   // ✅ espera a que Firebase Auth resuelva
  const [status, setStatus] = useState("loading");    // "loading" | "ok" | "needEmotion" | "needAvatar"
  const location = useLocation();

  // Bloquea el botón "atrás"
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePop = () => window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [location]);

  useEffect(() => {
    // ✅ No consultar Firestore hasta que Auth haya resuelto
    if (authLoading) return;

    const run = async () => {
      try {
        // ✅ user viene de AuthProvider — nunca es null por timing de Firebase
        if (!user) { setStatus("needEmotion"); return; }

        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : {};

        if (requireEmotion && !data?.lastEmotion) { setStatus("needEmotion"); return; }
        if (requireAvatar  && !data?.avatar)      { setStatus("needAvatar");  return; }

        setStatus("ok");
      } catch (e) {
        console.error("FlowGuard error:", e);
        setStatus("needEmotion");
      }
    };

    run();
  }, [user, authLoading, requireEmotion, requireAvatar]);  // ✅ depende de authLoading

  if (status === "loading")     return <LoadingScreen message="Verificando acceso" />;
  if (status === "needEmotion") return <Navigate to="/home/questionnaire" replace />;
  if (status === "needAvatar")  return <Navigate to="/home/avatar"        replace />;

  return children;
}