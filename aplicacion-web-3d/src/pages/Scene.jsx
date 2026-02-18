import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import AnxietyRoom from "../scenes/AnxietyRoom";
import StressRoom from "../scenes/StressRoom";
import NeutralRoom from "../scenes/NeutralRoom";


export default function Scene() {
  const navigate = useNavigate();
  const [emotion, setEmotion] = useState(null);
  const [loading, setLoading] = useState(true);
  

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  useEffect(() => {
    const load = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/");
          return;
        }

        const snap = await getDoc(doc(db, "users", user.uid));

        if (snap.exists()) {
          const data = snap.data();
          setEmotion(data.lastEmotion || "neutro");
        } else {
          // fallback por si el doc no existe
          setEmotion(localStorage.getItem("emotion") || "neutro");
        }
      } catch (e) {
        console.error("Error leyendo emoción:", e);
        setEmotion(localStorage.getItem("emotion") || "neutro");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  if (loading) {
    return <div style={{ padding: 20 }}>Cargando escena...</div>;
  }

  // Por ahora usamos BasicRoom para todos.
  // Luego cambias según emoción.
  const SceneComponent =
  emotion === "ansiedad" ? AnxietyRoom :
  emotion === "estres" ? StressRoom :
  NeutralRoom;
  
  return (
  
    <div style={{ height: "100vh", position: "relative" }}>
      <button
        onClick={handleLogout}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          zIndex: 20,
          padding: "10px 14px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.25)",
          background: "rgba(0,0,0,0.35)",
          color: "white",
          cursor: "pointer",
          backdropFilter: "blur(8px)",
        }}
      >
        Logout
      </button>

      {/* Debug rápido */}
      <div
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 20,
          padding: "8px 12px",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.25)",
          background: "rgba(0,0,0,0.35)",
          color: "white",
          backdropFilter: "blur(8px)",
          fontSize: 14,
        }}
      >
        Emoción: <b>{emotion}</b>
      </div>

      <SceneComponent emotion={emotion} />
    </div>
  );
}
