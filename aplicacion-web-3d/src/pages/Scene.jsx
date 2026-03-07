// ─────────────────────────────────────────────────────────────────────────────
// Scene.jsx — src/pages/Scene.jsx
// Estilos del HUD en: src/styles/scene.hud.css
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import AnxietyRoom from "../scenes/AnxietyRoom";
import StressRoom  from "../scenes/StressRoom";
import NeutralRoom from "../scenes/NeutralRoom";
import { usePageReady } from "../providers/NavigationContext";
import { useAuth } from "../providers/AuthProvider";
import { LayoutDashboard, LogOut, Heart, AlertTriangle, AlertCircle, Activity, TrendingUp, TrendingDown, Minus, Star, Zap } from "lucide-react";
import Swal from "sweetalert2";
import "../styles/scene.css";

// ── Mapas de datos ────────────────────────────────────────────────────────────
const EMOTION_MAP = {
  neutro:   { Icon: Heart,         color: "#00eaff", glow: "#00eaff", label: "ESTABLE",  level: 1 },
  leve:     { Icon: Activity,      color: "#00ff88", glow: "#00ff88", label: "LEVE",      level: 2 },
  estres:   { Icon: AlertTriangle, color: "#ffcc00", glow: "#ffcc00", label: "ESTRÉS",    level: 3 },
  ansiedad: { Icon: AlertCircle,   color: "#ff4466", glow: "#ff4466", label: "ANSIEDAD",  level: 4 },
};

const getTrend = (score) => {
  if (score === null) return { Icon: Minus,        color: "#888",    label: "---"       };
  if (score <= 4)     return { Icon: TrendingDown,  color: "#00ff88", label: "MEJORANDO" };
  if (score <= 9)     return { Icon: Minus,         color: "#00eaff", label: "ESTABLE"   };
  if (score <= 14)    return { Icon: TrendingUp,    color: "#ffcc00", label: "ALERTA"    };
  return                     { Icon: TrendingUp,    color: "#ff4466", label: "CRÍTICO"   };
};

const getHealthPct   = (score) => score === null ? 100 : Math.max(5, Math.round(((21 - score) / 21) * 100));
const getHealthColor = (pct)   => pct > 60 ? "#00ff88" : pct > 30 ? "#ffcc00" : "#ff4466";

// ─────────────────────────────────────────────────────────────────────────────
export default function Scene() {
  const navigate        = useNavigate();
  const { user, alias } = useAuth();
  const [emotion,   setEmotion]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [lastScore, setLastScore] = useState(null);
  const [totalSess, setTotalSess] = useState(0);
  const [tick,      setTick]      = useState(0);

  usePageReady();

  // Pulso animado cada segundo
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Cargar emoción
  useEffect(() => {
    const load = async () => {
      try {
        const u = auth.currentUser;
        if (!u) { navigate("/"); return; }
        const snap = await getDoc(doc(db, "users", u.uid));
        setEmotion(
          snap.exists()
            ? (snap.data().lastEmotion || "neutro")
            : (localStorage.getItem("emotion") || "neutro")
        );
      } catch {
        setEmotion(localStorage.getItem("emotion") || "neutro");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  // Progreso en tiempo real
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    const q = query(
      collection(db, "users", u.uid, "assessments"),
      orderBy("createdAt", "desc"),
      limit(10)
    );
    const unsub = onSnapshot(q, (snap) => {
      setTotalSess(snap.size);
      if (!snap.empty) setLastScore(snap.docs[0].data().score ?? null);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    const result = await Swal.fire({
      icon: "question",
      title: "¿Cerrar sesión?",
      text: "¿Seguro que deseas salir?",
      showCancelButton: true,
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#2c5364",
      cancelButtonColor: "#4a5568",
    });
    if (result.isConfirmed) {
      const { signOut } = await import("firebase/auth");
      await signOut(auth);
      navigate("/");
    }
  };

  if (loading) return <div style={{ background: "#080e08", height: "100vh" }} />;

  const SceneComponent =
    emotion === "ansiedad" ? AnxietyRoom :
    emotion === "estres"   ? StressRoom  : NeutralRoom;

  const emo       = EMOTION_MAP[emotion] || EMOTION_MAP.neutro;
  const trend     = getTrend(lastScore);
  const healthPct = getHealthPct(lastScore);
  const hpColor   = getHealthColor(healthPct);
  const initial   = alias?.charAt(0).toUpperCase();

  return (
    <div style={{ height: "100vh", position: "relative", overflow: "hidden" }}>

      {/* ── PANEL IZQUIERDO — Jugador ── */}
      <div className="hud-panel hud-tl">

        <div className="hud-player-header">
          <div className="hud-avatar" style={{ boxShadow: `0 0 10px ${emo.glow}66` }}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              : <span className="hud-initial">{initial}</span>
            }
            <div className="hud-level-badge" style={{ background: emo.color, boxShadow: `0 0 6px ${emo.glow}` }}>
              {emo.level}
            </div>
          </div>
          <div className="hud-player-info">
            <div className="hud-callsign">{alias?.toUpperCase()}</div>
            <div className="hud-status" style={{ color: emo.color }}>
              <span className="hud-dot" style={{ background: emo.color, boxShadow: `0 0 5px ${emo.glow}` }} />
              SESIÓN ACTIVA
            </div>
          </div>
        </div>

        {/* Barra de bienestar */}
        <div className="hud-bar-row">
          <Heart size={11} color={hpColor} />
          <span className="hud-bar-label" style={{ color: hpColor }}>BIENESTAR</span>
          <div className="hud-bar-track">
            <div className="hud-bar-fill" style={{
              width: `${healthPct}%`,
              background: `linear-gradient(90deg, ${hpColor}88, ${hpColor})`,
              boxShadow: `0 0 8px ${hpColor}88`,
            }} />
          </div>
          <span className="hud-bar-val" style={{ color: hpColor }}>{healthPct}%</span>
        </div>

        {/* Barra de XP */}
        <div className="hud-bar-row">
          <Star size={11} color="#a78bfa" />
          <span className="hud-bar-label" style={{ color: "#a78bfa" }}>EXP</span>
          <div className="hud-bar-track">
            <div className="hud-bar-fill hud-bar-xp" style={{ width: `${Math.min(totalSess * 10, 100)}%` }} />
          </div>
          <span className="hud-bar-val" style={{ color: "#a78bfa" }}>{totalSess} SES</span>
        </div>

      </div>

      {/* ── PANEL DERECHO — Estado + Acciones ── */}
      <div className="hud-panel hud-tr">

        <div className="hud-zone" style={{ borderColor: emo.color + "55", boxShadow: `inset 0 0 20px ${emo.glow}0a` }}>
          <div className="hud-zone-title">ZONA ACTIVA</div>
          <div className="hud-zone-name" style={{ color: emo.color, textShadow: `0 0 12px ${emo.glow}` }}>
            <emo.Icon size={14} strokeWidth={2} />
            {emo.label}
          </div>
        </div>

        <div className="hud-score-row">
          <Zap size={12} color={trend.color} />
          <span className="hud-score-label" style={{ color: trend.color }}>
            {lastScore !== null ? `${lastScore} / 21 PTS` : "SIN DATOS"}
          </span>
          <span className="hud-trend" style={{ color: trend.color }}>
            <trend.Icon size={11} strokeWidth={2.5} />
            {trend.label}
          </span>
        </div>

        <div className="hud-actions">
          <button className="hud-btn hud-btn-primary" onClick={() => navigate("/home")}>
            <LayoutDashboard size={13} strokeWidth={2} />
            BASE
          </button>
          <button className="hud-btn hud-btn-danger" onClick={handleLogout}>
            <LogOut size={13} strokeWidth={2} />
            SALIR
          </button>
        </div>

      </div>

      {/* ── ESCENA 3D ── */}
      <SceneComponent emotion={emotion} />

    </div>
  );
}