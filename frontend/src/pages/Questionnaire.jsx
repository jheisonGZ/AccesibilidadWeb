import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../services/firebase";
import {
  doc, setDoc, addDoc, collection, getDocs,
  orderBy, query, limit, serverTimestamp, increment
} from "firebase/firestore";
import Swal from "sweetalert2";
import {
  Wind, Brain, BookOpen, BatteryLow, Zap, Activity,
  Heart, AlertTriangle, AlertCircle, ArrowRight, ArrowLeft,
  CheckCircle, Frown, HeartCrack, ChevronDown
} from "lucide-react";
import "../styles/questionnaire.css";
import { useAppNavigate } from "../providers/NavigationContext";

const QUESTIONS = [
  { id: "q1", text: "Me he sentido nervioso/a, ansioso/a o con los nervios de punta.",             icon: Wind,       dimension: "ansiedad" },
  { id: "q2", text: "No he podido dejar de preocuparme o controlar mis preocupaciones.",           icon: Brain,      dimension: "ansiedad" },
  { id: "q3", text: "Me he sentido triste o con el ánimo muy bajo sin saber bien por qué.",        icon: Frown,      dimension: "ansiedad" },
  { id: "q4", text: "Me ha costado concentrarme en mis actividades académicas.",                   icon: BookOpen,   dimension: "estres"   },
  { id: "q5", text: "Me he sentido agotado/a o con poca energía durante el día.",                  icon: BatteryLow, dimension: "estres"   },
  { id: "q6", text: "He tenido síntomas físicos como palpitaciones, sudoración o sensación de ahogo al estresarme.", icon: Zap, dimension: "ansiedad" },
  { id: "q7", text: "He tenido pensamientos negativos sobre mi futuro o he sentido que no soy suficientemente capaz.", icon: HeartCrack, dimension: "estres" },
];

const OPTIONS = [
  { value: 0, label: "Nunca",           sublabel: "No me ha ocurrido"  },
  { value: 1, label: "Varios días",     sublabel: "Algunas veces"      },
  { value: 2, label: "Más de la mitad", sublabel: "Con frecuencia"     },
  { value: 3, label: "Casi siempre",    sublabel: "La mayoría de días" },
];

const STEP_COLORS = [
  "#7ecfff","#60c8f0","#4dc9c9","#5dd68a",
  "#f0c14b","#f09050","#c084fc",
];

const MAX_SCORE = QUESTIONS.length * 3;

const classify = (score) => {
  if (score >= 15) return { label: "Ansiedad elevada",  Icon: AlertCircle,   color: "#f87171", key: "ansiedad", desc: "Se recomienda buscar apoyo profesional." };
  if (score >= 10) return { label: "Estrés moderado",   Icon: AlertTriangle, color: "#fbbf24", key: "estres",   desc: "Considera técnicas de manejo del estrés." };
  if (score >= 5)  return { label: "Leve malestar",     Icon: Activity,      color: "#34d399", key: "leve",     desc: "Pequeños ajustes pueden ayudarte." };
  return                  { label: "Bienestar estable", Icon: Heart,         color: "#7ecfff", key: "neutro",   desc: "¡Vas muy bien! Sigue así." };
};

const calcDimensionScores = (answers) => {
  let puntaje_ansiedad = 0, puntaje_estres = 0;
  QUESTIONS.forEach((q, i) => {
    const val = answers[i] ?? 0;
    if (q.dimension === "ansiedad") puntaje_ansiedad += val;
    else puntaje_estres += val;
  });
  return { puntaje_ansiedad, puntaje_estres };
};

const lineFillPercent = (val) => val === null ? 0 : Math.round((val / 3) * 100);

const playSound = (type) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.gain.value = 0.3;
    master.connect(ctx.destination);
    const tone = (freq, start, duration, vol = 0.3) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(master);
      o.type = "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      o.start(ctx.currentTime + start); o.stop(ctx.currentTime + start + duration);
    };
    if (type === "select")       { tone(520, 0, 0.12); }
    else if (type === "advance") { tone(440, 0, 0.08); tone(560, 0.09, 0.1); }
    else if (type === "finish")  { tone(440, 0, 0.1); tone(554, 0.12, 0.1); tone(660, 0.24, 0.2); }
    setTimeout(() => ctx.close(), 1000);
  } catch (_) {}
};

export default function Questionnaire() {
  const rawNavigate = useNavigate();
  const navigate    = useAppNavigate();

  const [step,          setStep]          = useState(0);
  const [answers,       setAnswers]       = useState(Array(QUESTIONS.length).fill(null));
  const [saving,        setSaving]        = useState(false);
  const [done,          setDone]          = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false); // FIX: acordeón colapsado por defecto

  useEffect(() => {
    localStorage.setItem("q_done", done ? "1" : "0");
    return () => localStorage.removeItem("q_done");
  }, [done]);

  const score    = useMemo(() => answers.reduce((a, b) => a + (b ?? 0), 0), [answers]);
  const result   = useMemo(() => classify(score), [score]);
  const progress = (step / QUESTIONS.length) * 100;

  const current     = QUESTIONS[step];
  const Icon        = current?.icon;
  const accentColor = STEP_COLORS[step] ?? STEP_COLORS[0];

  const handleSelect = (value) => {
    const next = [...answers]; next[step] = value; setAnswers(next);
    playSound("select");
    if (navigator.vibrate) navigator.vibrate(40);
    setTimeout(() => {
      if (step < QUESTIONS.length - 1) {
        playSound("advance");
        if (navigator.vibrate) navigator.vibrate([30, 30, 30]);
        setStep(s => s + 1);
      } else {
        playSound("finish");
        if (navigator.vibrate) navigator.vibrate([50, 30, 50, 30, 100]);
        setDone(true);
      }
    }, 320);
  };

  const handleBack = () => {
    if (done) { setDone(false); return; }
    if (step > 0) setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    setSaving(true);
    localStorage.setItem("emotion", result.key);
    try {
      const user = auth.currentUser;
      if (!user) { rawNavigate("/"); return; }

      const { puntaje_ansiedad, puntaje_estres } = calcDimensionScores(answers);
      const respuestas = QUESTIONS.map((q, i) => ({
        id: q.id, pregunta: q.text, dimension: q.dimension,
        valor: answers[i] ?? 0,
        etiqueta: OPTIONS[answers[i] ?? 0]?.label ?? "Nunca",
      }));

      let puntaje_anterior = null;
      try {
        const prevSnap = await getDocs(query(
          collection(db, "users", user.uid, "assessments"),
          orderBy("createdAt", "desc"), limit(1)
        ));
        if (!prevSnap.empty) puntaje_anterior = prevSnap.docs[0].data().score ?? null;
      } catch (_) {}

      const mejora = puntaje_anterior !== null ? puntaje_anterior - score : null;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email, lastEmotion: result.key,
        nivel_progreso: result.key, updatedAt: serverTimestamp(),
      }, { merge: true });

      await addDoc(collection(db, "users", user.uid, "assessments"), {
        id_usuario: user.uid, email: user.email, createdAt: serverTimestamp(),
        respuestas, score, puntaje_estres, puntaje_ansiedad,
        classification: result.key, puntaje_emocional: result.label,
        puntaje_anterior, mejora,
      });

      await setDoc(doc(db, "users", user.uid, "meta", "stats"), {
        totalAssessments: increment(1), lastScore: score,
        scoreImprovement: mejora !== null ? increment(Math.max(0, mejora)) : increment(0),
        lastUpdated: serverTimestamp(),
      }, { merge: true });

      await Swal.fire({
        icon: "success", title: result.label,
        html: `Tu puntaje fue <b>${score} / ${MAX_SCORE}</b>.<br/>${result.desc}`,
        confirmButtonText: "Elegir avatar", confirmButtonColor: "#2c5364",
        background: "#0f2027", color: "#fff", iconColor: result.color,
      });

      navigate("/home/avatar", "Preparando tu avatar");

    } catch (e) {
      console.error(e);
      setSaving(false);
      Swal.fire({ icon: "error", title: "Error", text: "No se pudo guardar. Intenta de nuevo.", confirmButtonColor: "#2c5364" });
    }
  };

  /* ══ PANTALLA RESULTADO ══ */
  if (done) {
    const { Icon: ResIcon, label, color, desc } = result;
    const { puntaje_ansiedad, puntaje_estres }  = calcDimensionScores(answers);
    const maxAnsiedad = QUESTIONS.filter(q => q.dimension === "ansiedad").length * 3;
    const maxEstres   = QUESTIONS.filter(q => q.dimension === "estres").length   * 3;

    return (
      <div className="q-page" style={{ "--q-accent": color }}>
        <div className="q-container q-result-screen">

          {/* ── 1. Cabecera compacta ── */}
          <div className="q-result-header">
            <div className="q-result-icon-big" style={{ color }}>
              <ResIcon size={44} strokeWidth={1.5} />
            </div>
            <div className="q-result-header-text">
              <h2 className="q-result-title" style={{ color }}>{label}</h2>
              <p className="q-result-desc">{desc}</p>
            </div>
          </div>

          {/* ── 2. Métricas: score ring + dimensiones en fila ── */}
          <div className="q-metrics-row">
            <div className="q-score-ring">
              <svg viewBox="0 0 120 120" width="110" height="110">
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="10"
                  strokeDasharray={`${(score / MAX_SCORE) * 314} 314`}
                  strokeLinecap="round" transform="rotate(-90 60 60)"
                  style={{ transition: "stroke-dasharray 1s ease" }}
                />
              </svg>
              <div className="q-score-center">
                <span className="q-score-num" style={{ color }}>{score}</span>
                <span className="q-score-max">/ {MAX_SCORE}</span>
              </div>
            </div>

            <div className="q-dimension-breakdown">
              <div className="q-dim-item">
                <AlertTriangle size={14} color="#fbbf24" />
                <span className="q-dim-label">Estrés</span>
                <div className="q-dim-bar-track">
                  <div className="q-dim-bar-fill" style={{ width: `${(puntaje_estres / maxEstres) * 100}%`, background: "#fbbf24" }} />
                </div>
                <span className="q-dim-val" style={{ color: "#fbbf24" }}>{puntaje_estres}/{maxEstres}</span>
              </div>
              <div className="q-dim-item">
                <AlertCircle size={14} color="#f87171" />
                <span className="q-dim-label">Ansiedad</span>
                <div className="q-dim-bar-track">
                  <div className="q-dim-bar-fill" style={{ width: `${(puntaje_ansiedad / maxAnsiedad) * 100}%`, background: "#f87171" }} />
                </div>
                <span className="q-dim-val" style={{ color: "#f87171" }}>{puntaje_ansiedad}/{maxAnsiedad}</span>
              </div>
            </div>
          </div>

          {/* ── 3. Respuestas: acordeón colapsable ── */}
          <div className="q-answers-accordion">
            <button
              className={`q-accordion-toggle ${accordionOpen ? "open" : ""}`}
              onClick={() => setAccordionOpen(v => !v)}
            >
              <span>Ver mis {QUESTIONS.length} respuestas</span>
              <ChevronDown size={16} />
            </button>
            <div className={`q-accordion-body ${accordionOpen ? "open" : ""}`}>
              <div className="q-answers-summary">
                {QUESTIONS.map((q, i) => {
                  const Q   = q.icon;
                  const opt = OPTIONS[answers[i] ?? 0] ?? OPTIONS[0];
                  return (
                    <div className="q-summary-row" key={i}>
                      <Q size={16} style={{ color: "#7ecfff", flexShrink: 0 }} />
                      <span className="q-summary-q">{q.text}</span>
                      <span className="q-summary-a" style={{ color }}>{opt?.label ?? "Sin respuesta"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── 4. Taison Insight ── */}
          <div className="q-taison-insight" style={{ borderColor: color + "44" }}>
            <div className="q-taison-bubble" style={{ borderColor: color + "55" }}>
              <span className="q-taison-name" style={{ color }}>🐾 Taison dice:</span>
              <p className="q-taison-text">
                {result.key === "neutro"   && "¡Woof! Tu estado emocional se ve estable. Sigue cuidando tus hábitos de descanso y pausas activas cada 45 minutos durante el estudio. ¡Vas muy bien!"}
                {result.key === "leve"     && "Woof, noto que has tenido momentos difíciles. Está bien no estar al 100%. Te recomiendo la técnica Pomodoro (25 min trabajo, 5 descanso) y escribir 5 minutos al día sobre cómo te sientes."}
                {result.key === "estres"   && "Woof... estás cargando bastante. Prueba la respiración 4-7-8: inhala 4 segundos, sostén 7, exhala 8. También la Matriz Eisenhower te ayuda a priorizar sin agobiarte. No tienes que resolver todo hoy."}
                {result.key === "ansiedad" && "Woof, gracias por completar esto. Lo que sientes es válido y merece atención. Te invito a acercarte a Bienestar UV (edificio 304, ext. 2551/2552). No estás solo/a. Cuando quieras hablar, aquí estoy."}
              </p>
            </div>
          </div>

          {/* ── 5. Acciones — z-index 9999 para estar encima del chatbot ── */}
          <div className="q-result-actions">
            <button className="q-btn-back" onClick={handleBack}>
              <ArrowLeft size={16} /> Revisar
            </button>
            <button className="q-btn-submit" onClick={handleSubmit} disabled={saving}>
              {saving ? "Guardando..." : <><CheckCircle size={18} /> Confirmar y continuar</>}
            </button>
          </div>

        </div>
      </div>
    );
  }

  /* ══ PANTALLA PREGUNTA ══ */
  return (
    <div className="q-page" style={{ "--q-accent": accentColor }}>
      <div className="q-container">

        <div className="q-top">
          <div className="q-step-label">Pregunta <b>{step + 1}</b> de {QUESTIONS.length}</div>
          <div className="q-progress-bar">
            <div className="q-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="q-card-single" key={step}>
          <div className="q-card-icon-wrap">
            <Icon size={30} strokeWidth={1.5} />
          </div>
          <p className="q-card-question">{current.text}</p>
          <p className="q-card-hint">¿Con qué frecuencia en los últimos 7 días?</p>

          <div className="q-scale-wrapper">
            <div className="q-scale-row">
              <div className="q-scale-line">
                <div className="q-scale-line-fill" style={{ width: `${lineFillPercent(answers[step])}%` }} />
              </div>
              {OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`q-option-card ${answers[step] === opt.value ? "selected" : ""}`}
                  onClick={() => handleSelect(opt.value)}
                >
                  <div className="q-opt-circle">
                    <span className="q-opt-value">{opt.value}</span>
                  </div>
                  <span className="q-opt-label">{opt.label}</span>
                  <span className="q-opt-sub">{opt.sublabel}</span>
                </button>
              ))}
            </div>
            <div className="q-scale-extremes">
              <span className="q-scale-extreme">← Menor frecuencia</span>
              <span className="q-scale-extreme">Mayor frecuencia →</span>
            </div>
          </div>
        </div>

        <div className="q-nav">
          <button className="q-btn-back" onClick={handleBack} disabled={step === 0}>
            <ArrowLeft size={16} /> Anterior
          </button>
          {answers[step] !== null && step < QUESTIONS.length - 1 && (
            <button className="q-btn-next" onClick={() => setStep(s => s + 1)}>
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