// ─────────────────────────────────────────────────────────────────────────────
// Scene.jsx — src/pages/Scene.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import AnxietyRoom from "../scenes/AnxietyRoom";
import BasicRoom   from "../scenes/BasicRoom";
import NeutralRoom from "../scenes/NeutralRoom";
import { usePageReady } from "../providers/NavigationContext";
import { useAuth } from "../providers/AuthProvider";
import {
  LayoutDashboard, LogOut, Heart, AlertTriangle, AlertCircle,
  Activity, TrendingUp, TrendingDown, Minus, Star, Zap, CircleHelp
} from "lucide-react";
import Swal from "sweetalert2";
import "../styles/scene.css";
import HelpModal from "../components/HelpModal";

// ── Mapas de datos ────────────────────────────────────────────────────────────

const EMOTION_MAP = {
  neutro:   { Icon: Heart,         color: "#00eaff", glow: "#00eaff", label: "ESTABLE",  level: 1 },
  leve:     { Icon: Activity,      color: "#00ff88", glow: "#00ff88", label: "LEVE",      level: 2 },
  estres:   { Icon: AlertTriangle, color: "#ffcc00", glow: "#ffcc00", label: "ESTRÉS",    level: 3 },
  ansiedad: { Icon: AlertCircle,   color: "#ff4466", glow: "#ff4466", label: "ANSIEDAD",  level: 4 },
};

/** Audio ambiental por emoción — null = sin audio */
const EMOTION_AUDIO = {
  neutro:   "/sounds/naturaleza.wav",
  leve:     "/sounds/naturaleza.wav",
  estres:   "/sounds/naturaleza.wav",
  ansiedad: "/sounds/naturaleza.wav",
};

const AUDIO_VOLUME = 0.11;

const getTrend = (score) => {
  if (score === null) return { Icon: Minus,       color: "#888",    label: "---"       };
  if (score <= 4)     return { Icon: TrendingDown, color: "#00ff88", label: "MEJORANDO" };
  if (score <= 9)     return { Icon: Minus,        color: "#00eaff", label: "ESTABLE"   };
  if (score <= 14)    return { Icon: TrendingUp,   color: "#ffcc00", label: "ALERTA"    };
  return                     { Icon: TrendingUp,   color: "#ff4466", label: "CRÍTICO"   };
};

const getHealthPct   = (score) => score === null ? 100 : Math.max(5, Math.round(((21 - score) / 21) * 100));
const getHealthColor = (pct)   => pct > 60 ? "#00ff88" : pct > 30 ? "#ffcc00" : "#ff4466";

// ── Helper: fade-in de volumen ────────────────────────────────────────────────

function fadeIn(audio, targetVolume, durationMs = 2000) {
  const steps    = 20;
  const stepTime = durationMs / steps;
  const stepVol  = targetVolume / steps;
  let   current  = 0;

  const interval = setInterval(() => {
    current += stepVol;
    if (current >= targetVolume) {
      audio.volume = targetVolume;
      clearInterval(interval);
    } else {
      audio.volume = current;
    }
  }, stepTime);

  return interval;
}

// ── Helper: volver a orientación portrait ────────────────────────────────────

const unlockToPortrait = async () => {
  try {
    if (screen.orientation?.lock) await screen.orientation.lock("portrait");
  } catch { /* ignorar */ }
  finally {
    if (screen.orientation?.unlock) screen.orientation.unlock();
  }
};

// ─────────────────────────────────────────────────────────────────────────────

export default function Scene() {
  const navigate        = useNavigate();
  const { user, alias } = useAuth();

  const [emotion,    setEmotion]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [lastScore,  setLastScore]  = useState(null);
  const [totalSess,  setTotalSess]  = useState(0);
  const [tick,       setTick]       = useState(0);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const audioRef     = useRef(null);
  const fadeInterval = useRef(null);

  usePageReady();

  // ── Pulso animado ───────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Al desmontar: liberar audio y orientación ───────────────────────────────
  useEffect(() => {
    return () => {
      unlockToPortrait();
      clearInterval(fadeInterval.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
        audioRef.current     = null;
      }
    };
  }, []);

  // ── Cargar emoción ──────────────────────────────────────────────────────────
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

  // ── Iniciar audio cuando se conoce la emoción ───────────────────────────────
  // Se ejecuta durante la pantalla de carga para que suene al entrar
  useEffect(() => {
    if (!emotion) return;

    const url = EMOTION_AUDIO[emotion];
    if (!url) return;

    const audio   = new Audio(url);
    audio.loop    = true;
    audio.volume  = 0;
    audioRef.current = audio;

    const startAudio = () => {
      audio.play()
        .then(() => {
          fadeInterval.current = fadeIn(audio, AUDIO_VOLUME, 2000);
        })
        .catch(() => {
          // Autoplay bloqueado — esperar primer gesto del usuario
          const onInteraction = () => {
            audio.play()
              .then(() => { fadeInterval.current = fadeIn(audio, AUDIO_VOLUME, 2000); })
              .catch(() => {});
            window.removeEventListener("click",      onInteraction);
            window.removeEventListener("touchstart", onInteraction);
            document.removeEventListener("keydown",  onInteraction);
          };
          window.addEventListener("click",      onInteraction);
          window.addEventListener("touchstart", onInteraction);
          document.addEventListener("keydown",  onInteraction);
        });
    };

    startAudio();

    return () => {
      clearInterval(fadeInterval.current);
      audio.pause();
      audio.src        = "";
      audioRef.current = null;
    };
  }, [emotion]);

  // ── Progreso en tiempo real ─────────────────────────────────────────────────
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

  // ── Handlers de navegación ──────────────────────────────────────────────────

  const handleLogout = async () => {
    const result = await Swal.fire({
      icon: "question", title: "¿Cerrar sesión?", text: "¿Seguro que deseas salir?",
      showCancelButton: true, confirmButtonText: "Sí, salir", cancelButtonText: "Cancelar",
      confirmButtonColor: "#2c5364", cancelButtonColor: "#4a5568",
    });
    if (result.isConfirmed) {
      await unlockToPortrait();
      const { signOut } = await import("firebase/auth");
      await signOut(auth);
      navigate("/");
    }
  };

  const handleBase = async () => {
    await unlockToPortrait();
    navigate("/home");
  };

  if (loading) return <div style={{ background: "#080e08", height: "100vh" }} />;

  const SceneComponent =
    emotion === "ansiedad" ? AnxietyRoom :
    emotion === "estres"   ? BasicRoom   : NeutralRoom;

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
          <button className="hud-btn hud-btn-primary" onClick={handleBase}>
            <LayoutDashboard size={13} strokeWidth={2} />
            BASE
          </button>
          <button
            className="hud-btn"
            onClick={() => setIsHelpOpen(true)}
            title="Centro de ayuda"
            style={{ border: "1px solid #4b5563", background: "#1f2937", color: "#d1d5db" }}
          >
            <CircleHelp size={13} strokeWidth={2} />
          </button>
          <button className="hud-btn hud-btn-danger" onClick={handleLogout}>
            <LogOut size={13} strokeWidth={2} />
            SALIR
          </button>
        </div>
      </div>

      {/* ── ESCENA 3D ── */}
      <SceneComponent emotion={emotion} />

      {/* ── OVERLAY ── */}
      {isHelpOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)",
          pointerEvents: "none",
        }} />
      )}

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}