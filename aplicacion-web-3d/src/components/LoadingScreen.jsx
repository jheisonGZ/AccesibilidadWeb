// ─────────────────────────────────────────────────────────────────────────────
// LoadingScreen.jsx — src/components/LoadingScreen.jsx
//
// Componente PURAMENTE VISUAL — solo muestra la animación.
// La navegación y el cierre del loading son responsabilidad de
// NavigationContext + usePageReady(), NO de este componente.
//
// USO:
//   {isLoading && <LoadingScreen message={message} />}
//
// PROPS:
//   message {string} — texto sobre la barra. Default: "Cargando"
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import loadingBg from "../assets/images/loading.webp";

export default function LoadingScreen({ message = "Cargando" }) {

  const [progress, setProgress] = useState(0);
  const [dots,     setDots]     = useState(0);

  useEffect(() => {
    // Puntos suspensivos animados
    const dotsTimer = setInterval(
      () => setDots(v => (v + 1) % 4),
      500
    );

    // Barra sube hasta 85% y se detiene — NavigationContext decide cuándo cerrar
    const progressTimer = setInterval(
      () => setProgress(v => v < 85 ? Math.min(v + Math.random() * 4, 85) : v),
      120
    );

    return () => {
      clearInterval(dotsTimer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <div style={styles.root}>
      <style>{shimmerCSS}</style>

      {/* Fondo desenfocado — color oscuro como fallback instantáneo */}
      <div style={{ ...styles.background, backgroundImage: `url(${loadingBg})` }} />
      <div style={styles.overlay} />

      {/* Bloque inferior */}
      <div style={styles.bottomBlock}>

        <p style={styles.message}>
          {message}
          <span style={styles.dotsSpan}>{".".repeat(dots)}</span>
        </p>

        <div style={styles.track}>
          <div className="ls-shimmer" />
          <div style={{ ...styles.fill, width: `${progress}%` }}>
            <div style={styles.tip} />
          </div>
        </div>

        <p style={styles.percentage}>
          {Math.round(progress)}
          <span style={styles.percentSign}>%</span>
        </p>

      </div>
    </div>
  );
}

const styles = {
  root: {
    position   : "fixed",
    inset      : 0,
    zIndex     : 9999,
    overflow   : "hidden",
    background : "#080e08",
  },
  background: {
    position           : "absolute",
    inset              : 0,
    backgroundSize     : "cover",
    backgroundPosition : "center",
    filter             : "blur(10px) brightness(0.55)",
    transform          : "scale(1.08)",
  },
  overlay: {
    position   : "absolute",
    inset      : 0,
    background : "rgba(6, 10, 6, 0.52)",
  },
  bottomBlock: {
    position      : "absolute",
    bottom        : 48,
    left          : "50%",
    transform     : "translateX(-50%)",
    zIndex        : 10,
    width         : "clamp(280px, 68vw, 780px)",
    display       : "flex",
    flexDirection : "column",
    alignItems    : "center",
    gap           : 14,
  },
  message: {
    margin        : 0,
    fontFamily    : "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight    : 300,
    fontSize      : "clamp(12px, 1.3vw, 15px)",
    letterSpacing : "0.20em",
    textTransform : "uppercase",
    color         : "rgba(220, 230, 220, 0.70)",
    textShadow    : "0 2px 12px rgba(0,0,0,0.9)",
  },
  dotsSpan: {
    display   : "inline-block",
    width     : "1.2em",
    textAlign : "left",
  },
  track: {
    position     : "relative",
    width        : "100%",
    height       : 3,
    borderRadius : 99,
    background   : "rgba(255, 255, 255, 0.10)",
    overflow     : "hidden",
  },
  fill: {
    position     : "absolute",
    top          : 0,
    left         : 0,
    height       : "100%",
    background   : "linear-gradient(90deg, #4a8a6a, #5bbf8a, #7ecfaa)",
    borderRadius : 99,
    transition   : "width 0.15s ease",
  },
  tip: {
    position     : "absolute",
    right        : 0,
    top          : "50%",
    transform    : "translateY(-50%)",
    width        : 7,
    height       : 7,
    borderRadius : "50%",
    background   : "#90e8c0",
    boxShadow    : "0 0 8px 3px rgba(100, 220, 160, 0.75)",
  },
  percentage: {
    margin        : 0,
    fontFamily    : "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    fontWeight    : 300,
    fontSize      : "clamp(10px, 1.1vw, 12px)",
    letterSpacing : "0.30em",
    color         : "rgba(180, 210, 190, 0.55)",
    textShadow    : "0 1px 8px rgba(0,0,0,0.8)",
  },
  percentSign: {
    fontSize  : "80%",
    opacity   : 0.6,
    marginLeft: 1,
  },
};

const shimmerCSS = `
  .ls-shimmer {
    position        : absolute;
    inset           : 0;
    background      : linear-gradient(
                        90deg,
                        transparent            0%,
                        rgba(255,255,255,0.07) 50%,
                        transparent           100%
                      );
    background-size : 200% 100%;
    animation       : ls-shimmer-anim 2.2s linear infinite;
  }
  @keyframes ls-shimmer-anim {
    0%   { background-position:  200% 0; }
    100% { background-position: -200% 0; }
  }
`;