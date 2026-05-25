import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import Swal from "sweetalert2";
import { ClipboardList, User, Globe, BarChart3 } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useFeedback } from "../hooks/useFeedback";

const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();

    const tone = (oscType, freq, startT, dur, gainVal, freqEnd) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      f.type = "lowpass"; f.frequency.value = 4000;
      o.connect(f); f.connect(g); g.connect(ctx.destination);
      o.type = oscType;
      o.frequency.setValueAtTime(freq, ctx.currentTime + startT);
      if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, ctx.currentTime + startT + dur);
      g.gain.setValueAtTime(0, ctx.currentTime + startT);
      g.gain.linearRampToValueAtTime(gainVal, ctx.currentTime + startT + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startT + dur);
      o.start(ctx.currentTime + startT);
      o.stop(ctx.currentTime + startT + dur + 0.05);
    };

    // cristal suave — Do-Mi-Sol agudo
    if (type === "questionnaire") {
      tone("sine", 1046, 0,    0.18, 0.18);
      tone("sine", 1318, 0.04, 0.16, 0.12);
      tone("sine", 1568, 0.08, 0.22, 0.08);
    }
    // campanilla ascendente — triángulo
    if (type === "avatar") {
      tone("triangle", 880,  0,    0.12, 0.20);
      tone("triangle", 1108, 0.10, 0.12, 0.18);
      tone("triangle", 1320, 0.20, 0.18, 0.14);
    }
    // portal espacial — sweep + brillo
    if (type === "scene") {
      tone("sawtooth", 110, 0,    0.06, 0.08, 220);
      tone("sine",     440, 0.05, 0.25, 0.12, 880);
      tone("sine",     660, 0.15, 0.20, 0.08, 1320);
      tone("triangle", 220, 0.25, 0.30, 0.06, 880);
    }
    // fanfarria suave — Do-Mi-Sol-Do arpegiado
    if (type === "progress") {
      tone("sine", 523,  0,    0.22, 0.13);
      tone("sine", 659,  0.09, 0.22, 0.13);
      tone("sine", 784,  0.18, 0.22, 0.13);
      tone("sine", 1046, 0.28, 0.22, 0.13);
    }
    // acorde zen — 528Hz armónico
    if (type === "confirm") {
      tone("sine", 528,  0,    0.30, 0.12);
      tone("sine", 792,  0.02, 0.30, 0.10);
      tone("sine", 1056, 0.04, 0.30, 0.07);
    }
    // bump grave original — señal de rechazo
    if (type === "blocked") {
      tone("sine", 220, 0,    0.12, 0.12);
      tone("sine", 180, 0.13, 0.15, 0.10);
    }

    setTimeout(() => ctx.close(), 1500);
  } catch (_) {}
};

export default function Dashboard() {
  const { alias, user } = useAuth();
  const navigate = useNavigate();
  const fb = useFeedback();

  const [questionnaireCompleted, setQuestionnaireCompleted] = useState(false);
  const [avatarSelected, setAvatarSelected]                 = useState(false);
  const [loadingState, setLoadingState]                     = useState(true);
  const [backgroundLoaded, setBackgroundLoaded]             = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = "/images/dashboard.webp";
    img.onload = () => {
      setBackgroundLoaded(true);
      document.querySelector(".dashboard-page")?.classList.add("loaded");
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchState = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setQuestionnaireCompleted(!!data.lastEmotion);
          setAvatarSelected(!!data.avatar);
        }
      } catch (e) {
        console.error("Error leyendo estado del usuario:", e);
      } finally {
        setLoadingState(false);
      }
    };
    fetchState();
  }, [user]);

  if (!backgroundLoaded || loadingState) {
    return (
      <div className="dashboard-page">
        <div className="dashboard-loading"></div>
        <div className="dashboard-container" style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: "60vh", position: "relative", zIndex: 1,
        }}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "16px" }}>
            Cargando tu espacio...
          </p>
        </div>
      </div>
    );
  }

  const showQuestionnaireReminder = () => {
    playSound("blocked");
    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
    fb.error();
    Swal.fire({
      icon: "warning",
      title: "Debes completar el cuestionario",
      text: "Primero debes llenar el cuestionario para poder elegir un avatar.",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#2c5364",
      background: "#0f2027",
      color: "#fff",
    });
  };

  const showAvatarReminder = () => {
    playSound("blocked");
    if (navigator.vibrate) navigator.vibrate([80, 40, 80]);
    fb.error();
    Swal.fire({
      icon: "info",
      title: "Selecciona un avatar",
      text: "Debes elegir un avatar antes de entrar al escenario 3D.",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#2c5364",
      background: "#0f2027",
      color: "#fff",
    });
  };

  const confirmChangeAvatar = async () => {
    playSound("confirm");
    if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
    fb.cardClick();
    const result = await Swal.fire({
      icon: "question",
      title: "¿Cambiar avatar?",
      text: "¿Quieres elegir un avatar diferente al que ya tienes seleccionado?",
      showCancelButton: true,
      confirmButtonText: "Sí, cambiar",
      cancelButtonText: "No, quedarse",
      confirmButtonColor: "#2c5364",
      background: "#0f2027",
      color: "#fff",
    });
    return result.isConfirmed;
  };

  const initial = alias?.charAt(0).toUpperCase();

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">

        <div className="dashboard-welcome">
          <div className="dashboard-avatar">
            {user?.photoURL
              ? <img src={user.photoURL} alt="avatar" />
              : <span>{initial}</span>
            }
          </div>
          <div className="dashboard-welcome-text">
            <span className="dashboard-welcome-label">Bienvenido</span>
            <span className="dashboard-welcome-alias">{alias}</span>
          </div>
        </div>

        <div className="dashboard-header-text">
          <h1 className="dashboard-title">Tu espacio de bienestar emocional</h1>
          <p className="dashboard-subtitle">
            Explora las herramientas diseñadas para acompañarte durante tu vida universitaria.
          </p>
        </div>

        <div className="dashboard-grid">

          {/* 1. Cuestionario */}
          <Link
            to="/home/questionnaire"
            className="dashboard-card"
            onClick={() => {
              playSound("questionnaire");
              if (navigator.vibrate) navigator.vibrate(30);
              fb.cardClick();
            }}
          >
            <ClipboardList size={28} />
            <h3>{questionnaireCompleted ? "Repetir cuestionario" : "Hacer cuestionario"}</h3>
            <p>{questionnaireCompleted ? "Vuelve a hacer el test" : "Completa el test de accesibilidad"}</p>
          </Link>

          {/* 2. Avatar */}
          {questionnaireCompleted ? (
            avatarSelected ? (
              <div
                className="dashboard-card"
                style={{ cursor: "pointer" }}
                onClick={async () => {
                  const confirmed = await confirmChangeAvatar();
                  if (confirmed) window.location.href = "/home/avatar";
                }}
              >
                <User size={28} />
                <h3>Cambiar avatar</h3>
                <p>¿Quieres elegir otro?</p>
              </div>
            ) : (
              <Link
                to="/home/avatar"
                className="dashboard-card"
                onClick={() => {
                  playSound("avatar");
                  if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
                  fb.cardClick();
                }}
              >
                <User size={28} />
                <h3>Elegir avatar</h3>
                <p>Selecciona tu representación</p>
              </Link>
            )
          ) : (
            <div className="dashboard-card disabled" onClick={showQuestionnaireReminder}>
              <User size={28} />
              <h3>Elegir avatar</h3>
              <p>Completa el cuestionario primero</p>
            </div>
          )}

          {/* 3. Escenario 3D */}
          {avatarSelected ? (
            <Link
              to="/home/scene"
              className="dashboard-card"
              onClick={() => {
                playSound("scene");
                if (navigator.vibrate) navigator.vibrate([10, 30, 60]);
                fb.cardClick();
              }}
            >
              <Globe size={28} />
              <h3>Escenario 3D</h3>
              <p>Explora el entorno interactivo</p>
            </Link>
          ) : (
            <div className="dashboard-card disabled" onClick={showAvatarReminder}>
              <Globe size={28} />
              <h3>Escenario 3D</h3>
              <p>Elige un avatar primero</p>
            </div>
          )}

          {/* 4. Progreso */}
          <Link
            to="/home/progress"
            className="dashboard-card"
            onClick={() => {
              playSound("progress");
              if (navigator.vibrate) navigator.vibrate([15, 30, 15, 30, 15]);
              fb.cardClick();
            }}
          >
            <BarChart3 size={28} />
            <h3>Ver progreso</h3>
            <p>Consulta tus resultados</p>
          </Link>

        </div>

        <p className="dashboard-footer">
          Aquí aparecerán recomendaciones y tu historial.
        </p>

      </div>
    </div>
  );
}