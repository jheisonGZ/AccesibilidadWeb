// ─────────────────────────────────────────────────────────────────────────────
// HubRoom.jsx — src/scenes/HubRoom.jsx
// Intermediario entre Scene.jsx y las salas 3D.
// Por ahora pasa la emoción directamente a la sala correspondiente.
// A futuro: aquí irá lógica de transición, precarga, animaciones de entrada, etc.
// ─────────────────────────────────────────────────────────────────────────────

import { lazy, Suspense } from "react";

const SalaIsla   = lazy(() => import("./SalaIsla"));
const SalaPlaya  = lazy(() => import("./SalaPlaya"));
const SalaBosque = lazy(() => import("./SalaBosque"));
const SalaValle  = lazy(() => import("./SalaValle"));

const SALA_MAP = {
  ansiedad: SalaIsla,
  estres:   SalaValle,
  leve:     SalaPlaya,
  neutro:   SalaBosque,
};

/**
 * HubRoom
 * @param {string}   emotion  - "neutro" | "leve" | "estres" | "ansiedad"
 * @param {Function} onSalir  - callback para volver al dashboard
 */
export default function HubRoom({ emotion, onSalir }) {
  const SalaComponent = SALA_MAP[emotion] ?? SalaBosque;

  return (
    <Suspense fallback={<div style={{ background: "#080e08", height: "100vh" }} />}>
      <SalaComponent emotion={emotion} onSalir={onSalir} />
    </Suspense>
  );
}