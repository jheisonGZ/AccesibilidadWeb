// =============================================================================
// StressCharacterController.jsx
// Controlador de personaje en tercera persona — versión simplificada y comentada
//
// CÓMO FUNCIONA:
//   groupRef     → posición mundial del avatar (se mueve con WASD)
//   container    → rota con A/D (orbita la cámara alrededor del avatar)
//   characterRef → rota solo para mirar hacia donde camina
//   camPosRef    → punto 3D detrás/arriba del avatar → la cámara se mueve aquí
//   camTargetRef → punto 3D en la cabeza del avatar  → la cámara mira aquí
//
// COLISIONES:
//   Array OBSTACLES con círculos XZ { x, z, r }.
//   Mantén estos valores sincronizados con los modelos en SmallStressRoom.jsx.
// =============================================================================

import { useRef, useMemo }              from "react";
import { useFrame }                     from "@react-three/fiber";
import { useKeyboardControls, useGLTF } from "@react-three/drei";
import { MathUtils, Vector3 }           from "three";
import { degToRad }                     from "three/src/math/MathUtils.js";

// ─── Avatares ────────────────────────────────────────────────────────────────
const AVATAR_MODELS = {
  "male-1":   "/models/hombre2.glb",
  "female-1": "/models/mujer2.glb",
  "male-2":   "/models/hombre.glb",
  "female-2": "/models/mujer.glb",
};

// ─── Colisiones ──────────────────────────────────────────────────────────────
// Cada entrada: { x, z, r } = centro y radio en el plano XZ.
// Ajusta x/z para que coincidan con los modelos colocados en la escena.
const OBSTACLES = [
  { x:  6,  z: -6, r: 1.0 },   // árbol grande NE
  { x: -6,  z: -6, r: 1.0 },   // árbol grande NO
  { x:  7,  z:  6, r: 0.7 },   // árbol pequeño SE
  { x: -7,  z:  6, r: 0.7 },   // árbol pequeño SO
  { x:  3,  z:  3, r: 0.5 },   // piedra derecha
  { x: -4,  z:  2, r: 0.5 },   // piedra izquierda
  { x: -8,  z: -2, r: 3.5 },   // estanque — radio grande para bloquearlo
];
const BOUNDS    = { min: -9.5, max: 9.5 }; // límites de la sala 20×20
const P_RADIUS  = 0.45;                    // radio de colisión del jugador

// Devuelve true si la posición (x, z) colisiona con algo
function collide(x, z) {
  // Paredes de la sala
  if (x < BOUNDS.min + P_RADIUS || x > BOUNDS.max - P_RADIUS) return true;
  if (z < BOUNDS.min + P_RADIUS || z > BOUNDS.max - P_RADIUS) return true;
  // Obstáculos circulares
  for (const o of OBSTACLES) {
    const dx = x - o.x, dz = z - o.z;
    if (dx * dx + dz * dz < (P_RADIUS + o.r) ** 2) return true;
  }
  return false;
}

// ─── Helpers de ángulo ───────────────────────────────────────────────────────
const normalizeAngle = (a) => {
  while (a >  Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};
const lerpAngle = (s, e, t) => {
  s = normalizeAngle(s);
  e = normalizeAngle(e);
  if (Math.abs(e - s) > Math.PI) { if (e > s) s += 2 * Math.PI; else e += 2 * Math.PI; }
  return normalizeAngle(s + (e - s) * t);
};

// ─── Modelo GLB del avatar ───────────────────────────────────────────────────
function AvatarModel({ modelUrl }) {
  const { scene } = useGLTF(modelUrl);
  // Clonamos para que varias salas puedan usar el mismo GLB sin conflicto
  const clone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((ch) => { if (ch.isMesh) ch.castShadow = true; });
    return c;
  }, [scene]);
  return <primitive object={clone} />;
}

// ─── Controlador principal ───────────────────────────────────────────────────
const StressCharacterController = ({
  avatarId      = "male-1",
  avatarPosRef,           // ref compartido con StressItem para detección de proximidad
  mobileControls,         // ref con { move:{x,y}, look:{x,y} } desde el joystick móvil
  isMobile      = false,
}) => {
  // Velocidades
  const WALK_SPEED     = 4;
  const RUN_SPEED      = 9;
  const ROTATION_SPEED = degToRad(0.5); // velocidad de giro de cámara con A/D

  const modelUrl = AVATAR_MODELS[avatarId] ?? AVATAR_MODELS["male-1"];

  // ── Referencias de Three.js ──────────────────────────────────────────────
  const groupRef     = useRef(); // posición mundial
  const container    = useRef(); // rota con la cámara
  const characterRef = useRef(); // rota hacia donde camina
  const camPosRef    = useRef(); // punto de cámara (detrás + arriba)
  const camTargetRef = useRef(); // punto de mira (cabeza)

  // Vectores reutilizables para lerp de cámara (evita allocations en useFrame)
  const camWorldPos = useRef(new Vector3());
  const camLookAtWP = useRef(new Vector3());
  const camLookAt   = useRef(new Vector3());

  // Estado de movimiento
  const [, getKeys]   = useKeyboardControls();
  const charRotTarget = useRef(0); // ángulo al que debe girar el personaje
  const rotTarget     = useRef(0); // ángulo al que debe girar el contenedor/cámara
  const pos           = useRef(new Vector3(0, 0, 2)); // posición actual

  // ── Loop de animación ────────────────────────────────────────────────────
  useFrame(({ camera }, delta) => {
    // No procesar si el foco está en un input (ej: modal de desafío abierto)
    const el = document.activeElement;
    if (el?.tagName === "INPUT" || el?.tagName === "TEXTAREA") return;

    const kb  = getKeys();
    const mob = mobileControls?.current;

    // 1. Leer input de movimiento ──────────────────────────────────────────
    const mv = { x: 0, z: 0 };
    if (kb.forward  || (mob?.move?.y ?? 0) >  0.2) mv.z =  1; // W / ↑ / stick arriba
    if (kb.backward || (mob?.move?.y ?? 0) < -0.2) mv.z = -1; // S / ↓ / stick abajo
    if (kb.left     || (mob?.move?.x ?? 0) >  0.2) mv.x =  1; // A / ← / stick izq
    if (kb.right    || (mob?.move?.x ?? 0) < -0.2) mv.x = -1; // D / → / stick der

    // Joystick derecho → rotar cámara horizontalmente
    const lookX = mob?.look?.x ?? 0;
    if (Math.abs(lookX) > 0.1) rotTarget.current += degToRad(lookX * 1.5);

    const speed  = kb.run ? RUN_SPEED : WALK_SPEED; // Shift = correr
    const moving = mv.x !== 0 || mv.z !== 0;

    // 2. Calcular nueva posición con colisiones ───────────────────────────
    if (moving) {
      // Ángulo al que gira el personaje (relativo al contenedor/cámara)
      charRotTarget.current = Math.atan2(mv.x, mv.z);
      // A/D también orbitan la cámara
      if (mv.x !== 0) rotTarget.current += ROTATION_SPEED * mv.x;

      // Posición candidata
      const nx = pos.current.x + Math.sin(rotTarget.current + charRotTarget.current) * speed * delta;
      const nz = pos.current.z + Math.cos(rotTarget.current + charRotTarget.current) * speed * delta;

      // Colisiones en ejes separados → permite deslizarse por obstáculos
      if (!collide(nx, pos.current.z)) pos.current.x = nx;
      if (!collide(pos.current.x, nz)) pos.current.z = nz;
    }
    pos.current.y = 0; // siempre pegado al suelo (sin gravedad/salto)

    // 3. Aplicar posición y exportar ──────────────────────────────────────
    if (groupRef.current) groupRef.current.position.copy(pos.current);
    if (avatarPosRef)     avatarPosRef.current = pos.current; // StressItem lo usa

    // 4. Rotar el personaje suavemente hacia donde camina ─────────────────
    if (characterRef.current) {
      characterRef.current.rotation.y = lerpAngle(
        characterRef.current.rotation.y,
        charRotTarget.current,
        0.1
      );
    }

    // 5. Rotar el contenedor (orbita la cámara con A/D) ───────────────────
    if (container.current) {
      container.current.rotation.y = MathUtils.lerp(
        container.current.rotation.y,
        rotTarget.current,
        0.1
      );
    }

    // 6. Mover la cámara en tercera persona ───────────────────────────────
    // camPosRef y camTargetRef son hijos de container → rotan con él.
    // Obtenemos su posición mundial y hacemos lerp de la cámara hacia ahí.
    if (camPosRef.current) {
      camPosRef.current.getWorldPosition(camWorldPos.current);
      camera.position.lerp(camWorldPos.current, 0.15);
    }
    if (camTargetRef.current) {
      camTargetRef.current.getWorldPosition(camLookAtWP.current);
      camLookAt.current.lerp(camLookAtWP.current, 0.15);
      camera.lookAt(camLookAt.current);
    }
  });

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <group ref={groupRef}>
      <group ref={container}>

        {/*
          Punto de cámara: 5 unidades DETRÁS del avatar, 3 unidades ARRIBA.
          Cambia z para alejar/acercar la cámara.
          Cambia y para subir/bajar el ángulo.
        */}
        <group ref={camPosRef}    position={[0, 3, 5]} />

        {/*
          Punto de mira: a la altura de la cabeza del avatar (scale 1.6 × ~1m).
          Cambia y si el avatar parece demasiado alto o bajo en pantalla.
        */}
        <group ref={camTargetRef} position={[0, 1.6, 0]} />

        {/* Modelo 3D del avatar — escala 1.6 igual que en el original */}
        <group ref={characterRef} scale={1.6}>
          <AvatarModel modelUrl={modelUrl} />
        </group>

      </group>

      {/* Luz que sigue al avatar para que siempre esté bien iluminado */}
      <pointLight position={[0, 1.5, 0]} intensity={0.4} distance={5} decay={2} color="#fff5e0" />
    </group>
  );
};

export default StressCharacterController;