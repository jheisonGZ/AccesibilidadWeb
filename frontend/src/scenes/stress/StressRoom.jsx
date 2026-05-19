// =============================================================================
// StressRoom.jsx — "Jardín de Bienestar Universitario" — entorno inmersivo
// Con cielo 3D, lago, vegetación densa y distribución orgánica
// =============================================================================

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { KeyboardControls, useGLTF, Sky } from "@react-three/drei";
import { Vector3 } from "three";
import StressCharacterController from "./StressCharacterController";
import StressItem from "./StressItem";
import STRESS_ITEMS from "./StressItemsData";

// =============================================================================
// ROTATE PROMPT — para móviles
// =============================================================================
const RotatePrompt = () => (
  <div style={{ position:"fixed", inset:0, background:"#0a1628", display:"flex", flexDirection:"column",
    alignItems:"center", justifyContent:"center", color:"#60a5fa", textAlign:"center", padding:"2rem", zIndex:9999 }}>
    <div style={{ fontSize:"4rem", marginBottom:"1rem" }}>📱</div>
    <h2 style={{ fontSize:"1.4rem" }}>Gira tu dispositivo</h2>
    <p style={{ color:"#94a3b8" }}>La sala 3D se disfruta mejor en horizontal</p>
  </div>
);

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
// SUELO — pasto verde con textura mejorada
// =============================================================================
function Floor() {
  return (
    <>
      {/* Suelo principal con gradiente de color */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.05, 0]}>
        <circleGeometry args={[38, 128]} />
        <meshStandardMaterial color="#5a8c4e" roughness={0.85} metalness={0.05} />
      </mesh>
      {/* Suelo interior más brillante */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.03, 0]}>
        <circleGeometry args={[28, 96]} />
        <meshStandardMaterial color="#6a9c5e" roughness={0.8} metalness={0} />
      </mesh>
      {/* Aro exterior de tierra */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <ringGeometry args={[35, 45, 96]} />
        <meshStandardMaterial color="#5a6c4e" roughness={0.95} metalness={0} side={2} />
      </mesh>
      {/* Camino suave alrededor del lago */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[12, -0.02, 8]}>
        <circleGeometry args={[4, 32]} />
        <meshStandardMaterial color="#8a7c6e" roughness={0.9} metalness={0} />
      </mesh>
    </>
  );
}

// =============================================================================
// PAREDES INVISIBLES — colisión
// =============================================================================
function Walls() {
  const W = 32, H = 8;
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
// LAYOUT DEL JARDÍN — versión mejorada inmersiva
// =============================================================================

// Pinos perimetrales — bosque denso en el borde
const PINOS = [
  // Anillo exterior
  { url: "/models/Pinos/pine-tree-1.glb", position: [-18, 0, -15], rotation: [0, 0.3, 0], scale: 2.0 },
  { url: "/models/Pinos/pine-tree-2.glb", position: [-14, 0, -20], rotation: [0, -0.5, 0], scale: 1.9 },
  { url: "/models/Pinos/pine-tree-3.glb", position: [ -8, 0, -22], rotation: [0, 0.7, 0], scale: 2.1 },
  { url: "/models/Pinos/pine-tree-4.glb", position: [  0, 0, -23], rotation: [0, -0.2, 0], scale: 2.0 },
  { url: "/models/Pinos/pine-tree-1.glb", position: [  8, 0, -22], rotation: [0, 0.5, 0], scale: 1.9 },
  { url: "/models/Pinos/pine-tree-2.glb", position: [ 15, 0, -19], rotation: [0, -0.8, 0], scale: 2.2 },
  { url: "/models/Pinos/pine-tree-3.glb", position: [ 20, 0, -13], rotation: [0, 0.4, 0], scale: 1.8 },
  { url: "/models/Pinos/pine-tree-4.glb", position: [ 22, 0,  -5], rotation: [0, -0.6, 0], scale: 2.0 },
  { url: "/models/Pinos/pine-tree-1.glb", position: [ 23, 0,   3], rotation: [0, 0.9, 0], scale: 1.9 },
  { url: "/models/Pinos/pine-tree-2.glb", position: [ 22, 0,  10], rotation: [0, -0.3, 0], scale: 2.1 },
  { url: "/models/Pinos/pine-tree-3.glb", position: [ 18, 0,  17], rotation: [0, 0.6, 0], scale: 2.0 },
  { url: "/models/Pinos/pine-tree-4.glb", position: [ 12, 0,  21], rotation: [0, -0.7, 0], scale: 1.8 },
  { url: "/models/Pinos/pine-tree-1.glb", position: [  4, 0,  23], rotation: [0, 0.2, 0], scale: 2.2 },
  { url: "/models/Pinos/pine-tree-2.glb", position: [ -4, 0,  23], rotation: [0, -0.4, 0], scale: 2.0 },
  { url: "/models/Pinos/pine-tree-3.glb", position: [-12, 0,  21], rotation: [0, 0.8, 0], scale: 1.9 },
  { url: "/models/Pinos/pine-tree-4.glb", position: [-18, 0,  17], rotation: [0, -0.5, 0], scale: 2.1 },
  { url: "/models/Pinos/pine-tree-1.glb", position: [-22, 0,  10], rotation: [0, 0.3, 0], scale: 2.0 },
  { url: "/models/Pinos/pine-tree-2.glb", position: [-23, 0,   2], rotation: [0, -0.9, 0], scale: 1.8 },
  { url: "/models/Pinos/pine-tree-3.glb", position: [-22, 0,  -6], rotation: [0, 0.5, 0], scale: 2.1 },
];

// Árboles grandes — bosque frondoso en segundo plano
const ARBOLES = [
  { url: "/models/Arboles/small-tree-1.glb", position: [-25, 0, -22], scale: 1.4 },
  { url: "/models/Arboles/small-tree-2.glb", position: [ 26, 0, -20], scale: 1.3 },
  { url: "/models/Arboles/small-tree-3.glb", position: [-27, 0,  12], scale: 1.5 },
  { url: "/models/Arboles/small-tree-1.glb", position: [ 24, 0,  18], scale: 1.4 },
  { url: "/models/Arboles/small-tree-2.glb", position: [-20, 0, -28], scale: 1.2 },
  { url: "/models/Arboles/small-tree-3.glb", position: [ 28, 0,   5], scale: 1.4 },
  { url: "/models/Arboles/small-tree-1.glb", position: [ 18, 0, -26], scale: 1.3 },
  { url: "/models/Arboles/small-tree-2.glb", position: [-26, 0,  -8], scale: 1.5 },
];

// Arbustos — agrupados para dar densidad
const ARBUSTOS = [
  // Grupo norte
  { url: "/models/Arbustos/bush-1.glb", position: [ -5, 0, -14], scale: 1.3 },
  { url: "/models/Arbustos/bush-3.glb", position: [ -2, 0, -15], scale: 1.1 },
  { url: "/models/Arbustos/bush-2.glb", position: [  3, 0, -14], scale: 1.2 },
  { url: "/models/Arbustos/bush-5.glb", position: [  6, 0, -12], scale: 1.4 },
  // Grupo sur
  { url: "/models/Arbustos/bush-4.glb", position: [ -7, 0,  12], scale: 1.2 },
  { url: "/models/Arbustos/bush-6.glb", position: [ -4, 0,  13], scale: 1.0 },
  { url: "/models/Arbustos/bush-1.glb", position: [  5, 0,  14], scale: 1.3 },
  { url: "/models/Arbustos/bush-3.glb", position: [  8, 0,  11], scale: 1.1 },
  // Grupo este
  { url: "/models/Arbustos/bush-2.glb", position: [ 14, 0,  -3], scale: 1.2 },
  { url: "/models/Arbustos/bush-5.glb", position: [ 15, 0,   0], scale: 1.0 },
  { url: "/models/Arbustos/bush-4.glb", position: [ 13, 0,   3], scale: 1.3 },
  // Grupo oeste
  { url: "/models/Arbustos/bush-6.glb", position: [-13, 0,  -4], scale: 1.1 },
  { url: "/models/Arbustos/bush-1.glb", position: [-14, 0,  -1], scale: 1.2 },
  { url: "/models/Arbustos/bush-3.glb", position: [-12, 0,   2], scale: 1.0 },
  // Dispersos
  { url: "/models/Arbustos/bush-2.glb", position: [-10, 0,  -9], scale: 1.1 },
  { url: "/models/Arbustos/bush-4.glb", position: [ 11, 0,  10], scale: 1.2 },
  { url: "/models/Arbustos/bush-6.glb", position: [ -9, 0,   8], scale: 1.0 },
  { url: "/models/Arbustos/bush-5.glb", position: [ 10, 0,  -8], scale: 1.3 },
];

// Piedras — agrupadas alrededor del lago y caminos
const PIEDRAS = [
  { url: "/models/Piedras/stone-1.glb", position: [ 10.5, 0,  6.5], rotation: [0, 0.5, 0], scale: 1.4 },
  { url: "/models/Piedras/stone-3.glb", position: [ 11.5, 0,  7.2], rotation: [0, 1.2, 0], scale: 1.2 },
  { url: "/models/Piedras/stone-5.glb", position: [  9.2, 0,  7.8], rotation: [0, 0.8, 0], scale: 1.6 },
  { url: "/models/Piedras/stone-7.glb", position: [ 13.0, 0,  5.5], rotation: [0, 2.0, 0], scale: 1.1 },
  { url: "/models/Piedras/stone-2.glb", position: [ -9.5, 0,  7.0], rotation: [0, 0.3, 0], scale: 1.3 },
  { url: "/models/Piedras/stone-6.glb", position: [-10.8, 0,  8.2], rotation: [0, 1.5, 0], scale: 1.4 },
  { url: "/models/Piedras/stone-4.glb", position: [ -8.0, 0,  6.0], rotation: [0, 0.9, 0], scale: 1.2 },
  { url: "/models/Piedras/stone-8.glb", position: [-11.5, 0,  5.8], rotation: [0, 1.8, 0], scale: 1.5 },
  { url: "/models/Piedras/stone-1.glb", position: [ -3.5, 0, -11.0], rotation: [0, 0.4, 0], scale: 1.2 },
  { url: "/models/Piedras/stone-3.glb", position: [  2.0, 0, -12.5], rotation: [0, 1.1, 0], scale: 1.3 },
  { url: "/models/Piedras/stone-5.glb", position: [ 15.0, 0,  -2.0], rotation: [0, 0.7, 0], scale: 1.4 },
  { url: "/models/Piedras/stone-7.glb", position: [-15.5, 0,   0.5], rotation: [0, 1.9, 0], scale: 1.1 },
];

// Flores — campos florales cerca del lago y caminos
const FLORES = [
  // Alrededor del lago
  { url: "/models/Flores/flower-1.glb", position: [  9.0, 0,  5.0], scale: 1.0 },
  { url: "/models/Flores/flower-3.glb", position: [ 10.5, 0,  5.5], scale: 1.1 },
  { url: "/models/Flores/flower-5.glb", position: [  8.0, 0,  6.0], scale: 0.9 },
  { url: "/models/Flores/flower-7.glb", position: [ 11.0, 0,  4.5], scale: 1.2 },
  { url: "/models/Flores/flower-2.glb", position: [  7.5, 0,  7.0], scale: 1.0 },
  { url: "/models/Flores/flower-8.glb", position: [ 12.5, 0,  6.0], scale: 1.1 },
  { url: "/models/Flores/flower-4.glb", position: [ -8.0, 0,  6.5], scale: 1.0 },
  { url: "/models/Flores/flower-6.glb", position: [ -9.5, 0,  5.0], scale: 1.1 },
  { url: "/models/Flores/flower_9.glb", position: [ -7.0, 0,  7.5], scale: 0.9 },
  { url: "/models/Flores/flower-1.glb", position: [-10.5, 0,  4.5], scale: 1.0 },
  // Zona central
  { url: "/models/Flores/flower-3.glb", position: [ -2.0, 0,  -5.0], scale: 1.0 },
  { url: "/models/Flores/flower-5.glb", position: [  1.5, 0,  -6.0], scale: 1.1 },
  { url: "/models/Flores/flower-7.glb", position: [ -1.0, 0,   4.5], scale: 0.9 },
  { url: "/models/Flores/flower-2.glb", position: [  2.0, 0,   5.5], scale: 1.0 },
  { url: "/models/Flores/flower-8.glb", position: [  0.5, 0,  -3.0], scale: 1.2 },
  // Perimetrales
  { url: "/models/Flores/flower-4.glb", position: [ -5.0, 0, -12.0], scale: 1.0 },
  { url: "/models/Flores/flower-6.glb", position: [  6.0, 0, -10.0], scale: 1.1 },
  { url: "/models/Flores/flower_9.glb", position: [ -6.5, 0,  12.0], scale: 0.9 },
  { url: "/models/Flores/flower-1.glb", position: [  7.0, 0,  13.0], scale: 1.0 },
];

// Hongos — junto a troncos y piedras
const HONGOS = [
  { url: "/models/Hongos/mushroom-1.glb", position: [ 10.0, 0,  7.5], scale: 1.2 },
  { url: "/models/Hongos/mushroom-2.glb", position: [ -9.0, 0,  8.0], scale: 1.1 },
  { url: "/models/Hongos/mushroom-3.glb", position: [ -4.0, 0, -11.5], scale: 1.3 },
  { url: "/models/Hongos/mushroom-5.glb", position: [  3.5, 0, -12.0], scale: 1.0 },
  { url: "/models/Hongos/mushroom-1.glb", position: [ 14.0, 0,  -1.5], scale: 1.2 },
  { url: "/models/Hongos/mushroom-2.glb", position: [-14.5, 0,   1.0], scale: 1.1 },
  { url: "/models/Hongos/mushroom-3.glb", position: [ 16.0, 0, -10.0], scale: 1.0 },
  { url: "/models/Hongos/mushroom-5.glb", position: [-15.0, 0,  -8.0], scale: 1.3 },
];

// Pasto — cobertura natural abundante
const PASTO_URLS = [
  "/models/Pasto/grass-1.glb",
  "/models/Pasto/grass-2.glb",
  "/models/Pasto/grass-3.glb",
  "/models/Pasto/grass-4.glb",
];

const PASTO = Array.from({ length: 72 }, (_, i) => {
  // Distribución en anillos concéntricos
  const ring = Math.floor(i / 18);
  const r = 5.5 + ring * 2.8 + Math.sin(i * 0.8) * 0.8;
  const angle = (i * 0.9) + ring * 1.2;
  return {
    url: PASTO_URLS[i % PASTO_URLS.length],
    position: [
      Math.cos(angle) * r,
      0,
      Math.sin(angle) * r,
    ],
    rotation: [0, angle + Math.sin(i) * 0.5, 0],
    scale: 0.7 + (i % 4) * 0.2,
  };
});

// Troncos, agua y cielo
const OTROS = [
  { url: "/models/Otros/wooden-log-1.glb", position: [ 10.0, 0,  8.5], rotation: [0, 0.6, 0], scale: 1.3 },
  { url: "/models/Otros/wooden-log-2.glb", position: [ -9.5, 0,  9.0], rotation: [0, 2.3, 0], scale: 1.1 },
  { url: "/models/Otros/wooden-log-1.glb", position: [  4.0, 0, -13.0], rotation: [0, 1.2, 0], scale: 1.2 },
  { url: "/models/Otros/wooden-log-2.glb", position: [ -5.5, 0, -12.0], rotation: [0, 0.8, 0], scale: 1.0 },
  { url: "/models/Otros/water.glb", position: [ 11.0, -0.1,  7.5], rotation: [0, 0, 0], scale: 2.2 },
];

// Cielo 3D — envolvente
const SKY = { url: "/models/Otros/sky.glb", position: [0, 8, 0], rotation: [0, 0, 0], scale: 45 };

// Pre-cargar todos los GLB
const ALL_URLS = [
  ...PINOS, ...ARBOLES, ...ARBUSTOS, ...PIEDRAS,
  ...FLORES, ...HONGOS, ...PASTO, ...OTROS, SKY,
].map((o) => o.url).filter((v, i, a) => a.indexOf(v) === i);

ALL_URLS.forEach((url) => useGLTF.preload(url));

// =============================================================================
// SceneObjects — renderiza todos los objetos del jardín
// =============================================================================
function SceneObjects({ isMobile }) {
  const pastoItems = isMobile ? PASTO.slice(0, 40) : PASTO;
  const arbolesItems = isMobile ? ARBOLES.slice(0, 4) : ARBOLES;

  return (
    <>
      {/* Cielo 3D envolvente */}
      <GLBObject key="sky" {...SKY} castShadow={false} />
      
      {/* Vegetación y elementos */}
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

  // Mostrar prompt de rotación en móvil si está en vertical
  const [isPortrait, setIsPortrait] = React.useState(false);
  
  React.useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  if (isMobile && isPortrait) {
    return <RotatePrompt />;
  }

  return (
    <KeyboardControls map={KEY_MAP}>
      <Canvas
        shadows={!isMobile}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        performance={{ min: 0.5 }}
        camera={{ near: 0.1, far: 300, fov: 60, position: [0, 3.5, 6] }}
        gl={{ antialias: !isMobile }}
        style={{ width: "100%", height: "100%" }}
      >
        {/* ── Componente Sky como respaldo (si sky.glb no carga completamente) ── */}
        <Sky
          distance={500}
          sunPosition={[15, 12, 5]}
          inclination={0.55}
          azimuth={0.25}
          turbidity={3.5}
          rayleigh={0.6}
        />

        {/* ── Niebla suave y profunda ── */}
        <fog attach="fog" args={["#c8e0f0", 35, 85]} />

        {/* ── Iluminación mejorada para ambiente terapéutico ── */}
        <ambientLight intensity={1.1} color="#fff8e8" />

        {/* Sol principal */}
        <directionalLight
          position={[18, 28, 12]}
          intensity={2.4}
          color="#fff0cc"
          castShadow={!isMobile}
          shadow-mapSize={[isMobile ? 512 : 1024, isMobile ? 512 : 1024]}
          shadow-camera-left={-32}
          shadow-camera-right={32}
          shadow-camera-top={32}
          shadow-camera-bottom={-32}
          shadow-camera-near={0.5}
          shadow-camera-far={90}
          shadow-bias={-0.0005}
        />

        {/* Luz de relleno cálida desde el suelo */}
        <directionalLight position={[-5, 3, -4]} intensity={0.5} color="#c8a86c" />

        {/* Luz azul suave desde el cielo */}
        {!isMobile && (
          <directionalLight position={[-10, 15, -8]} intensity={0.55} color="#88bbdd" />
        )}

        {/* Hemisférica equilibrada */}
        <hemisphereLight
          skyColor="#9bc8e8"
          groundColor="#5a8c4e"
          intensity={0.75}
        />

        <Suspense fallback={null}>
          <Floor />
          <Walls />
          <SceneObjects isMobile={isMobile} />

          <StressCharacterController
            avatarId={avatarId}
            avatarPosRef={avatarPosRef}
            mobileControls={mobileControls}
            isMobile={isMobile}
          />

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

// Importar React para usar hooks
import React from 'react';

export default StressRoom;