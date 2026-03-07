import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import { 
  doc, 
  setDoc, 
  addDoc, 
  collection, 
  getDocs, 
  orderBy, 
  query, 
  limit, 
  serverTimestamp,
  increment
} from "firebase/firestore";
import Swal from "sweetalert2";
import {
  Wind, Brain, BookOpen, BatteryLow, Zap, CloudRain, Activity,
  Heart, AlertTriangle, AlertCircle, ArrowRight, ArrowLeft, CheckCircle
} from "lucide-react";
import "../styles/questionnaire.css";
import { useAppNavigate } from "../providers/NavigationContext";

const QUESTIONS = [
  { id: "q1", text: "Me he sentido nervioso/a, ansioso/a o con los nervios de punta.",         icon: Wind,       dimension: "ansiedad" },
  { id: "q2", text: "No he podido dejar de preocuparme o controlar mis preocupaciones.",        icon: Brain,      dimension: "ansiedad" },
  { id: "q3", text: "Me ha costado concentrarme en mis actividades académicas.",                icon: BookOpen,   dimension: "estres"   },
  { id: "q4", text: "Me he sentido agotado/a o con poca energía durante el día.",               icon: BatteryLow, dimension: "estres"   },
  { id: "q5", text: "He sentido tensión muscular, irritabilidad o dificultad para relajarme.",  icon: Zap,        dimension: "estres"   },
  { id: "q6", text: "He tenido poco interés o placer en hacer las cosas que antes disfrutaba.", icon: CloudRain,  dimension: "ansiedad" },
  { id: "q7", text: "He sentido que necesito un descanso mental urgente.",                      icon: Activity,   dimension: "estres"   },
];

const OPTIONS = [
  { value: 0, label: "Nunca",           sublabel: "No me ha ocurrido" },
  { value: 1, label: "Varios días",     sublabel: "Algunas veces"     },
  { value: 2, label: "Más de la mitad", sublabel: "Con frecuencia"    },
  { value: 3, label: "Casi siempre",    sublabel: "La mayoría de días" },
];

const classify = (score) => {
  if (score >= 15) return { label: "Ansiedad elevada",  Icon: AlertCircle,   color: "#f87171", key: "ansiedad", desc: "Se recomienda buscar apoyo profesional." };
  if (score >= 10) return { label: "Estrés moderado",   Icon: AlertTriangle, color: "#fbbf24", key: "estres",   desc: "Considera técnicas de manejo del estrés." };
  if (score >= 5)  return { label: "Leve malestar",     Icon: Activity,      color: "#34d399", key: "leve",     desc: "Pequeños ajustes pueden ayudarte." };
  return                  { label: "Bienestar estable", Icon: Heart,         color: "#7ecfff", key: "neutro",   desc: "¡Vas muy bien! Sigue así." };
};

const calcDimensionScores = (answers) => {
  let puntaje_ansiedad = 0;
  let puntaje_estres   = 0;
  QUESTIONS.forEach((q, i) => {
    const val = answers[i] ?? 0;
    if (q.dimension === "ansiedad") puntaje_ansiedad += val;
    else                            puntaje_estres   += val;
  });
  return { puntaje_ansiedad, puntaje_estres };
};

export default function Questionnaire() {
  const rawNavigate = useNavigate();
  const navigate    = useAppNavigate();

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

      const { puntaje_ansiedad, puntaje_estres } = calcDimensionScores(answers);

      const respuestas = QUESTIONS.map((q, i) => ({
        id:        q.id,
        pregunta:  q.text,
        dimension: q.dimension,
        valor:     answers[i] ?? 0,
        etiqueta:  OPTIONS[answers[i] ?? 0]?.label ?? "Nunca",
      }));

      let puntaje_anterior = null;
      try {
        const prevQ    = query(collection(db, "users", user.uid, "assessments"), orderBy("createdAt", "desc"), limit(1));
        const prevSnap = await getDocs(prevQ);
        if (!prevSnap.empty) puntaje_anterior = prevSnap.docs[0].data().score ?? null;
      } catch (_) { /* sin historial previo */ }

      const mejora = puntaje_anterior !== null ? puntaje_anterior - score : null;

      await setDoc(
        doc(db, "users", user.uid),
        {
          email:            user.email,
          lastEmotion:      result.key,
          nivel_progreso:   result.key,
          updatedAt:        serverTimestamp(),
        },
        { merge: true }
      );

      await addDoc(
        collection(db, "users", user.uid, "assessments"),
        {
          id_usuario:          user.uid,
          email:               user.email,
          createdAt:           serverTimestamp(),
          respuestas:          respuestas,
          score,
          puntaje_estres,
          puntaje_ansiedad,
          classification:      result.key,
          puntaje_emocional:   result.label,
          puntaje_anterior,
          mejora,
        }
      );

      const statsRef = doc(db, "users", user.uid, "meta", "stats");
      await setDoc(
        statsRef,
        {
          totalAssessments: increment(1),
          lastScore:        score,
          scoreImprovement: mejora !== null ? increment(Math.max(0, mejora)) : increment(0),
          lastUpdated:      serverTimestamp(),
        },
        { merge: true }
      );

      await Swal.fire({
        icon:              "success",
        title:             result.label,
        html:              `Tu puntaje fue <b>${score} / 21</b>.<br/>${result.desc}`,
        confirmButtonText: "Elegir avatar",
        confirmButtonColor: "#2c5364",
        background:        "#0f2027",
        color:             "#fff",
        iconColor:         result.color,
      });

      navigate("/home/avatar", "Preparando tu avatar");

    } catch (e) {
      console.error(e);
      setSaving(false);
      Swal.fire({
        icon:              "error",
        title:             "Error",
        text:              "No se pudo guardar. Intenta de nuevo.",
        confirmButtonColor: "#2c5364",
      });
    }
  };

  if (done) {
    const { Icon: ResIcon, label, color, desc } = result;
    const { puntaje_ansiedad, puntaje_estres }  = calcDimensionScores(answers);

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

          <div className="q-dimension-breakdown">
            <div className="q-dim-item">
              <AlertTriangle size={14} color="#fbbf24" />
              <span className="q-dim-label">Estrés</span>
              <div className="q-dim-bar-track">
                <div className="q-dim-bar-fill" style={{ width: `${(puntaje_estres / 12) * 100}%`, background: "#fbbf24" }} />
              </div>
              <span className="q-dim-val" style={{ color: "#fbbf24" }}>{puntaje_estres}/12</span>
            </div>
            <div className="q-dim-item">
              <AlertCircle size={14} color="#f87171" />
              <span className="q-dim-label">Ansiedad</span>
              <div className="q-dim-bar-track">
                <div className="q-dim-bar-fill" style={{ width: `${(puntaje_ansiedad / 9) * 100}%`, background: "#f87171" }} />
              </div>
              <span className="q-dim-val" style={{ color: "#f87171" }}>{puntaje_ansiedad}/9</span>
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