// =============================================================================
// StressRoom.jsx — "Jardín de Bienestar" — día despejado
// Solo se reemplaza el entorno. Todo lo demás (controller, items, HUD) intacto.
// =============================================================================

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { KeyboardControls, useGLTF, Sky } from "@react-three/drei";
import { Vector3 } from "three";
import StressCharacterController from "./StressCharacterController";
import StressItem from "./StressItem";
import STRESS_ITEMS from "./StressItemsData";

// =============================================================================
// KEY MAP — igual que antes
// =============================================================================
const KEY_MAP = [
  { name: "forward",  keys: ["ArrowUp",    "KeyW"] },
  { name: "backward", keys: ["ArrowDown",  "KeyS"] },
  { name: "left",     keys: ["ArrowLeft",  "KeyA"] },
  { name: "right",    keys: ["ArrowRight", "KeyD"] },
  { name: "run",      keys: ["ShiftLeft",  "ShiftRight"] },
  { name: "jump",     keys: ["Space"] },
];

// =============================================================================
// SUELO — pasto verde con ligera variación de color
// =============================================================================
function Floor() {
  return (
    <>
      {/* Suelo principal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <circleGeometry args={[32, 64]} />
        <meshStandardMaterial color="#4a7c4e" roughness={0.95} metalness={0} />
      </mesh>
      {/* Aro exterior de tierra — transición suave antes de la niebla */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <ringGeometry args={[31, 42, 64]} />
        <meshStandardMaterial color="#3a5c3e" roughness={1} metalness={0} side={2} />
      </mesh>
    </>
  );
}

// =============================================================================
// PAREDES INVISIBLES — mismas dimensiones que antes, solo para colisión
// =============================================================================
function Walls() {
  const W = 28, H = 8;
  return (
    <group>
      {[
        [0, H/2,  W, 0, 0, 0],
        [0, H/2, -W, 0, 0, 0],
        [ W, H/2, 0, 0, Math.PI/2, 0],
        [-W, H/2, 0, 0, Math.PI/2, 0],
      ].map(([x,y,z,rx,ry,rz], i) => (
        <mesh key={i} position={[x,y,z]} rotation={[rx,ry,rz]} visible={false}>
          <boxGeometry args={[W*2, H, 0.5]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

// =============================================================================
// GLBObject — carga un GLB y lo coloca en escena
// =============================================================================
function GLBObject({ url, position, rotation = [0,0,0], scale = 1, castShadow = true }) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((child) => {
      if (child.isMesh) {
        child.castShadow    = castShadow;
        child.receiveShadow = true;
      }
    });
    return c;
  }, [scene, castShadow]);

  return (
    <primitive
      object={clone}
      position={position}
      rotation={rotation}
      scale={scale}
    />
  );
}

// =============================================================================
// LAYOUT DEL JARDÍN
// Coordenadas elegidas para que no choquen con los StressItems (que están
// en: [4,1.5,0] [-4,1.5,3] [0,1.5,-5] [-3,1.5,-3] [3,1.5,-4])
// =============================================================================

// Pinos perimetrales — ligeros (83-101 KB)
const PINOS = [
  { url: "/models/Pinos/pine-tree-1.glb", position: [-13,  0,  -7], rotation: [0, 0.3,  0], scale: 1.5 },
  { url: "/models/Pinos/pine-tree-2.glb", position: [ 14,  0, -10], rotation: [0, -0.5, 0], scale: 1.7 },
  { url: "/models/Pinos/pine-tree-3.glb", position: [-15,  0,   5], rotation: [0, 1.0,  0], scale: 1.4 },
  { url: "/models/Pinos/pine-tree-4.glb", position: [ 16,  0,   3], rotation: [0, -0.8, 0], scale: 1.6 },
  { url: "/models/Pinos/pine-tree-1.glb", position: [ -9,  0,  15], rotation: [0, 0.7,  0], scale: 1.3 },
  { url: "/models/Pinos/pine-tree-3.glb", position: [ 11,  0,  13], rotation: [0, -0.2, 0], scale: 1.5 },
  { url: "/models/Pinos/pine-tree-2.glb", position: [  0,  0,  17], rotation: [0, 0.5,  0], scale: 1.4 },
  { url: "/models/Pinos/pine-tree-4.glb", position: [-17,  0,  -2], rotation: [0, 1.3,  0], scale: 1.3 },
];

// Árboles grandes — solo al fondo lejos (500+ KB, usar con moderación)
const ARBOLES = [
  { url: "/models/Arboles/small-tree-1.glb", position: [-20, 0, -18], scale: 1.1 },
  { url: "/models/Arboles/small-tree-2.glb", position: [ 22, 0, -16], scale: 1.0 },
  { url: "/models/Arboles/small-tree-3.glb", position: [-22, 0,  10], scale: 1.0 },
];

// Arbustos — muy ligeros, dispersos por el jardín
const ARBUSTOS = [
  { url: "/models/Arbustos/bush-1.glb", position: [ -6,  0,  -8], scale: 1.2 },
  { url: "/models/Arbustos/bush-3.glb", position: [  7,  0,  -7], scale: 1.0 },
  { url: "/models/Arbustos/bush-2.glb", position: [ -9,  0,   6], scale: 1.1 },
  { url: "/models/Arbustos/bush-5.glb", position: [ 10,  0,   5], scale: 1.3 },
  { url: "/models/Arbustos/bush-4.glb", position: [  2,  0,  10], scale: 0.9 },
  { url: "/models/Arbustos/bush-6.glb", position: [ -5,  0,  11], scale: 1.0 },
  { url: "/models/Arbustos/bush-1.glb", position: [ 12,  0,  -8], scale: 1.1 },
  { url: "/models/Arbustos/bush-3.glb", position: [-12,  0,   1], scale: 1.0 },
];

// Piedras — muy ligeras (4-6 KB), dan textura al suelo
const PIEDRAS = [
  { url: "/models/Piedras/stone-1.glb", position: [ -3.5, 0,  -6  ], rotation: [0, 0.5, 0], scale: 1.6 },
  { url: "/models/Piedras/stone-3.glb", position: [  6,   0,  -8  ], rotation: [0, 1.2, 0], scale: 1.3 },
  { url: "/models/Piedras/stone-5.glb", position: [  8,   0,   8  ], rotation: [0, 0.8, 0], scale: 1.9 },
  { url: "/models/Piedras/stone-7.glb", position: [ -7,   0,   9  ], rotation: [0, 2.0, 0], scale: 1.4 },
  { url: "/models/Piedras/stone-2.glb", position: [-12,   0,  -3  ], rotation: [0, 0.3, 0], scale: 1.1 },
  { url: "/models/Piedras/stone-6.glb", position: [ 13,   0,  -4  ], rotation: [0, 1.5, 0], scale: 1.2 },
  { url: "/models/Piedras/stone-4.glb", position: [  1.5, 0,  12  ], rotation: [0, 0.9, 0], scale: 1.0 },
  { url: "/models/Piedras/stone-8.glb", position: [ -2,   0,   7  ], rotation: [0, 1.8, 0], scale: 1.3 },
];

// Flores — cerca de los caminos y objetos interactivos
const FLORES = [
  { url: "/models/Flores/flower-1.glb", position: [ -2,   0,  -2.5], scale: 1.0 },
  { url: "/models/Flores/flower-3.glb", position: [  2.5, 0,  -2  ], scale: 1.0 },
  { url: "/models/Flores/flower-5.glb", position: [ -1.5, 0,   2  ], scale: 1.0 },
  { url: "/models/Flores/flower-7.glb", position: [  2,   0,   3  ], scale: 1.2 },
  { url: "/models/Flores/flower-2.glb", position: [  5,   0,   2  ], scale: 0.9 },
  { url: "/models/Flores/flower-8.glb", position: [ -5,   0,  -1  ], scale: 1.1 },
  { url: "/models/Flores/flower-4.glb", position: [  6,   0,  -2  ], scale: 1.0 },
  { url: "/models/Flores/flower-6.glb", position: [ -3,   0,   4  ], scale: 1.0 },
  { url: "/models/Flores/flower_9.glb", position: [  1,   0,  -4  ], scale: 1.1 },
];

// Hongos — junto a piedras y troncos
const HONGOS = [
  { url: "/models/Hongos/mushroom-1.glb", position: [ -3.5, 0,  -5  ], scale: 1.2 },
  { url: "/models/Hongos/mushroom-2.glb", position: [  7,   0,   7  ], scale: 1.0 },
  { url: "/models/Hongos/mushroom-3.glb", position: [ -8,   0,   8  ], scale: 1.3 },
  { url: "/models/Hongos/mushroom-5.glb", position: [ 11,   0,  -5  ], scale: 1.1 },
];

// Pasto — instancias ligeras distribuidas orgánicamente
const PASTO_URLS = [
  "/models/Pasto/grass-1.glb",
  "/models/Pasto/grass-2.glb",
  "/models/Pasto/grass-3.glb",
  "/models/Pasto/grass-4.glb",
];
const PASTO = Array.from({ length: 36 }, (_, i) => {
  // Distribuir en espiral para cobertura uniforme, evitando el centro (0,0)
  const angle = (i / 36) * Math.PI * 2 + i * 0.4;
  const r     = 4 + (i % 6) * 2.8 + Math.sin(i * 1.3) * 1.2;
  return {
    url:      PASTO_URLS[i % PASTO_URLS.length],
    position: [
      Math.cos(angle) * r,
      0,
      Math.sin(angle) * r,
    ],
    rotation: [0, (i * 1.7) % (Math.PI * 2), 0],
    scale:    0.85 + (i % 3) * 0.2,
  };
});

// Troncos y agua
const OTROS = [
  { url: "/models/Otros/wooden-log-1.glb", position: [  9,   0,  -5  ], rotation: [0, 0.6, 0], scale: 1.2 },
  { url: "/models/Otros/wooden-log-2.glb", position: [-10,   0,   4  ], rotation: [0, 2.3, 0], scale: 1.0 },
  { url: "/models/Otros/water.glb",               position: [  0,  -0.05, -6], scale: 1.6 },
];

// Pre-cargar todos los GLB al importar el módulo (evita placeholders)
const ALL_URLS = [
  ...PINOS, ...ARBOLES, ...ARBUSTOS, ...PIEDRAS,
  ...FLORES, ...HONGOS, ...PASTO, ...OTROS,
].map((o) => o.url).filter((v, i, a) => a.indexOf(v) === i);

ALL_URLS.forEach((url) => useGLTF.preload(url));

// =============================================================================
// SceneObjects — renderiza todos los objetos del jardín dentro del Canvas
// =============================================================================
function SceneObjects({ isMobile }) {
  // En móvil omitimos los árboles grandes y reducimos pasto para mantener FPS
  const pastoItems = isMobile ? PASTO.slice(0, 20) : PASTO;
  const arbolesItems = isMobile ? [] : ARBOLES;

  return (
    <>
      {PINOS.map((o, i)       => <GLBObject key={`pino-${i}`}   {...o} />)}
      {arbolesItems.map((o, i) => <GLBObject key={`arbol-${i}`}  {...o} />)}
      {ARBUSTOS.map((o, i)    => <GLBObject key={`arbusto-${i}` } {...o} />)}
      {PIEDRAS.map((o, i)     => <GLBObject key={`piedra-${i}`}  {...o} />)}
      {FLORES.map((o, i)      => <GLBObject key={`flor-${i}`}    {...o} />)}
      {HONGOS.map((o, i)      => <GLBObject key={`hongo-${i}`}   {...o} castShadow={!isMobile} />)}
      {pastoItems.map((o, i)  => <GLBObject key={`pasto-${i}`}   {...o} castShadow={false} />)}
      {OTROS.map((o, i)       => <GLBObject key={`otro-${i}`}    {...o} />)}
    </>
  );
}

// =============================================================================
// StressRoom — componente principal (API idéntica al original)
// =============================================================================
const StressRoom = ({ avatarId, mobileControls, isMobile = false }) => {
  const avatarPosRef = useRef(new Vector3(0, 0, 0));

  return (
    <KeyboardControls map={KEY_MAP}>
      <Canvas
        shadows={!isMobile}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        performance={{ min: 0.5 }}
        camera={{ near: 0.1, far: 300, fov: 60, position: [0, 3, 5] }}
        gl={{ antialias: !isMobile }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* ── Cielo día despejado ─────────────────────────────────────────── */}
        <Sky
          distance={450}
          sunPosition={[15, 8, 5]}
          inclination={0.52}
          azimuth={0.25}
          turbidity={4}
          rayleigh={0.8}
        />

        {/* ── Niebla suave — da profundidad sin cortar bruscamente ─────────── */}
        <fog attach="fog" args={["#d0e8f5", 30, 80]} />

        {/* ── Iluminación día ──────────────────────────────────────────────── */}
        <ambientLight intensity={1.0} color="#fff4e0" />

        {/* Sol principal */}
        <directionalLight
          position={[15, 30, 10]}
          intensity={2.5}
          color="#fff8dc"
          castShadow={!isMobile}
          shadow-mapSize={[isMobile ? 512 : 1024, isMobile ? 512 : 1024]}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
          shadow-camera-near={0.5}
          shadow-camera-far={80}
          shadow-bias={-0.001}
        />

        {/* Luz de relleno — simula el cielo azul rebotando */}
        {!isMobile && (
          <directionalLight position={[-8, 10, -6]} intensity={0.6} color="#87ceeb" />
        )}

        {/* Hemisférica para iluminar desde el suelo */}
        <hemisphereLight
          skyColor="#87ceeb"
          groundColor="#4a7c4e"
          intensity={0.7}
        />

        <Suspense fallback={null}>
          {/* Escenario */}
          <Floor />
          <Walls />
          <SceneObjects isMobile={isMobile} />

          {/* Avatar + controles (sin cambios) */}
          <StressCharacterController
            avatarId={avatarId}
            avatarPosRef={avatarPosRef}
            mobileControls={mobileControls}
            isMobile={isMobile}
          />

          {/* Items interactivos (sin cambios) */}
          {STRESS_ITEMS.map((item) => (
            <StressItem
              key={item.id}
              item={item}
              avatarRef={avatarPosRef}
              isMobile={isMobile}
            />
          ))}
        </Suspense>
      </Canvas>
    </KeyboardControls>
  );
};

export default StressRoom;