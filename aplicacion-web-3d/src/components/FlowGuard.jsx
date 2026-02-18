import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";

export default function FlowGuard({ requireEmotion = false, requireAvatar = false, children }) {
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setOk(false);
          return;
        }

        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : {};

        const hasEmotion = !!data?.lastEmotion;
        const hasAvatar = !!data?.avatar;

        if (requireEmotion && !hasEmotion) {
          setOk(false);
          return;
        }

        if (requireAvatar && !hasAvatar) {
          setOk(false);
          return;
        }

        setOk(true);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [requireEmotion, requireAvatar]);

  if (loading) return <div style={{ padding: 20 }}>Verificando...</div>;

  if (!ok) {
    // Si falta emoción, mandarlo al cuestionario
    if (requireEmotion) return <Navigate to="/home/questionnaire" replace />;
    // Si falta avatar, mandarlo a avatar
    if (requireAvatar) return <Navigate to="/home/avatar" replace />;
    return <Navigate to="/home" replace />;
  }

  return children;
}
