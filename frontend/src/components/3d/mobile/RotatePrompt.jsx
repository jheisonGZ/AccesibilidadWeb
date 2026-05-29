// =============================================================================
// src/components/stress/mobile/RotatePrompt.jsx
// =============================================================================

import { useEffect, useRef } from "react";
import { Smartphone, LayoutDashboard } from "lucide-react";
import { useNavigate } from "react-router-dom";

// =============================================================================
// 🔊 SONIDO ROTACIÓN
// =============================================================================
const buildRotateSound = (ctx) => {
  const tone = (oscType, freq, startT, dur, gainVal, freqEnd) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();

    f.type = "lowpass";
    f.frequency.value = 4000;

    o.connect(f);
    f.connect(g);
    g.connect(ctx.destination);

    o.type = oscType;

    o.frequency.setValueAtTime(freq, ctx.currentTime + startT);

    if (freqEnd) {
      o.frequency.exponentialRampToValueAtTime(
        freqEnd,
        ctx.currentTime + startT + dur
      );
    }

    g.gain.setValueAtTime(0, ctx.currentTime + startT);
    g.gain.linearRampToValueAtTime(
      gainVal,
      ctx.currentTime + startT + 0.01
    );

    g.gain.exponentialRampToValueAtTime(
      0.0001,
      ctx.currentTime + startT + dur
    );

    o.start(ctx.currentTime + startT);
    o.stop(ctx.currentTime + startT + dur + 0.05);
  };

  tone("sine", 600, 0, 0.08, 0.18, 220);
  tone("sine", 440, 0.06, 0.25, 0.12, 120);
  tone("triangle", 880, 0, 0.06, 0.10, 440);

  setTimeout(() => ctx.close(), 700);
};

// =============================================================================
// 🔊 SONIDO DASHBOARD
// =============================================================================
const playDashboardSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();

    ctx.resume().then(() => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();

      o.connect(g);
      g.connect(ctx.destination);

      o.type = "sine";

      o.frequency.setValueAtTime(528, ctx.currentTime);
      o.frequency.setValueAtTime(396, ctx.currentTime + 0.12);

      g.gain.setValueAtTime(0.12, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + 0.28
      );

      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + 0.30);

      setTimeout(() => ctx.close(), 500);
    });
  } catch (_) {}
};

// =============================================================================
// 📱 COMPONENTE
// =============================================================================
const RotatePrompt = () => {
  const navigate = useNavigate();
  const soundPlayed = useRef(false);

  // ===========================================================================
  // 🔊 SONIDO PRIMER TOQUE
  // ===========================================================================
  useEffect(() => {
    const handleFirstGesture = () => {
      if (soundPlayed.current) return;

      soundPlayed.current = true;

      try {
        const ctx = new (window.AudioContext ||
          window.webkitAudioContext)();

        ctx.resume().then(() => buildRotateSound(ctx));
      } catch (_) {}
    };

    window.addEventListener(
      "touchstart",
      handleFirstGesture,
      { once: true }
    );

    window.addEventListener(
      "pointerdown",
      handleFirstGesture,
      { once: true }
    );

    return () => {
      window.removeEventListener(
        "touchstart",
        handleFirstGesture
      );

      window.removeEventListener(
        "pointerdown",
        handleFirstGesture
      );
    };
  }, []);

  // ===========================================================================
  // 🧭 BOTÓN VOLVER AL DASHBOARD
  // ===========================================================================
const handleDashboard = () => {
  playDashboardSound();

  try {
    navigator.vibrate?.(20);
  } catch (_) {}

  // ✅ navegación React SIN recargar la página
  navigate("/home");
};

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: "2.5rem",
        fontFamily: "'Sora', sans-serif",
        overflow: "hidden",
      }}
    >
      {/* =========================================================================
          🖼️ FONDO
      ========================================================================= */}
      <img
        src="/images/mobile.webp"
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          zIndex: 0,
        }}
      />

      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(8,16,20,0.15)",
          zIndex: 1,
        }}
      />

      {/* =========================================================================
          💎 TARJETA
      ========================================================================= */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          background: "rgba(255,255,255,0.13)",
          backdropFilter:
            "blur(28px) saturate(1.8) brightness(1.1)",
          WebkitBackdropFilter:
            "blur(28px) saturate(1.8) brightness(1.1)",
          border: "1px solid rgba(255,255,255,0.28)",
          borderTop: "1px solid rgba(255,255,255,0.50)",
          borderRadius: 24,
          padding: "1.6rem",
          textAlign: "center",
          maxWidth: 300,
          width: "88%",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.18), " +
            "0 4px 16px rgba(0,0,0,0.10), " +
            "inset 0 1px 0 rgba(255,255,255,0.50)",
          animation:
            "cardFadeIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {/* =========================================================================
            📱 ICONO
        ========================================================================= */}
        <div
          style={{
            width: 56,
            height: 56,
            margin: "0 auto 1rem",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.13)",
            border: "1px solid rgba(255,255,255,0.30)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation:
              "phoneRotate 3.2s ease-in-out infinite",
          }}
        >
          <Smartphone
            size={24}
            color="rgba(255,255,255,0.88)"
            strokeWidth={1.4}
          />
        </div>

        {/* =========================================================================
            📝 TITULO
        ========================================================================= */}
        <h2
          style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "rgba(255,255,255,0.95)",
            margin: "0 0 0.35rem",
            letterSpacing: "-0.01em",
          }}
        >
          Gira tu dispositivo
        </h2>

        <p
          style={{
            fontSize: "0.80rem",
            color: "rgba(255,255,255,0.60)",
            lineHeight: 1.6,
            margin: "0 0 1.2rem",
          }}
        >
          La sala 3D se disfruta mejor
          <br />
          en modo horizontal
        </p>

        {/* Divider */}
        <div
          style={{
            height: "0.5px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
            marginBottom: "1.1rem",
          }}
        />

        {/* =========================================================================
            🔄 HINT
        ========================================================================= */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: "0.74rem",
            color: "rgba(255,255,255,0.45)",
            marginBottom: "1.1rem",
            animation:
              "hintPulse 2.4s ease-in-out infinite",
          }}
        >
          <Smartphone
            size={12}
            color="rgba(255,255,255,0.45)"
            strokeWidth={2}
            style={{ transform: "rotate(90deg)" }}
          />

          Rota 90° para continuar
        </div>

        {/* Divider */}
        <div
          style={{
            height: "0.5px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
            marginBottom: "1rem",
          }}
        />

        {/* =========================================================================
            🏠 BOTÓN DASHBOARD
        ========================================================================= */}
        <button
          onClick={handleDashboard}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "0.7rem 1rem",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.20)",
            borderRadius: 12,
            color: "rgba(255,255,255,0.70)",
            fontSize: "0.78rem",
            fontFamily: "'Sora', sans-serif",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              "rgba(255,255,255,0.15)";

            e.currentTarget.style.borderColor =
              "rgba(255,255,255,0.35)";

            e.currentTarget.style.color =
              "rgba(255,255,255,0.92)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background =
              "rgba(255,255,255,0.08)";

            e.currentTarget.style.borderColor =
              "rgba(255,255,255,0.20)";

            e.currentTarget.style.color =
              "rgba(255,255,255,0.70)";
          }}
        >
          <LayoutDashboard size={14} strokeWidth={1.8} />
          Volver al inicio
        </button>
      </div>

      {/* =========================================================================
          🎞️ ANIMACIONES
      ========================================================================= */}
      <style>{`
        @keyframes phoneRotate {
          0%   { transform: rotate(0deg) scale(1); }
          30%  { transform: rotate(0deg) scale(1); }
          50%  { transform: rotate(90deg) scale(1.08); }
          75%  { transform: rotate(90deg) scale(1.08); }
          95%  { transform: rotate(0deg) scale(1); }
          100% { transform: rotate(0deg) scale(1); }
        }

        @keyframes cardFadeIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-12px);
          }

          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes hintPulse {
          0%, 100% {
            opacity: 0.45;
          }

          50% {
            opacity: 0.90;
          }
        }
      `}</style>
    </div>
  );
};

export default RotatePrompt;