// =============================================================================
// src/components/ChatBotUI.jsx
// =============================================================================

import { useRef, useState, useEffect, useCallback, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useAuth } from "../providers/AuthProvider";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { gsap } from "gsap";
import { useLocation } from "react-router-dom";
import "../styles/chatbot.css";

const PIXEL_MODEL = "/models/pixel.glb";
const BACKEND_URL = "https://accesibilidadweb.onrender.com";
const MAX_HISTORY = 20;

const BASE_PROMPT =
  "Eres Pixel, un asistente virtual de bienestar emocional creado exclusivamente " +
  "para los estudiantes de la Escuela de Ingenieria de Sistemas y Computacion (EISC) " +
  "de la Universidad del Valle, en Santiago de Cali, Colombia. " +
  "PROPOSITO: Brindar acompanamiento emocional, orientacion en autocuidado y recursos " +
  "de manejo del estres academico. Solo puedes abordar temas de bienestar emocional, " +
  "estres academico, ansiedad universitaria, tecnicas de relajacion, habitos de autocuidado, " +
  "vida universitaria en la EISC o la UV, y recursos institucionales. " +
  "RESTRICCION ABSOLUTA: Si el usuario pregunta algo ajeno al bienestar emocional " +
  "universitario, responde amablemente que esta fuera de tu alcance y redirige. " +
  "Nunca respondas preguntas tecnicas ni generales aunque insistan. " +
  "Si el usuario hace preguntas sobre el cuestionario, sus emociones o el significado de las respuestas, si puedes responderlas. " +
  "PERSONALIDAD: Calido, cercano, empatico y optimista. Lenguaje informal pero respetuoso. " +
  "Nunca condescendiente ni minimizas emociones. " +
  "CONTEXTO DEL CUESTIONARIO: El estudiante esta realizando un breve cuestionario de bienestar emocional universitario. " +
  "Si el estudiante pregunta que significa una pregunta, explica de manera sencilla y tranquilizadora. " +
  "No interpretes automaticamente que el usuario tiene un trastorno psicologico. " +
  "Habla siempre en terminos de emociones, estres o bienestar emocional. " +
  "Si el usuario expresa angustia intensa o ideas de dano personal, recomienda buscar apoyo profesional.";

const SYSTEM_PROMPTS = {
  neutro:
    BASE_PROMPT +
    " NIVEL: BIENESTAR ESTABLE (0-4). Refuerza positivamente, ofrece estrategias preventivas y habitos protectores.",
  leve:
    BASE_PROMPT +
    " NIVEL: LEVE MALESTAR (5-9). Valida sin minimizar. Ofrece una o dos tecnicas aplicables hoy.",
  estres:
    BASE_PROMPT +
    " NIVEL: ESTRES MODERADO (10-14). Ayuda a priorizar con Pomodoro o Eisenhower. Ofrece respiracion 4-7-8.",
  ansiedad:
    BASE_PROMPT +
    " NIVEL: ANSIEDAD ELEVADA (15-21). ESTRATEGIA OBLIGATORIA: primero calma, luego orienta. " +
    "Comienza con respiracion o grounding. NUNCA minimices. NUNCA listes consejos en crisis.",
  questionnaire:
    BASE_PROMPT +
    " CONTEXTO: El usuario esta completando el cuestionario. Explica preguntas con calma y empatia.",
  resultado:
    BASE_PROMPT +
    " CONTEXTO: El usuario acaba de ver su resultado. Explica con empatia, ofrece estrategias concretas.",
  avatar:
    BASE_PROMPT +
    " CONTEXTO: El usuario elige su avatar. Alejandro: activo. Valentina: empatica. Sebastian: tech. Katerin: reflexiva.",
  progreso:
    BASE_PROMPT +
    " CONTEXTO: El usuario revisa su progreso emocional. Analiza tendencias, refuerza avances.",
};

const WELCOME_MESSAGES = {
  neutro:        "Woof! Hola, soy Pixel. Tu estado emocional se ve estable hoy. En que puedo acompanarte?",
  leve:          "Woof! Hola, soy Pixel. Veo que has tenido momentos dificiles. Estoy aqui para escucharte. Que esta pasando?",
  estres:        "Woof! Hola, soy Pixel. Noto bastante estres. La EISC puede ser muy exigente. Por donde quieres empezar?",
  ansiedad:      "Woof... Hola, soy Pixel. No estas solo en esto. Hagamos un ejercicio: inhala 4 segundos, sostiene 7, exhala 8. Cuando estes listo, cuentame.",
  questionnaire: "Woof! Hola, soy Pixel. Estas completando tu autoevaluacion. No hay respuestas buenas ni malas. Tienes alguna duda?",
  resultado:     "Woof! Ya tienes tu resultado. Tienes dudas sobre lo que significa o que hacer a partir de aqui?",
  avatar:        "Woof! Estas eligiendo tu avatar. Cada personaje te acompana igual de bien. Quieres que te cuente sobre cada uno?",
  progreso:      "Woof! Revisando tu progreso. Recuerda que avanzar incluye reconocer pequenos pasos. Te ayudo a interpretar como vas?",
};

const WELCOME_SIN_TEST =
  "Woof! Hola, soy Pixel. Para acompanarte mejor, primero completa el cuestionario en el Dashboard. Vuelve cuando estes listo!";

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
  PATRONES_PROHIBIDOS.some((p) => p.test(texto));

const BUBBLE_CONFIG = {
  neutro: {
    color: "#00eaff", shadow: "rgba(0,234,255,0.75)",
    icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01"/><path d="M9.5 15a3.5 3.5 0 0 0 5 0"/></svg>,
  },
  leve: {
    color: "#00ff88", shadow: "rgba(0,255,136,0.75)",
    icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 10h.01"/><path d="M14 9l2 2-2 2"/><path d="M9.5 15a3.5 3.5 0 0 0 5 0"/></svg>,
  },
  estres: {
    color: "#ffcc00", shadow: "rgba(255,204,0,0.75)",
    icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c0-3 2.5-6 2.5-6s-5 2-5 6a4.5 4.5 0 0 0 9 0c0-2-1-3.5-2-4.5 0 1.5-4.5 4.5-4.5 4.5z"/></svg>,
  },
  ansiedad: {
    color: "#ff4466", shadow: "rgba(255,68,102,0.75)",
    icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h3l2-5 4 10 2-5h7"/></svg>,
  },
  questionnaire: {
    color: "#a78bfa", shadow: "rgba(167,139,250,0.75)",
    icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12l2 2 4-4"/></svg>,
  },
  resultado: {
    color: "#00eaff", shadow: "rgba(0,234,255,0.75)",
    icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="5"/><path d="M8.5 14.5L7 21l5-2 5 2-1.5-6.5"/></svg>,
  },
  avatar: {
    color: "#ff6b6b", shadow: "rgba(255,107,107,0.75)",
    icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="10" cy="8" r="4"/><path d="M2 20c0-4 3.6-7 8-7"/><path d="M18 14l1.5 3 3.5.5-2.5 2.5.5 3.5L18 22l-3 1.5.5-3.5L13 17.5l3.5-.5z"/></svg>,
  },
  progreso: {
    color: "#ffd500", shadow: "rgba(255,213,0,0.75)",
    icon: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l4-8 4 4 3-6 4 5"/><path d="M3 21h18"/></svg>,
  },
};

function ContextBubble({ visible, emotion }) {
  const ref = useRef();
  const cfg = BUBBLE_CONFIG[emotion] || BUBBLE_CONFIG.neutro;

  useEffect(() => {
    if (!ref.current) return;
    if (visible) {
      gsap.killTweensOf(ref.current);
      gsap.fromTo(ref.current,
        { opacity: 0, scale: 0.4, y: 10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(2)" }
      );
      gsap.to(ref.current, { y: -6, duration: 0.9, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 0.5 });
    } else {
      gsap.killTweensOf(ref.current);
      gsap.to(ref.current, { opacity: 0, scale: 0.4, y: 10, duration: 0.3, ease: "power2.in" });
    }
  }, [visible]);

  return (
    <div ref={ref} style={{
      position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)",
      width: "28px", height: "28px", borderRadius: "50%",
      background: cfg.color,
      boxShadow: `0 0 12px ${cfg.shadow}, 0 2px 8px rgba(0,0,0,0.4)`,
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: 0, pointerEvents: "none", zIndex: 10, userSelect: "none",
      transition: "background 0.4s ease, box-shadow 0.4s ease",
    }}>
      {cfg.icon}
    </div>
  );
}

function PixelModel({ isOpen, onToggle, isTypingRef }) {
  const { scene, animations } = useGLTF(PIXEL_MODEL);
  const { actions }           = useAnimations(animations, scene);
  const groupRef              = useRef();
  const bounceAnimRef         = useRef(null);
  const originalYRef          = useRef(-0.3);
  const isBouncingRef         = useRef(false);
  const typingAnimRef         = useRef(null);
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
        isBouncingRef.current = false;
        bounceAnimRef.current = null;
      },
    });
    bounceAnimRef.current
      .to(groupRef.current.position, { y: origY + 0.12, duration: 0.1, ease: "power2.out" })
      .to(groupRef.current.position, { y: origY, duration: 0.15, ease: "bounce.out" });
    if (actions[ANIMS.happy]) playAnim(ANIMS.happy, 0.15, 500);
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
      <primitive object={scene} scale={150} onClick={handleClick}
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

function ChatPanel({ emotion, onClose, panelRef, onTyping }) {
  const mensajeInicial = emotion
    ? (WELCOME_MESSAGES[emotion] || WELCOME_MESSAGES.neutro)
    : WELCOME_SIN_TEST;

  const [messages, setMessages] = useState([{ role: "assistant", text: mensajeInicial }]);
  const [history,  setHistory]  = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const bottomRef     = useRef();
  const sendBtnRef    = useRef();
  const typingRef     = useRef();
  const dotsRef       = useRef([]);
  const typingTimeout = useRef();
  const emoColor      = EMO_COLORS[emotion] || "#00eaff";

  useEffect(() => {
    return () => { clearTimeout(typingTimeout.current); onTyping(false); };
  }, []);

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

  const handleInputFocus = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    clearTimeout(typingTimeout.current);
    onTyping(false);
    gsap.fromTo(sendBtnRef.current, { scale: 0.88 }, { scale: 1, duration: 0.3, ease: "elastic.out(1.2, 0.5)" });

    if (esTemaFueraDeScope(text)) {
      setMessages((m) => [...m,
        { role: "user", text },
        { role: "assistant", text: "Ese tema esta fuera de lo que puedo ayudarte. Solo puedo acompanarte en bienestar emocional universitario. Como te has sentido con la carga academica?" },
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
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system:   SYSTEM_PROMPTS[emotion] || SYSTEM_PROMPTS.neutro,
          messages: newHistory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Error ${res.status}`);
      const reply = data.content?.[0]?.text || "Lo siento, no pude responder ahora.";
      setHistory((h) => [...h, { role: "assistant", content: reply }].slice(-MAX_HISTORY));
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch (err) {
      console.error("[ChatPanel]", err.message);
      setMessages((m) => [...m, { role: "assistant", text: "Tuve un problema de conexion. Puedes intentarlo de nuevo?" }]);
    }
    setLoading(false);
  };

  return (
    <div className="chatbot-panel" ref={panelRef}>
      <div className="chatbot-header" style={{ borderBottom: `1px solid ${emoColor}22` }}>
        <div className="chatbot-header-left">
          <div className="chatbot-online-dot" style={{ background: emoColor, boxShadow: `0 0 8px ${emoColor}` }} />
          <div>
            <div className="chatbot-title">Pixel</div>
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
                  ref={(el) => (dotsRef.current[i] = el)} style={{ background: emoColor }} />
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
          onFocus={handleInputFocus}
          placeholder={emotion ? "Escribe tu mensaje..." : "Completa el cuestionario primero..."}
          disabled={loading || !emotion}
          maxLength={500}
        />
        <button ref={sendBtnRef} className="chatbot-send" onClick={send}
          disabled={loading || !input.trim() || !emotion}
          style={{ background: `${emoColor}55` }}>
          &#62;
        </button>
      </div>
    </div>
  );
}

export default function ChatBotUI() {
  const [isOpen,  setIsOpen]  = useState(false);
  const [emotion, setEmotion] = useState(null);
  const [chatKey, setChatKey] = useState(0);

  const { user }    = useAuth();
  const location    = useLocation();
  const prevPathRef = useRef(location.pathname);
  const isTypingRef = useRef(false);
  const panelRef    = useRef();
  const tooltipRef  = useRef();

  const isInQuestionnaire = location.pathname.includes("questionnaire") || location.pathname.includes("cuestionario");
  const isInAvatar        = location.pathname.includes("avatar")        || location.pathname.includes("personaje");
  const isInProgress      = location.pathname.includes("progress")      || location.pathname.includes("progreso");

  // Cierre y reset automático al cambiar de ruta
  useEffect(() => {
    const prev = prevPathRef.current;
    const curr = location.pathname;
    if (prev !== curr) {
      prevPathRef.current = curr;
      setIsOpen(false);
      setChatKey((k) => k + 1);
    }
  }, [location.pathname]);

  const [qDone, setQDone] = useState(false);
  useEffect(() => {
    if (!isInQuestionnaire) { setQDone(false); return; }
    setQDone(localStorage.getItem("q_done") === "1");
    const interval = setInterval(() => setQDone(localStorage.getItem("q_done") === "1"), 300);
    return () => clearInterval(interval);
  }, [isInQuestionnaire]);

  const effectiveEmotion = isInQuestionnaire
    ? (qDone ? "resultado" : "questionnaire")
    : isInAvatar  ? "avatar"
    : isInProgress ? "progreso"
    : emotion;

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

  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    if (!sessionStorage.getItem("pixel_welcomed")) {
      setShowWelcome(true);
      sessionStorage.setItem("pixel_welcomed", "1");
    }
  }, []);

  useEffect(() => {
    if (!tooltipRef.current || isOpen) return;
    gsap.to(tooltipRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", delay: 0.3 });
  }, [isOpen]);

  const openPanel = useCallback(() => setIsOpen(true), []);

  const handleClose = useCallback(() => {
    if (!panelRef.current) { setIsOpen(false); setChatKey((k) => k + 1); return; }
    gsap.to(panelRef.current, {
      opacity: 0, y: 16, scale: 0.96, duration: 0.25, ease: "power2.in",
      onComplete: () => { setIsOpen(false); setChatKey((k) => k + 1); },
    });
  }, []);

  useEffect(() => {
    if (!panelRef.current || !isOpen) return;
    gsap.fromTo(panelRef.current,
      { opacity: 0, y: 20, scale: 0.95 },
      { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "power3.out" }
    );
  }, [isOpen]);

  const handleTyping = useCallback((val) => { isTypingRef.current = val; }, []);
  const handleToggle = useCallback(() => {
    if (isOpen) handleClose(); else openPanel();
  }, [isOpen, handleClose, openPanel]);

  const bubbleVisible = !isOpen && (isInQuestionnaire || isInAvatar || isInProgress || !!effectiveEmotion);

  return (
    <div className="chatbot-wrapper">
      {isOpen && (
        <ChatPanel
          key={chatKey}
          emotion={effectiveEmotion}
          onClose={handleClose}
          panelRef={panelRef}
          onTyping={handleTyping}
        />
      )}

      {!isOpen && showWelcome && !isInQuestionnaire && !isInAvatar && (
        <div ref={tooltipRef} className="chatbot-tooltip" style={{ opacity: 0 }} onClick={openPanel}>
          {effectiveEmotion ? "Woof! En que puedo ayudarte?" : "Haz el cuestionario primero"}
        </div>
      )}

      <div className="chatbot-canvas" style={{ position: "relative" }}>
        <ContextBubble visible={bubbleVisible} emotion={effectiveEmotion || "neutro"} />
        <Canvas
          camera={{ position: [0, 0, 1.8], fov: 55 }}
          style={{ background: "transparent" }}
          gl={{ antialias: true, alpha: true, pixelRatio: Math.min(window.devicePixelRatio, 2) }}
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