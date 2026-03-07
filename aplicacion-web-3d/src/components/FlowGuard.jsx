import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import LoadingScreen from "./LoadingScreen";

export default function FlowGuard({ requireEmotion = false, requireAvatar = false, children }) {
  const [ok,      setOk]      = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Bloquea el botón "atrás" — el usuario no puede retroceder en el flujo
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);
    const handlePop = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, [location]);

  useEffect(() => {
    const run = async () => {
      try {
        const user = auth.currentUser;
        if (!user) { setOk(false); return; }

        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : {};

        if (requireEmotion && !data?.lastEmotion) { setOk(false); return; }
        if (requireAvatar  && !data?.avatar)      { setOk(false); return; }

        setOk(true);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [requireEmotion, requireAvatar]);

  if (loading) return <LoadingScreen message="Verificando acceso" />;

  if (!ok) {
    if (requireEmotion) return <Navigate to="/home/questionnaire" replace />;
    if (requireAvatar)  return <Navigate to="/home/avatar"        replace />;
    return                     <Navigate to="/home"               replace />;
  }

  return children;
}