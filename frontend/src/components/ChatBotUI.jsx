// =============================================================================
// src/components/ChatBotUI.jsx
// =============================================================================

import { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useAuth } from "../providers/AuthProvider";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { gsap } from "gsap";
import { useLocation } from "react-router-dom";
import "../styles/chatbot.css";

const TAISON_MODEL = "/models/taison.glb";

const BASE_PROMPT =
  "Eres Taison, un asistente virtual de bienestar emocional creado exclusivamente " +
  "para los estudiantes de la Escuela de Ingenieria de Sistemas y Computacion (EISC) " +
  "de la Universidad del Valle, en Santiago de Cali, Colombia. " +
  "PROPOSITO: Brindar acompanamiento emocional, orientacion en autocuidado y recursos " +
  "de manejo del estres academico. Solo puedes abordar temas de bienestar emocional, " +
  "estres academico, ansiedad universitaria, tecnicas de relajacion, habitos de autocuidado, " +
  "vida universitaria en la EISC o la UV, y recursos institucionales. " +
  "RESTRICCION ABSOLUTA: Si el usuario pregunta algo ajeno al bienestar emocional " +
  "universitario, responde amablemente que esta fuera de tu alcance y redirige. " +
  "Nunca respondas preguntas tecnicas ni generales aunque insistan. " +
  "PERSONALIDAD: Calido, cercano, empatico y optimista. Lenguaje informal pero respetuoso. " +
  "Nunca condescendiente ni minimizas emociones. " +
  "CONTEXTO: En la EISC el 70.6% identifica la carga academica como principal estresante. " +
  "El 76.5% no usa servicios psicologicos UV. Estudiantes de 18-26 anos. " +
  "TECNICAS: Respiracion 4-7-8 (inhala 4, sostiene 7, exhala 8). " +
  "Grounding 5-4-3-2-1 (5 ves, 4 tocas, 3 escuchas, 2 hueles, 1 saboreas). " +
  "Pomodoro (25 min trabajo, 5 descanso). Matriz Eisenhower (urgente/importante). " +
  "Higiene del sueno, pausas activas cada 45 min, escritura emocional 5 min/dia. " +
  "LIMITES: Nunca diagnosticas. En crisis remite a Bienestar UV edificio 304 ext 2551/2552. " +
  "FORMATO: Maximo 4 oraciones. Sin listas salvo que se pidan. Espanol colombiano. " +
  "IDENTIDAD: Creado por Jheison Estiben Gomez Munoz, trabajo de grado UV, " +
  "bajo direccion del PhD Javier Mauricio Reyes Vera.";

const SYSTEM_PROMPTS = {
  neutro:
    BASE_PROMPT +
    " NIVEL: BIENESTAR ESTABLE (0-4). Sin sintomas significativos. " +
    "Refuerza positivamente, ofrece estrategias preventivas y habitos protectores.",
  leve:
    BASE_PROMPT +
    " NIVEL: LEVE MALESTAR (5-9). Sintomas leves, nivel mas comun en EISC. " +
    "Valida sin minimizar. Ofrece una o dos tecnicas aplicables hoy.",
  estres:
    BASE_PROMPT +
    " NIVEL: ESTRES MODERADO (10-14). Perfil del 70.6% de estudiantes EISC. " +
    "Ayuda a priorizar con Pomodoro o Eisenhower. Ofrece respiracion 4-7-8. " +
    "Si menciona materias o fechas, crea un mini plan de accion.",
  ansiedad:
    BASE_PROMPT +
    " NIVEL: ANSIEDAD ELEVADA (15-21). ESTRATEGIA OBLIGATORIA: primero calma, luego orienta. " +
    "Comienza siempre con respiracion o grounding. Frases: 'Estoy aqui contigo', " +
    "'Lo que sientes es real', 'Vamos paso a paso'. Sugiere Bienestar UV con gentileza. " +
    "NUNCA minimices. NUNCA listes consejos en crisis.",
  questionnaire:
    BASE_PROMPT +
    " CONTEXTO ESPECIAL: El usuario esta completando el cuestionario de autoevaluacion emocional. " +
    "Tu rol aqui es orientar y acompanar durante el proceso. Si preguntan sobre alguna pregunta, " +
    "explica con calma y empatia que significa y como responderla honestamente. " +
    "Recuerdales que no hay respuestas correctas o incorrectas, solo su experiencia real. " +
    "Animalos a completar el cuestionario para recibir orientacion personalizada.",
  resultado:
    BASE_PROMPT +
    " CONTEXTO ESPECIAL: El usuario acaba de ver su resultado del cuestionario emocional. " +
    "Tu rol es explicar el resultado con empatia, responder dudas sobre que significa cada nivel, " +
    "y ofrecer estrategias concretas segun su puntaje. Se caloroso, validador y orientador. " +
    "No repitas el resultado, profundiza en el.",
  avatar:
    BASE_PROMPT +
    " CONTEXTO ESPECIAL: El usuario esta eligiendo su avatar para el entorno 3D de bienestar. " +
    "Explica brevemente que cada avatar es solo una representacion visual y no afecta el contenido. " +
    "Alejandro: estudiante activo y curioso, ideal si te identificas con energia y exploracion. " +
    "Valentina: creativa, empatica y decidida, ideal si valoras la expresion y la conexion. " +
    "Sebastian: apasionado por la tecnologia, ideal si te sientes tech y analitico. " +
    "Katerin: reflexiva y lista para aprender, ideal si valoras la calma y la introspection. " +
    "Anima al usuario a elegir el que mas le represente y recuerda que puede cambiarlo despues.",

  progreso:
  BASE_PROMPT +
  " CONTEXTO ESPECIAL: El usuario esta revisando su progreso emocional historico dentro de la plataforma. " +
  "Puedes analizar tendencias emocionales, cambios entre evaluaciones, avances, recaidas y patrones generales. " +
  "Tu objetivo es ayudarle a reflexionar sobre su evolucion emocional de manera empatica y motivadora. " +
  "Si el usuario ha mejorado, reconoce y refuerza sus avances. " +
  "Si mantiene niveles altos de ansiedad o estres, evita juzgar y enfocate en apoyo emocional gradual. " +
  "Si hay recaidas emocionales, explicale que el progreso no siempre es lineal y que pequenos pasos tambien cuentan. " +
  "Ayudalo a identificar posibles causas relacionadas con carga academica, descanso, organizacion o presion universitaria. " +
  "Puedes recomendar tecnicas como Pomodoro, respiracion 4-7-8, grounding, pausas activas o higiene del sueno dependiendo del caso. " +
  "Nunca hagas diagnosticos clinicos. " +
  "Habla como un acompanante cercano que observa el progreso completo y no solo un resultado aislado.",
};


const WELCOME_MESSAGES = {
  neutro:
    "Woof! Hola, soy Taison. Tu estado emocional se ve estable hoy, y eso vale la pena cuidar. " +
    "En que puedo acompanarte?",
  leve:
    "Woof! Hola, soy Taison. Veo que has tenido algunos momentos dificiles ultimamente. " +
    "Estoy aqui para escucharte sin juzgarte. Que esta pasando?",
  estres:
    "Woof! Hola, soy Taison. Noto que estas cargando bastante estres. " +
    "La EISC puede ser muy exigente y eso es real. Cuentame, por donde quieres empezar?",
  ansiedad:
    "Woof... Hola, soy Taison. No estas solo en esto. Hagamos un ejercicio juntos: " +
    "inhala 4 segundos, sostiene 7, exhala 8. Cuando estes listo, cuentame.",
  questionnaire:
    "Woof! Hola, soy Taison. Veo que estas completando tu autoevaluacion emocional. " +
    "No hay respuestas buenas ni malas, solo tu experiencia real. " +
    "Si tienes alguna duda sobre alguna pregunta, con gusto te ayudo.",
  resultado:
    "Woof! Ya tienes tu resultado. ¿Tienes alguna duda sobre lo que significa tu nivel emocional " +
    "o quieres saber que puedes hacer a partir de aqui? Estoy para ayudarte.",
  avatar:
    "Woof! Hola, soy Taison. Estas eligiendo tu avatar para el entorno 3D de bienestar. " +
    "Cada personaje es unico pero todos te acompanan igual de bien. " +
    "¿Quieres que te cuente algo sobre cada uno para elegir mejor?",
  progreso:
  "Woof! Hola, soy Taison. Veo que estas revisando tu progreso en la plataforma. " +
  "Recuerda que avanzar tambien significa reconocer pequenos pasos y no solo resultados perfectos. " +
  "Si quieres, puedo ayudarte a interpretar como vas y darte algunas recomendaciones para seguir mejorando.",
  
};

const WELCOME_SIN_TEST =
  "Woof! Hola, soy Taison, tu companero de bienestar en la EISC. " +
  "Para acompanarte de la mejor forma, primero completa el cuestionario de autoevaluacion " +
  "emocional en el Dashboard. Cuando estes listo, vuelve y charlamos. Woof!";

const EMO_COLORS = {
  neutro:        "#00eaff",
  leve:          "#00ff88",
  estres:        "#ffcc00",
  ansiedad:      "#ff4466",
  questionnaire: "#a78bfa",
  resultado:     "#00eaff",
  avatar:        "#ff6b6b",
  progreso:      "#ffd500",
};

const PATRONES_PROHIBIDOS = [
  /\d+\s*[\+\-\*\/]\s*\d+/,
  /\b(suma|resta|multiplica|divide|integral|derivada|ecuacion|algebra|calculo)\b/i,
  /\b(codigo|programa|algoritmo|funcion|array|bucle|for|while|class|import|variable)\b/i,
  /\b(receta|ingredientes|cocinar|pelicula|serie|cancion|juego|videojuego)\b/i,
  /\b(politica|presidente|gobierno|noticias|economia|futbol|deporte)\b/i,
];

const esTemaFueraDeScope = (texto) =>
  PATRONES_PROHIBIDOS.some((patron) => patron.test(texto));

// -----------------------------------------------------------------------------
// QuestionMark — morado durante preguntas, cyan durante resultado
// -----------------------------------------------------------------------------
function QuestionMark({ visible, isResult, isAvatar , isProgress }) {
  const ref = useRef();

  useEffect(() => {
    if (!ref.current) return;
    if (visible) {
      gsap.killTweensOf(ref.current);
      gsap.fromTo(
        ref.current,
        { opacity: 0, scale: 0.4, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(2)" }
      );
      gsap.to(ref.current, {
        y: -6, duration: 0.9, repeat: -1, yoyo: true,
        ease: "sine.inOut", delay: 0.5,
      });
    } else {
      gsap.killTweensOf(ref.current);
      gsap.to(ref.current, {
        opacity: 0, scale: 0.4, y: 10, duration: 0.3, ease: "power2.in",
      });
    }
  }, [visible]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "-18px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "28px",
        height: "28px",
        borderRadius: "50%",
       background: isProgress
          ? "linear-gradient(135deg, #ffd500, #f59e0b)"
          : isAvatar
          ? "linear-gradient(135deg, #ff6b6b, #dc2626)"
          : isResult
          ? "linear-gradient(135deg, #00eaff, #0ea5e9)"
          : "linear-gradient(135deg, #a78bfa, #7c3aed)",
        boxShadow: isProgress
          ? "0 0 12px rgba(255,213,0,0.8), 0 2px 8px rgba(0,0,0,0.4)"
          : isAvatar
          ? "0 0 12px rgba(255,107,107,0.7), 0 2px 8px rgba(0,0,0,0.4)"
          : isResult
          ? "0 0 12px rgba(0,234,255,0.7), 0 2px 8px rgba(0,0,0,0.4)"
          : "0 0 12px rgba(167,139,250,0.7), 0 2px 8px rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "15px",
        fontWeight: "800",
        color: "#fff",
        opacity: 0,
        pointerEvents: "none",
        zIndex: 10,
        letterSpacing: "-1px",
        userSelect: "none",
        transition: "background 0.4s ease, box-shadow 0.4s ease",
      }}
    >
      ?
    </div>
  );
}

// -----------------------------------------------------------------------------
// TaisonModel
// -----------------------------------------------------------------------------
function TaisonModel({ isOpen, onToggle, isTypingRef }) {
  const { scene, animations } = useGLTF(TAISON_MODEL);
  const { actions } = useAnimations(animations, scene);
  const groupRef = useRef();
  const bounceAnimationRef = useRef(null);
  const originalYRef = useRef(-0.3);
  const isBouncingRef = useRef(false);
  const typingAnimationRef = useRef(null);

  const ANIMATIONS = { idle: "Idle", typing: "Typing", happy: "Happy", wave: "Wave" };

  const playAnimation = (animName, fadeIn = 0.3, autoStop = false) => {
    if (!actions || !animName) return;
    const anim = actions[animName];
    if (anim) {
      anim.reset().fadeIn(fadeIn).play();
      if (autoStop) setTimeout(() => { if (actions[animName]) actions[animName].fadeOut(0.5); }, autoStop);
    }
  };

  useEffect(() => {
    if (!groupRef.current) return;
    if (isTypingRef.current) {
      if (actions[ANIMATIONS.typing]) {
        playAnimation(ANIMATIONS.typing, 0.2);
      } else {
        if (typingAnimationRef.current) typingAnimationRef.current.kill();
        const originalRotZ = groupRef.current.rotation.z || 0;
        typingAnimationRef.current = gsap.to(groupRef.current.rotation, {
          z: originalRotZ + 0.15, duration: 0.15, repeat: -1, yoyo: true, ease: "power1.inOut",
          onRepeat: () => {
            if (groupRef.current && isTypingRef.current)
              groupRef.current.rotation.x = Math.sin(Date.now() * 0.03) * 0.05;
          },
        });
      }
    } else {
      if (typingAnimationRef.current) { typingAnimationRef.current.kill(); typingAnimationRef.current = null; }
      if (groupRef.current) gsap.to(groupRef.current.rotation, { z: 0, x: 0, duration: 0.3, ease: "power2.out" });
      if (actions[ANIMATIONS.idle]) playAnimation(ANIMATIONS.idle, 0.5);
    }
    return () => { if (typingAnimationRef.current) typingAnimationRef.current.kill(); };
  }, [isTypingRef.current, actions]);

  const playBounceAnimation = () => {
    if (!groupRef.current || isBouncingRef.current) return;
    isBouncingRef.current = true;
    if (bounceAnimationRef.current) bounceAnimationRef.current.kill();
    const originalY = originalYRef.current;
    bounceAnimationRef.current = gsap.timeline({
      onComplete: () => {
        if (groupRef.current) groupRef.current.position.y = originalY;
        isBouncingRef.current = false;
        bounceAnimationRef.current = null;
      },
    });
    bounceAnimationRef.current
      .to(groupRef.current.position, { y: originalY + 0.12, duration: 0.1, ease: "power2.out" })
      .to(groupRef.current.position, { y: originalY, duration: 0.15, ease: "bounce.out" });
    if (actions[ANIMATIONS.happy]) playAnimation(ANIMATIONS.happy, 0.15, 500);
    else if (actions[ANIMATIONS.wave]) playAnimation(ANIMATIONS.wave, 0.15, 600);
  };

  const handleClick = (e) => {
  e.stopPropagation();
  if (navigator.vibrate) navigator.vibrate(50);
  playBounceAnimation();
  onToggle();
  };

  useFrame((state) => {
    if (!groupRef.current) return;
    if (!isTypingRef.current && !isOpen && !isBouncingRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.position.y = originalYRef.current + Math.sin(t * 1.2) * 0.03;
      groupRef.current.rotation.y = Math.sin(t * 0.6) * 0.1;
    } else if (!isTypingRef.current && !isBouncingRef.current) {
      groupRef.current.position.y = originalYRef.current;
    }
  });

  const handlePointerOver = () => {
    if (!groupRef.current || isTypingRef.current || isBouncingRef.current) return;
    gsap.to(groupRef.current.scale, { x: 1.05, y: 1.05, z: 1.05, duration: 0.2, ease: "power2.out" });
  };
  const handlePointerOut = () => {
    if (!groupRef.current) return;
    gsap.to(groupRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.2, ease: "power2.out" });
  };

  return (
    <group ref={groupRef} position={[0, originalYRef.current, -3]}>
      <primitive object={scene} scale={150} onClick={handleClick}
        onPointerOver={handlePointerOver} onPointerOut={handlePointerOut} />
    </group>
  );
}

// -----------------------------------------------------------------------------
// ChatPanel
// -----------------------------------------------------------------------------
function ChatPanel({ emotion, onClose, panelRef, onTyping }) {
  const mensajeInicial = emotion ? (WELCOME_MESSAGES[emotion] || WELCOME_MESSAGES.neutro) : WELCOME_SIN_TEST;
  const [messages, setMessages] = useState([{ role: "assistant", text: mensajeInicial }]);
  const [history,  setHistory]  = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const bottomRef  = useRef();
  const sendBtnRef = useRef();
  const typingRef  = useRef();
  const dotsRef    = useRef([]);
  const typingTimeout = useRef();
  const emoColor   = EMO_COLORS[emotion] || "#00eaff";

  useEffect(() => { return () => { clearTimeout(typingTimeout.current); onTyping(false); }; }, []);

  useEffect(() => {
    if (!loading || !typingRef.current) return;
    gsap.to(typingRef.current, { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" });
    const tl = gsap.timeline({ repeat: -1 });
    dotsRef.current.forEach((dot, i) => {
      if (!dot) return;
      tl.to(dot, { y: -5, duration: 0.3, ease: "power1.inOut", yoyo: true, repeat: 1 }, i * 0.15);
    });
    return () => tl.kill();
  }, [loading]);

  useEffect(() => {
    const bubbles = document.querySelectorAll(".chatbot-bubble");
    if (!bubbles.length) return;
    gsap.to(bubbles[bubbles.length - 1], { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    onTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTyping(false), 800);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    clearTimeout(typingTimeout.current);
    onTyping(false);
    gsap.fromTo(sendBtnRef.current, { scale: 0.88 }, { scale: 1, duration: 0.3, ease: "elastic.out(1.2, 0.5)" });

    if (esTemaFueraDeScope(text)) {
      setMessages((m) => [...m, { role: "user", text },
        { role: "assistant", text: "Ese tema esta fuera de lo que puedo ayudarte. Solo puedo acompanarte en temas de bienestar emocional universitario. Cuentame, como te has sentido con la carga academica?" }]);
      setInput(""); return;
    }

    const newHistory = [...history, { role: "user", content: text }];
    setMessages((m) => [...m, { role: "user", text }]);
    setHistory(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("https://accesibilidadweb.onrender.com/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: SYSTEM_PROMPTS[emotion] || SYSTEM_PROMPTS.neutro, messages: newHistory }),
      });
      const data  = await res.json();
      const reply = data.content?.[0]?.text || "Lo siento, no pude responder ahora.";
      setHistory((h) => [...h, { role: "assistant", content: reply }]);
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "Estoy teniendo problemas de conexion. Asegurate de que el backend este corriendo." }]);
    }
    setLoading(false);
  };

  return (
    <div className="chatbot-panel" ref={panelRef}>
      <div className="chatbot-header" style={{ borderBottom: `1px solid ${emoColor}22` }}>
        <div className="chatbot-header-left">
          <div className="chatbot-online-dot" style={{ background: emoColor, boxShadow: `0 0 8px ${emoColor}` }} />
          <div>
            <div className="chatbot-title">Taison</div>
            <div className="chatbot-subtitle">Bienestar EISC — Univalle</div>
          </div>
        </div>
        <button className="chatbot-close" onClick={onClose}>✕</button>
      </div>

      <div className="chatbot-messages">
        {messages.map((m, i) => (
          <div key={i} className={`chatbot-msg-row ${m.role === "user" ? "user" : "bot"}`}>
            <div className={`chatbot-bubble ${m.role === "user" ? "user" : "bot"}`}>{m.text}</div>
          </div>
        ))}
        {loading && (
          <div className="chatbot-typing-row" ref={typingRef}>
            <div className="chatbot-typing-bubble">
              {[0, 1, 2].map((i) => (
                <div key={i} className="chatbot-typing-dot"
                  ref={(el) => (dotsRef.current[i] = el)} style={{ background: emoColor }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chatbot-input-row">
        <input className="chatbot-input" value={input} onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={emotion ? "Escribe tu mensaje..." : "Completa el cuestionario primero..."}
          disabled={loading || !emotion} />
        <button ref={sendBtnRef} className="chatbot-send" onClick={send}
          disabled={loading || !input.trim() || !emotion}
          style={{ background: `${emoColor}55` }}>
          &#62;
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// ChatBotUI — EXPORTACIÓN PRINCIPAL
// -----------------------------------------------------------------------------
export default function ChatBotUI() {
  const [isOpen,  setIsOpen]  = useState(false);
  const [emotion, setEmotion] = useState(null);
  const { user }   = useAuth();
  const location   = useLocation();
  const isTypingRef = useRef(false);
  const panelRef    = useRef();
  const tooltipRef  = useRef();
  const [progressContext, setProgressContext] = useState(null); //LEER EL CONTEXTO DE PROGRESO DESDE LOCALSTORAGE O FIREBASE SI ES NECESARIO

 // ── Detección de ruta ──────────────────────────────────────────────────────
const isInQuestionnaire =
  location.pathname.includes("questionnaire") ||
  location.pathname.includes("cuestionario");

const isInAvatar =
  location.pathname.includes("avatar") ||
  location.pathname.includes("personaje");

  const isInProgress =
  location.pathname.includes("progress") ||
  location.pathname.includes("progreso");

  // ── Detección de resultado via localStorage (sincronizado por Questionnaire.jsx) ──
  const [qDone, setQDone] = useState(localStorage.getItem("q_done") === "1");
  useEffect(() => {
    if (!isInQuestionnaire) { setQDone(false); return; }
    const interval = setInterval(() => {
      setQDone(localStorage.getItem("q_done") === "1");
    }, 300);
    return () => clearInterval(interval);
  }, [isInQuestionnaire]);

  // ── Emotion efectivo según contexto ───────────────────────────────────────
  const effectiveEmotion = isInQuestionnaire
  ? (qDone ? "resultado" : "questionnaire")
  : isInAvatar
  ? "avatar"
  : isInProgress
  ? "progreso"
  : emotion;

  // ── Cargar emotion del usuario ─────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const fetchEmotion = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) setEmotion(snap.data().lastEmotion || null);
      } catch {
        setEmotion(localStorage.getItem("emotion") || null);
      }
    };
    fetchEmotion();
  }, [user]);

  // ── Tooltip solo una vez por sesión, fuera del cuestionario ───────────────
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    const already = sessionStorage.getItem("taison_welcomed");
    if (!already) { setShowWelcome(true); sessionStorage.setItem("taison_welcomed", "1"); }
  }, []);
  
  // ── Cargar contexto de progreso ─────────────────────────────────────
useEffect(() => {
  const saved = localStorage.getItem("taison_progress_context");

  if (saved) {
    try {
      setProgressContext(JSON.parse(saved));
    } catch (e) {
      console.error("Error leyendo progreso IA", e);
    }
  }
}, []);

  useEffect(() => {
    if (!tooltipRef.current || isOpen) return;
    gsap.to(tooltipRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.3 });
  }, [isOpen]);

  useEffect(() => {
    if (!panelRef.current || !isOpen) return;
    gsap.fromTo(panelRef.current,
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out" }
    );
  }, [isOpen]);

  const handleClose = () => {
    if (!panelRef.current) { setIsOpen(false); return; }
    gsap.to(panelRef.current, {
      opacity: 0, y: 16, scale: 0.96, duration: 0.25, ease: "power2.in",
      onComplete: () => setIsOpen(false),
    });
  };
 
  // ── Prompt dinámico progreso ───────────────────────────────────────
const dynamicProgressPrompt =
  isInProgress && progressContext
    ? `
El usuario tiene ${progressContext.totalEvaluaciones} evaluaciones registradas.
Su puntaje promedio es ${progressContext.promedio}/21.
Su ultimo estado emocional fue ${progressContext.ultimoEstado}.
La distribucion emocional registrada es:
- Bienestar estable: ${progressContext.distribucion.neutro}
- Leve malestar: ${progressContext.distribucion.leve}
- Estres moderado: ${progressContext.distribucion.estres}
- Ansiedad elevada: ${progressContext.distribucion.ansiedad}

Analiza tendencias emocionales generales y responde de manera personalizada segun estos datos.
`
    : "";
    
  const handleTyping = (val) => { isTypingRef.current = val; };

  return (
    <div className="chatbot-wrapper">

      {/* Panel de chat */}
      {isOpen && (
        <ChatPanel
          emotion={effectiveEmotion}
          onClose={handleClose}
          panelRef={panelRef}
          onTyping={handleTyping}
        />
      )}

      {/* Tooltip solo fuera del cuestionario y avatar */}
      {!isOpen && showWelcome && !isInQuestionnaire && !isInAvatar && (
        <div ref={tooltipRef} className="chatbot-tooltip" onClick={() => setIsOpen(true)}>
          {effectiveEmotion ? "Woof! En que puedo ayudarte" : "Haz el cuestionario primero"}
        </div>
      )}

      {/* Canvas del perro */}
      <div className="chatbot-canvas" style={{ position: "relative" }}>
        {/* ? morado=preguntas | cyan=resultado | rojo=avatar */}
        <QuestionMark
        visible={(isInQuestionnaire || isInAvatar || isInProgress) && !isOpen}
        isResult={qDone}
        isAvatar={isInAvatar}
        isProgress={isInProgress}
        />
        <Canvas camera={{ position: [0, 0, 1.8], fov: 55 }} style={{ background: "transparent" }}>
          <ambientLight intensity={1.4} />
          <directionalLight position={[2, 4, 2]} intensity={1.8} />
          <pointLight position={[-2, 2, 2]} intensity={0.6} color="#7ecfff" />
          <Suspense fallback={null}>
            <TaisonModel
              isOpen={isOpen}
              isTypingRef={isTypingRef}
              onToggle={() => (isOpen ? handleClose() : setIsOpen(true))}
            />
          </Suspense>
        </Canvas>
      </div>

    </div>
  );
}