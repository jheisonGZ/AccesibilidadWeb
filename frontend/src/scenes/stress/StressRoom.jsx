// =============================================================================
// SmallStressRoom.jsx  —  Sala de Estrés compacta
//
// Mapa: 20×20  |  colisiones circulares XZ  |  un solo archivo
//
// AVATARES — mismos paths que StressCharacterController.jsx:
//   "male-1"   → /models/hombre2.glb
//   "female-1" → /models/mujer2.glb
//   "male-2"   → /models/hombre.glb
//   "female-2" → /models/mujer.glb
//
// MODELOS DECORATIVOS (los que ya tienes en /public):
//   /models/Arboles/tree-1.glb  |  small-tree-1.glb
//   /models/Piedras/stone-1.glb
//   /models/Arbustos/bush-1.glb
//   /models/Flores/flower-1.glb
//   /models/Otros/water.glb  |  wooden-log-1.glb
//
// REUTILIZA sin cambios:
//   StressRoomContext, StressHUD, StressChallenge,
//   StressCompleteModal, StressItem, StressItemsData
// =============================================================================

import { Suspense, useRef, useMemo } from "react";
import { Canvas, useFrame }          from "@react-three/fiber";
import { KeyboardControls, useKeyboardControls, useGLTF, Sky } from "@react-three/drei";
import { Vector3, MathUtils, Box3, ACESFilmicToneMapping }     from "three";
import { degToRad }                  from "three/src/math/MathUtils.js";

import StressItem          from "./StressItem";
import STRESS_ITEMS        from "./StressItemsData";
import StressHUD           from "./StressHUD";
import StressChallenge     from "./StressChallenge";
import StressCompleteModal from "./StressCompleteModal";

// ─────────────────────────────────────────────────────────────────────────────
// PATHS DE AVATARES  — idénticos a StressCharacterController.jsx
// ─────────────────────────────────────────────────────────────────────────────
const AVATAR_MODELS = {
  "male-1":   "/models/hombre2.glb",
  "female-1": "/models/mujer2.glb",
  "male-2":   "/models/hombre.glb",
  "female-2": "/models/mujer.glb",
};

// ─────────────────────────────────────────────────────────────────────────────
// COLISIONES  — círculos XZ  { x, z, r }
// Ajusta las posiciones para que coincidan con los modelos de RoomDecor.
// ─────────────────────────────────────────────────────────────────────────────
const OBSTACLES = [
  { x:  6,  z: -6, r: 1.0 },  // árbol NE
  { x: -6,  z: -6, r: 1.0 },  // árbol NO
  { x:  7,  z:  6, r: 0.7 },  // árbol pequeño SE
  { x: -7,  z:  6, r: 0.7 },  // árbol pequeño SO
  { x:  3,  z:  3, r: 0.5 },  // piedra
  { x: -4,  z:  2, r: 0.5 },  // piedra
  { x: -8,  z: -2, r: 3.5 },  // estanque
];
const BOUNDS   = { min: -9.5, max: 9.5 };
const P_RADIUS = 0.45;

function collide(x, z) {
  if (x < BOUNDS.min + P_RADIUS || x > BOUNDS.max - P_RADIUS) return true;
  if (z < BOUNDS.min + P_RADIUS || z > BOUNDS.max - P_RADIUS) return true;
  for (const o of OBSTACLES) {
    const dx = x - o.x, dz = z - o.z;
    if (dx * dx + dz * dz < (P_RADIUS + o.r) ** 2) return true;
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// KEY MAP
// ─────────────────────────────────────────────────────────────────────────────
const KEY_MAP = [
  { name: "forward",  keys: ["ArrowUp",    "KeyW"] },
  { name: "backward", keys: ["ArrowDown",  "KeyS"] },
  { name: "left",     keys: ["ArrowLeft",  "KeyA"] },
  { name: "right",    keys: ["ArrowRight", "KeyD"] },
  { name: "run",      keys: ["ShiftLeft",  "ShiftRight"] },
];

// ─────────────────────────────────────────────────────────────────────────────
// GLBObject  — coloca cualquier GLB con groundFix opcional
// ─────────────────────────────────────────────────────────────────────────────
function GLBObject({ url, position, rotation = [0, 0, 0], scale = 1, groundFix = false }) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => {
    const c = scene.clone(true);
    const s = typeof scale === "number" ? [scale, scale, scale] : scale;
    c.scale.set(...s);
    if (groundFix) {
      c.updateMatrixWorld(true);
      const box = new Box3().setFromObject(c);
      c.position.y -= box.min.y;
    }
    c.traverse((ch) => {
      if (ch.isMesh) { ch.castShadow = true; ch.receiveShadow = true; }
    });
    return c;
  }, [scene, scale, groundFix]);
  return <primitive object={clone} position={position} rotation={rotation} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// DECORACIÓN  — modifica posiciones y modelos a gusto
// ─────────────────────────────────────────────────────────────────────────────
function RoomDecor({ isMobile }) {
  return (
    <>
      {/* Suelo */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#4a7c40" roughness={0.9} />
      </mesh>

      {/* Árboles */}
      <GLBObject url="/models/Arboles/tree-1.glb"       position={[ 6, 0, -6]} scale={0.9} groundFix rotation={[0, 0.5, 0]} />
      <GLBObject url="/models/Arboles/tree-1.glb"       position={[-6, 0, -6]} scale={0.9} groundFix rotation={[0, 1.2, 0]} />
      <GLBObject url="/models/Arboles/small-tree-1.glb" position={[ 7, 0,  6]} scale={0.8} groundFix rotation={[0, 2.1, 0]} />
      <GLBObject url="/models/Arboles/small-tree-1.glb" position={[-7, 0,  6]} scale={0.8} groundFix rotation={[0, 0.8, 0]} />

      {/* Piedras */}
      <GLBObject url="/models/Piedras/stone-1.glb" position={[ 3, 0,  3]} scale={0.6} groundFix />
      <GLBObject url="/models/Piedras/stone-1.glb" position={[-4, 0,  2]} scale={0.5} groundFix rotation={[0, 1.5, 0]} />

      {/* Arbustos */}
      <GLBObject url="/models/Arbustos/bush-1.glb" position={[ 5, 0,  0]} scale={0.5} groundFix />
      <GLBObject url="/models/Arbustos/bush-1.glb" position={[-5, 0, -2]} scale={0.6} groundFix rotation={[0, 1, 0]} />
      <GLBObject url="/models/Arbustos/bush-1.glb" position={[ 2, 0,  7]} scale={0.5} groundFix />

      {/* Flores — solo desktop para ahorrar rendimiento */}
      {!isMobile && (
        <>
          <GLBObject url="/models/Flores/flower-1.glb" position={[ 4, 0, 5]} scale={0.4} groundFix />
          <GLBObject url="/models/Flores/flower-1.glb" position={[-3, 0, 5]} scale={0.4} groundFix rotation={[0, 2, 0]} />
          <GLBObject url="/models/Flores/flower-1.glb" position={[ 1, 0,-7]} scale={0.35} groundFix />
        </>
      )}

      {/* Estanque decorativo — esquina NO */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-8, 0.04, -2]} receiveShadow>
        <circleGeometry args={[2.2, 24]} />
        <meshStandardMaterial color="#1a6080" roughness={0.1} metalness={0.4} transparent opacity={0.75} />
      </mesh>
      <GLBObject url="/models/Otros/water.glb"        position={[-8, 0.05, -2]} scale={0.28} />
      <GLBObject url="/models/Otros/wooden-log-1.glb" position={[ 1, 0,   -6]} scale={0.6} groundFix rotation={[0, 0.8, 0]} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS DE ÁNGULO  (igual que StressCharacterController.jsx)
// ─────────────────────────────────────────────────────────────────────────────
const normalizeAngle = (a) => {
  while (a >  Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
};
const lerpAngle = (s, e, t) => {
  s = normalizeAngle(s); e = normalizeAngle(e);
  if (Math.abs(e - s) > Math.PI) { if (e > s) s += 2 * Math.PI; else e += 2 * Math.PI; }
  return normalizeAngle(s + (e - s) * t);
};

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR  — lógica de tercera persona idéntica a StressCharacterController
//           + colisiones circulares contra OBSTACLES y BOUNDS
// ─────────────────────────────────────────────────────────────────────────────
function Avatar({ avatarId = "male-1", posRef, mobileControls }) {
  const modelUrl = AVATAR_MODELS[avatarId] ?? AVATAR_MODELS["male-1"];
  const { scene } = useGLTF(modelUrl);

  const WALK_SPEED     = 4;
  const RUN_SPEED      = 9;
  const ROTATION_SPEED = degToRad(0.5);

  const groupRef     = useRef();
  const container    = useRef();
  const characterRef = useRef();
  const camPosRef    = useRef();    // detrás y arriba → cámara sigue aquí
  const camTargetRef = useRef();    // cabeza → cámara mira aquí

  const camWorldPos = useRef(new Vector3());
  const camLookAtWP = useRef(new Vector3());
  const camLookAt   = useRef(new Vector3());

  const [, getKeys]   = useKeyboardControls();
  const charRotTarget = useRef(0);
  const rotTarget     = useRef(0);
  const pos           = useRef(new Vector3(0, 0, 2));

  const clone = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((ch) => { if (ch.isMesh) ch.castShadow = true; });
    return c;
  }, [scene]);

  useFrame(({ camera }, delta) => {
    const el = document.activeElement;
    if (el?.tagName === "INPUT" || el?.tagName === "TEXTAREA") return;

    const kb  = getKeys();
    const mob = mobileControls?.current;

    // ── Input ──────────────────────────────────────────────────
    const mv = { x: 0, z: 0 };
    if (kb.forward  || (mob?.move?.y ?? 0) >  0.2) mv.z =  1;
    if (kb.backward || (mob?.move?.y ?? 0) < -0.2) mv.z = -1;
    if (kb.left     || (mob?.move?.x ?? 0) >  0.2) mv.x =  1;
    if (kb.right    || (mob?.move?.x ?? 0) < -0.2) mv.x = -1;

    const lookX = mob?.look?.x ?? 0;
    if (Math.abs(lookX) > 0.1) rotTarget.current += degToRad(lookX * 1.5);

    const speed  = kb.run ? RUN_SPEED : WALK_SPEED;
    const moving = mv.x !== 0 || mv.z !== 0;

    if (moving) {
      charRotTarget.current = Math.atan2(mv.x, mv.z);
      if (mv.x !== 0) rotTarget.current += ROTATION_SPEED * mv.x;

      const nx = pos.current.x + Math.sin(rotTarget.current + charRotTarget.current) * speed * delta;
      const nz = pos.current.z + Math.cos(rotTarget.current + charRotTarget.current) * speed * delta;

      // Colisiones en ejes separados para deslizamiento suave
      if (!collide(nx, pos.current.z)) pos.current.x = nx;
      if (!collide(pos.current.x, nz)) pos.current.z = nz;
    }
    pos.current.y = 0;

    if (groupRef.current) groupRef.current.position.copy(pos.current);
    if (posRef)           posRef.current = pos.current;

    if (characterRef.current) {
      characterRef.current.rotation.y = lerpAngle(
        characterRef.current.rotation.y, charRotTarget.current, 0.1
      );
    }
    if (container.current) {
      container.current.rotation.y = MathUtils.lerp(
        container.current.rotation.y, rotTarget.current, 0.1
      );
    }

    // ── Cámara tercera persona ────────────────────────────────
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

  return (
    <group ref={groupRef}>
      <group ref={container}>
        <group ref={camPosRef}    position={[0, 3, 5]} />   {/* punto de cámara */}
        <group ref={camTargetRef} position={[0, 1.6, 0]} /> {/* punto de mira  */}
        <group ref={characterRef} scale={1.6}>
          <primitive object={clone} />
        </group>
      </group>
      <pointLight position={[0, 1.5, 0]} intensity={0.4} distance={5} decay={2} color="#fff5e0" />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ILUMINACIÓN
// ─────────────────────────────────────────────────────────────────────────────
function Lighting({ isMobile }) {
  return (
    <>
      <ambientLight intensity={0.4} color="#fff5e0" />
      <directionalLight
        position={[10, 15, 8]} intensity={2.0} color="#fffbe8"
        castShadow={!isMobile}
        shadow-mapSize={[isMobile ? 512 : 1024, isMobile ? 512 : 1024]}
        shadow-camera-near={0.5}  shadow-camera-far={40}
        shadow-camera-left={-12}  shadow-camera-right={12}
        shadow-camera-top={12}    shadow-camera-bottom={-12}
        shadow-bias={-0.0005}
      />
      <hemisphereLight args={["#87ceeb", "#3a6030", 0.6]} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SMALL STRESS ROOM  — exportación principal
//
// Props:
//   avatarId     "male-1" | "female-1" | "male-2" | "female-2"
//   isMobile     boolean
//   mobileControls  ref con { move: {x,y}, look: {x,y} }  (opcional)
// ─────────────────────────────────────────────────────────────────────────────
const SmallStressRoom = ({ avatarId = "male-1", mobileControls, isMobile = false }) => {
  const posRef = useRef(new Vector3(0, 0, 2));

  return (
    <>
      <StressHUD isMobile={isMobile} />
      <StressChallenge />
      <StressCompleteModal />

      <KeyboardControls map={KEY_MAP}>
        <Canvas
          shadows={!isMobile}
          dpr={isMobile ? [1, 1.5] : [1, 2]}
          performance={{ min: 0.5 }}
          camera={{ near: 0.1, far: 120, fov: isMobile ? 65 : 60, position: [0, 4, 7] }}
          gl={{ antialias: !isMobile, alpha: false }}
          onCreated={({ gl }) => {
            gl.toneMapping = ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.1;
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <Sky distance={300} sunPosition={[60, 30, 10]}
            turbidity={5} rayleigh={0.6} mieCoefficient={0.003} mieDirectionalG={0.9}
          />
          <fog attach="fog" args={["#d8eff8", 30, 60]} />

          <Lighting isMobile={isMobile} />

          <Suspense fallback={null}>
            <RoomDecor isMobile={isMobile} />

            <Avatar
              avatarId={avatarId}
              posRef={posRef}
              mobileControls={mobileControls}
            />

            {STRESS_ITEMS.map((item) => (
              <StressItem key={item.id} item={item} avatarRef={posRef} isMobile={isMobile} />
            ))}
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </>
  );
};

export default SmallStressRoom;