// =============================================================================
// src/components/ChatBotUI.jsx
// =============================================================================

import { useRef, useState, useEffect, useCallback, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useAuth } from "../providers/AuthProvider";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../services/firebase";
import { gsap } from "gsap";
import { useLocation } from "react-router-dom";
import {
  House, ClipboardList, Award, UserRound,
  Trees, Waves, Mountain, Stars, Activity
} from "lucide-react";
import "../styles/chatbot.css";

const PIXEL_MODEL = "/models/pixel.glb";
const BACKEND_URL = "https://accesibilidadweb.onrender.com";
const MAX_HISTORY = 6;

// =============================================================================
// CONSTANTES DE CONTEXTO
// =============================================================================

const DASHBOARD_CONTEXT = {
  name: "Panel Principal",
  description: "Vista general del bienestar emocional del estudiante.",
  symbolism: "Seguimiento, reflexión, progreso y autocuidado."
};

const SCENE_CONTEXT = {
  neutro: {
    name: "Bosque de la Calma",
    description: "Representa tranquilidad, estabilidad emocional y equilibrio interior.",
    symbolism: "Naturaleza, reflexión, serenidad y bienestar."
  },
  leve: {
    name: "Playa de la Serenidad",
    description: "Representa descanso emocional, relajación y autocuidado.",
    symbolism: "Olas, respiración consciente, pausas saludables y recuperación."
  },
  estres: {
    name: "Valle Escondido",
    description: "Representa resiliencia, organización y manejo de desafíos académicos.",
    symbolism: "Superación, estructura, equilibrio y crecimiento."
  },
  ansiedad: {
    name: "Isla de las Estrellas",
    description: "Representa seguridad emocional, esperanza y calma interior.",
    symbolism: "Luz, orientación, contención emocional y recuperación."
  }
};

const AVATAR_INFO = {
  "male-1":   { name: "Alejandro", description: "Estudiante activo y curioso." },
  "female-1": { name: "Valentina", description: "Creativa, empática y decidida." },
  "male-2":   { name: "Sebastián", description: "Apasionado por la tecnología." },
  "female-2": { name: "Khaterin",  description: "Reflexiva y lista para aprender." },
  "male-3":   { name: "Mateo",     description: "Deportista y muy sociable." },
  "female-3": { name: "Isabela",   description: "Artista y llena de ideas." },
  "nb-1":     { name: "Cami",      description: "Libre, auténtico y curioso." }
};

const ACHIEVEMENT_INFO = {
  maestro_de_la_serenidad: "Ha demostrado constancia y compromiso con su bienestar emocional.",
  guardian_del_oasis:      "Ha participado activamente en actividades de autocuidado.",
  explorador_del_bosque:   "Ha dedicado tiempo a la reflexión personal.",
  estrella_brilante:       "Ha mostrado resiliencia ante momentos difíciles.",
  constructor_del_valle:   "Ha avanzado en la organización de su bienestar académico."
};

const ROOM_NAMES = {
  bosque: "Bosque de la Calma",
  playa:  "Playa de la Serenidad",
  valle:  "Valle Escondido",
  isla:   "Isla de las Estrellas"
};

// =============================================================================
// FUNCIONES DE CONTEXTO
// =============================================================================

const extractUserContext = (data) => {
  if (!data) return null;
  return {
    lastEmotion:       data.lastEmotion       || null,
    progress:          data.nivel_progreso    || data.lastEmotion || null,
    avatar:            data.avatar            || null,
    completedRooms:    data.completedRooms    || [],
    achievements:      data.achievements      || [],
    assessmentCount:   data.assessmentCount   || 0,
    profileCompleted:  data.profileCompleted  || false,
    lastAssessmentDate: data.lastAssessmentDate?.toDate?.() || data.lastAssessmentDate || null,
    totalSessions:     data.totalSessions     || 0,
    currentStreak:     data.currentStreak     || 0,
    bestStreak:        data.bestStreak        || 0,
    preferences:       data.preferences      || null,
    favoriteActivities: data.favoriteActivities || [],
    weeklyGoal:        data.weeklyGoal        || null,
    weeklyProgress:    data.weeklyProgress    || 0,
    learnedTechniques: data.learnedTechniques || [],
    emotionHistory:    data.emotionHistory    || [],
  };
};

const generateContextSummary = (context) => {
  if (!context) return "Sin información de contexto disponible.";
  const parts = [];
  if (context.avatar && AVATAR_INFO[context.avatar]) {
    const av = AVATAR_INFO[context.avatar];
    parts.push(`El estudiante ha seleccionado a ${av.name}, un avatar que ${av.description.toLowerCase()}`);
  }
  if (context.completedRooms?.length > 0) {
    const names = context.completedRooms.map(r => ROOM_NAMES[r] || r).join(", ");
    parts.push(`Ha explorado las siguientes salas: ${names}`);
  } else {
    parts.push("Aún no ha explorado ninguna sala de bienestar.");
  }
  if (context.achievements?.length > 0) {
    const descs = context.achievements.map(a => ACHIEVEMENT_INFO[a] || a).join(". ");
    parts.push(`Logros obtenidos: ${descs}`);
  }
  if (context.currentStreak > 0) {
    parts.push(`Lleva una racha de ${context.currentStreak} ${context.currentStreak === 1 ? "día" : "días"} usando la plataforma.`);
  }
  return parts.join("\n");
};

// =============================================================================
// BUILD PROMPT DINÁMICO
// =============================================================================

const BASE_PROMPT =
  "Eres Pixel, asistente de bienestar emocional para estudiantes de la EISC-Universidad del Valle. " +
  "Solo respondes sobre: bienestar emocional, estrés académico, ansiedad, técnicas de relajación, autocuidado. " +
  "Si preguntan sobre otros temas, responde amablemente que no puedes ayudar y redirige al bienestar. " +
  "Personalidad: cálido, empático, optimista. Lenguaje informal pero respetuoso.";

const buildDynamicPrompt = (emotion, userContext, routeKey) => {
  let scene;
  if (routeKey === "dashboard") {
    scene = DASHBOARD_CONTEXT;
  } else if (routeKey === "questionnaire" || routeKey === "resultado") {
    scene = { name: "Cuestionario de Bienestar", description: "Autoevaluación emocional", symbolism: "Reflexión y autoconocimiento" };
  } else if (routeKey === "avatar") {
    scene = { name: "Selección de Avatar", description: "Personalización del acompañante", symbolism: "Identidad y conexión" };
  } else if (routeKey === "progreso") {
    scene = { name: "Panel de Progreso", description: "Seguimiento de logros", symbolism: "Crecimiento y constancia" };
  } else {
    scene = SCENE_CONTEXT[emotion] || SCENE_CONTEXT.neutro;
  }

  const contextSummary  = generateContextSummary(userContext);
  const avatar          = userContext?.avatar ? AVATAR_INFO[userContext.avatar] : null;
  const completedRooms  = userContext?.completedRooms?.length
    ? userContext.completedRooms.map(r => ROOM_NAMES[r] || r).join(", ")
    : "Ninguna sala explorada aún";

  return BASE_PROMPT + `
    
    📍 UBICACIÓN ACTUAL: ${scene.name}
    ${routeKey === "dashboard" ? "⚠️ IMPORTANTE: El usuario está en el DASHBOARD, NO dentro de ninguna sala emocional." : ""}
    
    🏆 PROGRESO:
    Salas exploradas: ${completedRooms}
    ${avatar ? `Avatar: ${avatar.name}` : ""}
    
    📊 CONTEXTO: ${contextSummary || "Sin datos adicionales"}
    
    === INSTRUCCIONES ===
    ${routeKey === "dashboard" ? `
    - El usuario está en su Panel Principal
    - NO menciones Bosque, Playa, Valle o Isla a menos que el usuario los nombre
    - Enfócate en: progreso, estadísticas, cuestionarios, logros y metas
    ` : `
    - Usa el escenario actual como metáfora emocional
    - Reconoce los logros y salas completadas
    `}
    - Mantén un tono cálido y empático
    - NUNCA inventes información inexistente
  `;
};

// =============================================================================
// MENSAJES DE BIENVENIDA
// =============================================================================

const WELCOME_MESSAGES = {
  dashboard:     "🐾 Woof! Estás en tu panel principal de bienestar. ¿En qué puedo ayudarte hoy?",
  neutro:        "🐾 Woof! Bienvenido al Bosque de la Calma. ¿Cómo te has sentido últimamente?",
  leve:          "🐾 Woof! Bienvenido a la Playa de la Serenidad. ¿Qué ha estado ocupando tu mente?",
  estres:        "🐾 Woof! Bienvenido al Valle Escondido. Estoy aquí para ayudarte a encontrar claridad.",
  ansiedad:      "🐾 Woof... Bienvenido a la Isla de las Estrellas. Podemos recuperar la calma juntos.",
  questionnaire: "🐾 Woof! Estás completando tu autoevaluación emocional. Estoy aquí para acompañarte.",
  resultado:     "🐾 Woof! Ya tienes tus resultados. ¿Quieres que te ayude a entenderlos mejor?",
  avatar:        "🐾 Woof! Estás eligiendo tu avatar. ¿Quieres saber más sobre alguno?",
  progreso:      "🐾 Woof! Veamos tu progreso. ¡Sigue así!"
};

const WELCOME_SIN_TEST = "🐾 Woof! Completa el cuestionario en el Dashboard primero.";

// =============================================================================
// BUBBLE CONFIG
// =============================================================================

const BUBBLE_CONFIG = {
  dashboard: {
    color: "#3b82f6", shadow: "rgba(59,130,246,0.75)",
    gradient: "radial-gradient(circle at 35% 35%, #60a5fa, #2563eb)",
    inset: "0 2px 0 0 rgba(255,255,255,0.45) inset, 0 -2px 0 0 rgba(0,0,0,0.25) inset",
    orbColor: "#60a5fa",
    icon: <House size={14} stroke="rgba(255,255,255,0.95)" strokeWidth={2.2} />,
  },
  neutro: {
    color: "#22c55e", shadow: "rgba(34,197,94,0.75)",
    gradient: "radial-gradient(circle at 35% 35%, #4ade80, #16a34a)",
    inset: "0 2px 0 0 rgba(255,255,255,0.45) inset, 0 -2px 0 0 rgba(0,0,0,0.25) inset",
    orbColor: "#4ade80",
    icon: <Trees size={14} stroke="rgba(255,255,255,0.95)" strokeWidth={2.2} />,
  },
  leve: {
    color: "#38bdf8", shadow: "rgba(56,189,248,0.75)",
    gradient: "radial-gradient(circle at 35% 35%, #7dd3fc, #0284c7)",
    inset: "0 2px 0 0 rgba(255,255,255,0.45) inset, 0 -2px 0 0 rgba(0,0,0,0.25) inset",
    orbColor: "#7dd3fc",
    icon: <Waves size={14} stroke="rgba(255,255,255,0.95)" strokeWidth={2.2} />,
  },
  estres: {
    color: "#f59e0b", shadow: "rgba(245,158,11,0.75)",
    gradient: "radial-gradient(circle at 35% 35%, #fbbf24, #d97706)",
    inset: "0 2px 0 0 rgba(255,255,255,0.45) inset, 0 -2px 0 0 rgba(0,0,0,0.25) inset",
    orbColor: "#fbbf24",
    icon: <Mountain size={14} stroke="rgba(255,255,255,0.95)" strokeWidth={2.2} />,
  },
  ansiedad: {
    color: "#a855f7", shadow: "rgba(168,85,247,0.75)",
    gradient: "radial-gradient(circle at 35% 35%, #c084fc, #9333ea)",
    inset: "0 2px 0 0 rgba(255,255,255,0.45) inset, 0 -2px 0 0 rgba(0,0,0,0.25) inset",
    orbColor: "#c084fc",
    icon: <Stars size={14} stroke="rgba(255,255,255,0.95)" strokeWidth={2.2} />,
  },
  questionnaire: {
    color: "#a78bfa", shadow: "rgba(167,139,250,0.75)",
    gradient: "radial-gradient(circle at 35% 35%, #c4b0ff, #7c5ce8)",
    inset: "0 2px 0 0 rgba(255,255,255,0.45) inset, 0 -2px 0 0 rgba(0,0,0,0.25) inset",
    orbColor: "#c4b0ff",
    icon: <ClipboardList size={14} stroke="rgba(255,255,255,0.95)" strokeWidth={2.2} />,
  },
  resultado: {
    color: "#00eaff", shadow: "rgba(0,234,255,0.75)",
    gradient: "radial-gradient(circle at 35% 35%, #40f4ff, #00b8cc)",
    inset: "0 2px 0 0 rgba(255,255,255,0.45) inset, 0 -2px 0 0 rgba(0,0,0,0.25) inset",
    orbColor: "#40f4ff",
    icon: <Award size={14} stroke="rgba(255,255,255,0.95)" strokeWidth={2.2} />,
  },
  avatar: {
    color: "#ff6b6b", shadow: "rgba(255,107,107,0.75)",
    gradient: "radial-gradient(circle at 35% 35%, #ff9999, #e03a3a)",
    inset: "0 2px 0 0 rgba(255,255,255,0.45) inset, 0 -2px 0 0 rgba(0,0,0,0.25) inset",
    orbColor: "#ff9999",
    icon: <UserRound size={14} stroke="rgba(255,255,255,0.95)" strokeWidth={2.2} />,
  },
  progreso: {
    color: "#ffd500", shadow: "rgba(255,213,0,0.75)",
    gradient: "radial-gradient(circle at 35% 35%, #ffe566, #c9a800)",
    inset: "0 2px 0 0 rgba(255,255,255,0.45) inset, 0 -2px 0 0 rgba(0,0,0,0.25) inset",
    orbColor: "#ffe566",
    icon: <Activity size={14} stroke="rgba(255,255,255,0.95)" strokeWidth={2.2} />,
  },
};

// =============================================================================
// CONTEXT BUBBLE COMPONENT
// =============================================================================

const BUBBLE_STYLES = `
  @keyframes pb-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes pb-ring  { 0%{transform:scale(.85);opacity:0} 55%{opacity:.55} 100%{transform:scale(1.6);opacity:0} }
  @keyframes pb-fadeOut { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(.6)} }
  @keyframes pb-fadeIn  { from{opacity:0;transform:scale(.6)} to{opacity:1;transform:scale(1)} }

  .pb-float { animation: pb-float 2.4s ease-in-out infinite; }
  .pb-ring  { position:absolute; inset:-5px; border-radius:50%;
              border:1.5px solid currentColor; opacity:0;
              animation: pb-ring 2.6s ease-out infinite; pointer-events:none; }
  .pb-icon  { position:relative; z-index:2; display:flex; align-items:center; justify-content:center; }
  .pb-icon.fade-out { animation: pb-fadeOut .2s ease-in forwards; }
  .pb-icon.fade-in  { animation: pb-fadeIn  .2s ease-out forwards; }
`;

function ContextBubble({ visible, contextKey }) {
  const cfg      = BUBBLE_CONFIG[contextKey] || BUBBLE_CONFIG.dashboard;
  const wrapRef  = useRef();
  const ringRef  = useRef();
  const iconRef  = useRef();
  const bubbleRef = useRef();

  useEffect(() => {
    if (!bubbleRef.current) return;
    bubbleRef.current.style.background  = cfg.gradient;
    bubbleRef.current.style.boxShadow   = `${cfg.inset}, 0 5px 16px ${cfg.shadow}, 0 2px 4px rgba(0,0,0,0.35)`;
    if (ringRef.current) ringRef.current.style.color = cfg.color;
  }, [cfg]);

  useEffect(() => {
    if (!wrapRef.current) return;
    if (visible) {
      gsap.killTweensOf(wrapRef.current);
      gsap.fromTo(wrapRef.current,
        { opacity: 0, scale: 0.4, y: 10 },
        { opacity: 1, scale: 1,   y: 0, duration: 0.5, ease: "back.out(2)" }
      );
    } else {
      gsap.killTweensOf(wrapRef.current);
      gsap.to(wrapRef.current, { opacity: 0, scale: 0.4, y: 10, duration: 0.3, ease: "power2.in" });
    }
  }, [visible]);

  const prevContextRef = useRef(contextKey);
  useEffect(() => {
    if (prevContextRef.current === contextKey) return;
    prevContextRef.current = contextKey;
    if (!iconRef.current) return;
    iconRef.current.classList.remove("fade-in");
    iconRef.current.classList.add("fade-out");
    setTimeout(() => {
      if (!iconRef.current) return;
      iconRef.current.classList.remove("fade-out");
      iconRef.current.classList.add("fade-in");
      setTimeout(() => iconRef.current?.classList.remove("fade-in"), 200);
    }, 200);
  }, [contextKey]);

  return (
    <>
      <style>{BUBBLE_STYLES}</style>
      <div ref={wrapRef} style={{
        position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)",
        opacity: 0, pointerEvents: "none", zIndex: 10, userSelect: "none",
      }}>
        <div className="pb-float">
          <div ref={bubbleRef} style={{
            position: "relative",
            width: "28px", height: "28px", borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.5s ease, box-shadow 0.5s ease",
          }}>
            <div ref={ringRef} className="pb-ring" />
            <div ref={iconRef} className="pb-icon">{cfg.icon}</div>
          </div>
        </div>
      </div>
    </>
  );
}

// =============================================================================
// PIXEL 3D MODEL
// =============================================================================

function PixelModel({ isOpen, onToggle, isTypingRef }) {
  const { scene, animations } = useGLTF(PIXEL_MODEL);
  const { actions }           = useAnimations(animations, scene);
  const groupRef      = useRef();
  const bounceAnimRef = useRef(null);
  const originalYRef  = useRef(-0.3);
  const isBouncingRef = useRef(false);
  const typingAnimRef = useRef(null);
  const ANIMS = { idle: "Idle", typing: "Typing", happy: "Happy", wave: "Wave" };

  const playAnim = (name, fadeIn = 0.3, autoStop = false) => {
    if (!actions?.[name]) return;
    actions[name].reset().fadeIn(fadeIn).play();
    if (autoStop) setTimeout(() => actions[name]?.fadeOut(0.5), autoStop);
  };

  useEffect(() => {
    if (!groupRef.current) return;
    if (isTypingRef.current) {
      if (actions[ANIMS.typing]) {
        playAnim(ANIMS.typing, 0.2);
      } else {
        typingAnimRef.current?.kill();
        const origZ = groupRef.current.rotation.z || 0;
        typingAnimRef.current = gsap.to(groupRef.current.rotation, {
          z: origZ + 0.15, duration: 0.15, repeat: -1, yoyo: true, ease: "power1.inOut",
          onRepeat: () => {
            if (groupRef.current && isTypingRef.current)
              groupRef.current.rotation.x = Math.sin(Date.now() * 0.03) * 0.05;
          },
        });
      }
    } else {
      typingAnimRef.current?.kill();
      typingAnimRef.current = null;
      if (groupRef.current) gsap.to(groupRef.current.rotation, { z: 0, x: 0, duration: 0.3, ease: "power2.out" });
      if (actions[ANIMS.idle]) playAnim(ANIMS.idle, 0.5);
    }
    return () => typingAnimRef.current?.kill();
  }, [isTypingRef.current, actions]);

  const playBounce = () => {
    if (!groupRef.current || isBouncingRef.current) return;
    isBouncingRef.current = true;
    bounceAnimRef.current?.kill();
    const origY = originalYRef.current;
    bounceAnimRef.current = gsap.timeline({
      onComplete: () => {
        if (groupRef.current) groupRef.current.position.y = origY;
        isBouncingRef.current  = false;
        bounceAnimRef.current  = null;
      },
    });
    bounceAnimRef.current
      .to(groupRef.current.position, { y: origY + 0.12, duration: 0.1, ease: "power2.out" })
      .to(groupRef.current.position, { y: origY,        duration: 0.15, ease: "bounce.out" });
    if (actions[ANIMS.happy])  playAnim(ANIMS.happy, 0.15, 500);
    else if (actions[ANIMS.wave]) playAnim(ANIMS.wave, 0.15, 600);
  };

  const handleClick = (e) => {
    e.stopPropagation();
    navigator.vibrate?.(50);
    playBounce();
    onToggle();
  };

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    if (!isTypingRef.current && !isOpen && !isBouncingRef.current) {
      const t = clock.getElapsedTime();
      groupRef.current.position.y = originalYRef.current + Math.sin(t * 1.2) * 0.03;
      groupRef.current.rotation.y = Math.sin(t * 0.6) * 0.1;
    } else if (!isTypingRef.current && !isBouncingRef.current) {
      groupRef.current.position.y = originalYRef.current;
    }
  });

  return (
    <group ref={groupRef} position={[0, originalYRef.current, -3]}>
      <primitive
        object={scene}
        scale={150}
        onClick={handleClick}
        onPointerOver={() => {
          if (!groupRef.current || isTypingRef.current || isBouncingRef.current) return;
          gsap.to(groupRef.current.scale, { x: 1.05, y: 1.05, z: 1.05, duration: 0.2, ease: "power2.out" });
        }}
        onPointerOut={() => {
          if (!groupRef.current) return;
          gsap.to(groupRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.2, ease: "power2.out" });
        }}
      />
    </group>
  );
}

// =============================================================================
// CHAT PANEL COMPONENT
// =============================================================================

function ChatPanel({ emotion, userContext, onClose, panelRef, onTyping, routeKey }) {
  const mensajeInicial = WELCOME_MESSAGES[routeKey] || WELCOME_MESSAGES[emotion] || WELCOME_SIN_TEST;

  const [messages, setMessages] = useState([{ role: "assistant", text: mensajeInicial }]);
  const [history,  setHistory]  = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const bottomRef  = useRef();
  const typingRef  = useRef();
  const dotsRef    = useRef([]);
  const typingTimeout = useRef();
  const emoColor   = BUBBLE_CONFIG[routeKey]?.color || BUBBLE_CONFIG.dashboard.color;

  useEffect(() => {
    return () => { clearTimeout(typingTimeout.current); onTyping(false); };
  }, [onTyping]);

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

  // FIX: .chatbot-bubble nace con opacity:0 en el CSS. Sin animarla a 1,
  // los mensajes (incluido el de bienvenida) quedan invisibles/transparentes.
  useEffect(() => {
    const bubbles = document.querySelectorAll(".chatbot-bubble");
    if (bubbles.length) {
      gsap.to(bubbles[bubbles.length - 1], { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    onTyping(true);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => onTyping(false), 800);
  };

  const PATRONES_PROHIBIDOS = [
    /\d+\s*[\+\-\*\/]\s*\d+/,
    /\b(suma|resta|multiplica|divide|integral|derivada|ecuacion|algebra|calculo)\b/i,
    /\b(codigo|programa|algoritmo|funcion|array|bucle|for|while|class|import|variable)\b/i,
  ];

  const esTemaFueraDeScope = (texto) => PATRONES_PROHIBIDOS.some((p) => p.test(texto));

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    clearTimeout(typingTimeout.current);
    onTyping(false);

    if (esTemaFueraDeScope(text)) {
      setMessages((m) => [...m,
        { role: "user", text },
        { role: "assistant", text: "🐾 Ese tema está fuera de lo que puedo ayudarte. Solo puedo acompañarte en bienestar emocional universitario." },
      ]);
      setInput("");
      return;
    }

    const newHistory = [...history, { role: "user", content: text }].slice(-MAX_HISTORY);
    setMessages((m) => [...m, { role: "user", text }]);
    setHistory(newHistory);
    setInput("");
    setLoading(true);

    try {
      const systemPrompt = buildDynamicPrompt(emotion, userContext, routeKey);
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system: systemPrompt, messages: newHistory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
      const reply = data.content?.[0]?.text || "Lo siento, no pude responder ahora.";
      setHistory((h) => [...h, { role: "assistant", content: reply }].slice(-MAX_HISTORY));
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (err) {
      console.error("[ChatPanel]", err.message);
      setMessages((m) => [...m, { role: "assistant", text: "🐾 Tuve un problema de conexión. ¿Puedes intentarlo de nuevo?" }]);
    }
    setLoading(false);
  };

  return (
    <div className="chatbot-panel" ref={panelRef}>
      <div className="chatbot-header" style={{ borderBottom: `1px solid ${emoColor}22` }}>
        <div className="chatbot-header-left">
          <div className="chatbot-online-dot" style={{ background: emoColor, boxShadow: `0 0 8px ${emoColor}` }} />
          <div>
            <div className="chatbot-title">🐾 Pixel</div>
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
          <div className="chatbot-typing-row" ref={typingRef} style={{ opacity: 0 }}>
            <div className="chatbot-typing-bubble">
              {[0, 1, 2].map((i) => (
                <div key={i} className="chatbot-typing-dot"
                  ref={(el) => (dotsRef.current[i] = el)}
                  style={{ background: emoColor }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="chatbot-input-row">
        <input
          className="chatbot-input"
          value={input}
          onChange={handleInputChange}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={emotion ? "Escribe tu mensaje..." : "Completa el cuestionario primero..."}
          disabled={loading || !emotion}
          maxLength={500}
        />
        <button
          className="chatbot-send"
          onClick={send}
          disabled={loading || !input.trim() || !emotion}
          style={{ background: `${emoColor}55` }}
        >
          &#62;
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN CHATBOT UI COMPONENT
// =============================================================================

export default function ChatBotUI() {
  const [isOpen,      setIsOpen]      = useState(false);
  const [emotion,     setEmotion]     = useState(null);
  const [userContext, setUserContext] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [canvasKey,   setCanvasKey]   = useState(0);

  const { user }   = useAuth();
  const location   = useLocation();
  const isTypingRef = useRef(false);
  const panelRef    = useRef();
  const tooltipRef  = useRef();
  const isClosingRef = useRef(false); // ← previene doble-cierre

  // ── DETECCIÓN DE RUTA ──────────────────────────────────────────────────────
  // getRouteKey es una función pura que recibe pathname y emotion
  // explícitamente. No usa useCallback con dependencias que cambian durante
  // el cierre del panel — evita stale closures.
  const getRouteKey = (pathname, currentEmotion) => {
    if (!pathname || pathname === "/" || pathname === "/home" || pathname === "/home/") {
      return "dashboard";
    }
    if (pathname.includes("/home/scene")) return currentEmotion || "neutro";
    if (pathname.includes("questionnaire") || pathname.includes("cuestionario")) return "questionnaire";
    if (pathname.includes("resultado"))    return "resultado";
    if (pathname.includes("avatar")    || pathname.includes("personaje")) return "avatar";
    if (pathname.includes("progress")  || pathname.includes("progreso"))  return "progreso";
    return "dashboard";
  };

  const effectiveContext = getRouteKey(location.pathname, emotion);

  // ── CIERRE DE RUTA: cerrar panel al navegar ────────────────────────────────
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      // Cierre directo sin animación al navegar — evita que panelRef sea null
      setIsOpen(false);
      isClosingRef.current = false;
    }
  }, [location.pathname]);

  // ── FIRESTORE ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) { setIsDataLoaded(true); return; }

    const unsub = onSnapshot(
      doc(db, "users", user.uid),
      (snap) => {
        if (!snap.exists()) {
          setEmotion(null);
          setUserContext(null);
          setIsDataLoaded(true);
          return;
        }
        const data = snap.data();
        setEmotion(data.lastEmotion || null);
        setUserContext(extractUserContext(data));
        setIsDataLoaded(true);
      },
      (err) => {
        console.error("[Pixel] Error Firestore:", err);
        setIsDataLoaded(true);
      }
    );

    return () => unsub();
  }, [user]);

  // ── CONTEXT LOSS ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handleContextLoss = () => setCanvasKey((k) => k + 1);
    window.addEventListener("webglcontextlost", handleContextLoss);
    return () => window.removeEventListener("webglcontextlost", handleContextLoss);
  }, []);

  // ── TOOLTIP DE BIENVENIDA ─────────────────────────────────────────────────
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    if (!sessionStorage.getItem("pixel_welcomed") && isDataLoaded) {
      setShowWelcome(true);
      sessionStorage.setItem("pixel_welcomed", "1");
    }
  }, [isDataLoaded]);

  useEffect(() => {
    if (!tooltipRef.current || isOpen) return;
    gsap.to(tooltipRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.3 });
  }, [isOpen, showWelcome]);

  // ── ABRIR ─────────────────────────────────────────────────────────────────
  const openPanel = useCallback(() => {
    isClosingRef.current = false;
    setIsOpen(true);
  }, []);

  // ── CERRAR — CORRECCIÓN DEL DEADLOCK ─────────────────────────────────────
  // ANTES: gsap.to(panelRef.current, { onComplete: setIsOpen(false) })
  //   → Si panelRef.current es null, onComplete nunca se llama → isOpen queda
  //     en true para siempre → el panel nunca vuelve a abrir (deadlock).
  //
  // AHORA: isClosingRef previene doble-llamada. Si panelRef.current existe,
  //   animamos y cerramos en onComplete. Si es null (panel ya desmontado),
  //   cerramos directamente sin gsap.
  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    if (panelRef.current) {
      gsap.to(panelRef.current, {
        opacity: 0, y: 16, scale: 0.96, duration: 0.25, ease: "power2.in",
        onComplete: () => {
          setIsOpen(false);
          isClosingRef.current = false;
        },
      });
    } else {
      // Fallback seguro: panelRef no disponible, cerrar sin animación
      setIsOpen(false);
      isClosingRef.current = false;
    }
  }, []);

  // ── ABRIR: ANIMACIÓN DE ENTRADA ───────────────────────────────────────────
  // FIX: .chatbot-panel nace con opacity:0 en el CSS (chatbot.css). Sin este
  // efecto, el panel se monta cuando isOpen=true pero queda invisible para
  // siempre (opacity:0 heredado del CSS nunca se anima a 1) y por eso
  // "no abre" aunque isOpen sí cambie a true.
  // Este efecto se dispara cuando isOpen pasa a true y panelRef ya está
  // montado, y anima el panel a su estado visible (igual que en la versión
  // anterior que sí abría correctamente).
  useEffect(() => {
    if (!panelRef.current || !isOpen) return;
    gsap.fromTo(panelRef.current,
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out" }
    );
  }, [isOpen]);

  // ── TOGGLE ────────────────────────────────────────────────────────────────
  const handleToggle = useCallback(() => {
    if (isOpen) handleClose();
    else openPanel();
  }, [isOpen, handleClose, openPanel]);

  const handleTyping = useCallback((val) => { isTypingRef.current = val; }, []);

  // bubbleVisible no depende de isDataLoaded para no bloquear el click
  // cuando Firestore tarda en responder
  const bubbleVisible = !isOpen;

  return (
    <div className="chatbot-wrapper">
      {/* CORRECCIÓN: key eliminado de ChatPanel */}
      {/* Antes: key={effectiveContext} destruía el panel en cada cambio de ruta */}
      {/* Ahora: el panel persiste mientras isOpen=true, sin remounts innecesarios */}
      {isOpen && isDataLoaded && (
        <ChatPanel
          emotion={emotion}
          userContext={userContext}
          routeKey={effectiveContext}
          onClose={handleClose}
          panelRef={panelRef}
          onTyping={handleTyping}
        />
      )}

      {!isOpen && showWelcome && !emotion && (
  <div
    ref={tooltipRef}
    className="chatbot-tooltip"
    style={{ opacity: 0 }}
    onClick={openPanel}
  >
    📋 Completa el cuestionario primero
  </div>
)}

      <div className="chatbot-canvas" style={{ position: "relative" }}>
        <ContextBubble visible={bubbleVisible} contextKey={effectiveContext} />
        <Canvas
          key={canvasKey}
          camera={{ position: [0, 0, 1.8], fov: 55 }}
          style={{ background: "transparent" }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        >
          <ambientLight intensity={1.4} />
          <directionalLight position={[2, 4, 2]} intensity={1.8} />
          <pointLight position={[-2, 2, 2]} intensity={0.6} color="#7ecfff" />
          <Suspense fallback={null}>
            <PixelModel isOpen={isOpen} isTypingRef={isTypingRef} onToggle={handleToggle} />
          </Suspense>
        </Canvas>
      </div>
    </div>
  );
}