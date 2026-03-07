import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import Swal from "sweetalert2";
import {
  Wind, Brain, BookOpen, BatteryLow, Zap, CloudRain, Activity,
  Heart, AlertTriangle, AlertCircle, ArrowRight, ArrowLeft, CheckCircle
} from "lucide-react";
import "../styles/questionnaire.css";

// ── Navegación global con LoadingScreen ───────────────────────────────────
// useAppNavigate reemplaza al useNavigate de react-router.
// Muestra el LoadingScreen en el layout ANTES de cambiar de ruta,
// evitando cualquier flash blanco entre pantallas.
import { useAppNavigate } from "../providers/NavigationContext";

const QUESTIONS = [
  { text: "Me he sentido nervioso/a, ansioso/a o con los nervios de punta.",         icon: Wind },
  { text: "No he podido dejar de preocuparme o controlar mis preocupaciones.",        icon: Brain },
  { text: "Me ha costado concentrarme en mis actividades académicas.",                icon: BookOpen },
  { text: "Me he sentido agotado/a o con poca energía durante el día.",               icon: BatteryLow },
  { text: "He sentido tensión muscular, irritabilidad o dificultad para relajarme.",  icon: Zap },
  { text: "He tenido poco interés o placer en hacer las cosas que antes disfrutaba.", icon: CloudRain },
  { text: "He sentido que necesito un descanso mental urgente.",                      icon: Activity },
];

const OPTIONS = [
  { value: 0, label: "Nunca",           sublabel: "No me ha ocurrido" },
  { value: 1, label: "Varios días",     sublabel: "Algunas veces" },
  { value: 2, label: "Más de la mitad", sublabel: "Con frecuencia" },
  { value: 3, label: "Casi siempre",    sublabel: "La mayoría de días" },
];

const classify = (score) => {
  if (score >= 15) return { label: "Ansiedad elevada",  Icon: AlertCircle,   color: "#f87171", key: "ansiedad", desc: "Se recomienda buscar apoyo profesional." };
  if (score >= 10) return { label: "Estrés moderado",   Icon: AlertTriangle, color: "#fbbf24", key: "estres",   desc: "Considera técnicas de manejo del estrés." };
  if (score >= 5)  return { label: "Leve malestar",     Icon: Activity,      color: "#34d399", key: "leve",     desc: "Pequeños ajustes pueden ayudarte." };
  return                  { label: "Bienestar estable", Icon: Heart,         color: "#7ecfff", key: "neutro",   desc: "¡Vas muy bien! Sigue así." };
};

export default function Questionnaire() {
  // rawNavigate solo para redirecciones de error (ej: usuario no logueado)
  const rawNavigate = useNavigate();

  // navigate con LoadingScreen — usar para transiciones normales de flujo
  const navigate = useAppNavigate();

  const [step,    setStep]    = useState(0);
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(null));
  const [saving,  setSaving]  = useState(false);
  const [done,    setDone]    = useState(false);

  const score    = useMemo(() => answers.reduce((a, b) => a + (b ?? 0), 0), [answers]);
  const result   = useMemo(() => classify(score), [score]);
  const progress = ((step) / QUESTIONS.length) * 100;

  const current = QUESTIONS[step];
  const Icon    = current?.icon;

  const handleSelect = (value) => {
    const next = [...answers];
    next[step] = value;
    setAnswers(next);
    setTimeout(() => {
      if (step < QUESTIONS.length - 1) setStep(step + 1);
      else setDone(true);
    }, 300);
  };

  const handleBack = () => {
    if (done) { setDone(false); return; }
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    localStorage.setItem("emotion", result.key);

    try {
      const user = auth.currentUser;
      if (!user) { rawNavigate("/"); return; }

      await setDoc(
        doc(db, "users", user.uid),
        { email: user.email, lastEmotion: result.key, updatedAt: serverTimestamp() },
        { merge: true }
      );
      await setDoc(
        doc(db, "users", user.uid, "assessments", String(Date.now())),
        { email: user.email, score, classification: result.key, createdAt: serverTimestamp() }
      );

      await Swal.fire({
        icon: "success",
        title: result.label,
        html: `Tu puntaje fue <b>${score} / 21</b>.<br/>${result.desc}`,
        confirmButtonText: "Elegir avatar",
        confirmButtonColor: "#2c5364",
        background: "#0f2027",
        color: "#fff",
        iconColor: result.color,
      });

      // ── Navega con LoadingScreen ─────────────────────────────────────────
      // El LoadingScreen se muestra ENCIMA del layout actual (no desmonta nada),
      // y navega solo cuando la barra llega al 100%. Sin flash blanco.
      navigate("/home/avatar", "Preparando tu avatar");

    } catch (e) {
      console.error(e);
      setSaving(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo guardar. Intenta de nuevo.",
        confirmButtonColor: "#2c5364",
      });
    }
  };

  // ── Pantalla de resultado ─────────────────────────────────────────────────
  if (done) {
    const { Icon: ResIcon, label, color, desc } = result;
    return (
      <div className="q-page">
        <div className="q-container q-result-screen">
          <div className="q-result-icon-big" style={{ color }}>
            <ResIcon size={64} strokeWidth={1.5} />
          </div>
          <h2 className="q-result-title" style={{ color }}>{label}</h2>
          <p className="q-result-desc">{desc}</p>

          <div className="q-score-ring">
            <svg viewBox="0 0 120 120" width="140" height="140">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10"/>
              <circle
                cx="60" cy="60" r="50"
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeDasharray={`${(score / 21) * 314} 314`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
                style={{ transition: "stroke-dasharray 1s ease" }}
              />
            </svg>
            <div className="q-score-center">
              <span className="q-score-num" style={{ color }}>{score}</span>
              <span className="q-score-max">/ 21</span>
            </div>
          </div>

          <div className="q-answers-summary">
            {QUESTIONS.map((q, i) => {
              const Q   = q.icon;
              const opt = OPTIONS[answers[i]];
              return (
                <div className="q-summary-row" key={i}>
                  <Q size={16} style={{ color: "#7ecfff", flexShrink: 0 }} />
                  <span className="q-summary-q">{q.text}</span>
                  <span className="q-summary-a" style={{ color }}>{opt?.label}</span>
                </div>
              );
            })}
          </div>

          <div className="q-result-actions">
            <button className="q-btn-back" onClick={handleBack}>
              <ArrowLeft size={16} /> Revisar
            </button>
            <button className="q-btn-submit" onClick={handleSubmit} disabled={saving}>
              {saving
                ? "Guardando..."
                : <><CheckCircle size={18} /> Confirmar y continuar</>
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Pantalla de pregunta ──────────────────────────────────────────────────
  return (
    <div className="q-page">
      <div className="q-container">

        <div className="q-top">
          <div className="q-step-label">
            Pregunta <b>{step + 1}</b> de {QUESTIONS.length}
          </div>
          <div className="q-progress-bar">
            <div className="q-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="q-card-single" key={step}>
          <div className="q-card-icon-wrap">
            <Icon size={32} strokeWidth={1.5} />
          </div>
          <p className="q-card-question">{current.text}</p>
          <p className="q-card-hint">¿Con qué frecuencia en los últimos 7 días?</p>

          <div className="q-options-grid">
            {OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`q-option-card ${answers[step] === opt.value ? "selected" : ""}`}
                onClick={() => handleSelect(opt.value)}
              >
                <span className="q-opt-value">{opt.value}</span>
                <span className="q-opt-label">{opt.label}</span>
                <span className="q-opt-sub">{opt.sublabel}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="q-nav">
          <button className="q-btn-back" onClick={handleBack} disabled={step === 0}>
            <ArrowLeft size={16} /> Anterior
          </button>
          {answers[step] !== null && step < QUESTIONS.length - 1 && (
            <button className="q-btn-next" onClick={() => setStep(step + 1)}>
              Siguiente <ArrowRight size={16} />
            </button>
          )}
        </div>

        <div className="q-dots">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`q-dot ${i === step ? "active" : ""} ${answers[i] !== null ? "answered" : ""}`}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

      </div>
    </div>
  );
}