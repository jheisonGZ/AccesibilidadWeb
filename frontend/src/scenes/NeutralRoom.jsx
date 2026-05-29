// ======================================================
// ESCENA: NEUTRAL ROOM
// ======================================================

import { Canvas } from "@react-three/fiber";
import { Sky, useGLTF } from "@react-three/drei";
// ======================================================
// COMPONENTES 3D
// ======================================================

import PlayerController from "../components/3d/player/PlayerController";

// ======================================================
// COMPONENTES MOBILE
// ======================================================

import MobileControlsOverlay from "../components/3d/mobile/MobileControlsOverlay";
import RotatePrompt from "../components/3d/mobile/RotatePrompt";

import { useMobileControls }
from "../components/3d/mobile/useMobileControls";

import { useLandscapeLock }
from "../components/3d/mobile/useLandscapeLock";

// ======================================================
// TERRENO
// ======================================================

function Ground() {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[10, 10]} />

      <meshStandardMaterial
        color="#3d9970"
      />
    </mesh>
  );
}

// ======================================================
// LÍMITES INVISIBLES DEL MAPA
// ======================================================

function Walls() {

  const grosor = 0.2;
  const alto = 3;
  const mitad = 5;

  return (
    <>
      {/* Norte */}
      <mesh
        name="pared"
        position={[0, alto / 2, -mitad]}
        visible={false}
      >
        <boxGeometry
          args={[10 + grosor, alto, grosor]}
        />
        <meshStandardMaterial />
      </mesh>

      {/* Sur */}
      <mesh
        name="pared"
        position={[0, alto / 2, mitad]}
        visible={false}
      >
        <boxGeometry
          args={[10 + grosor, alto, grosor]}
        />
        <meshStandardMaterial />
      </mesh>

      {/* Oeste */}
      <mesh
        name="pared"
        position={[-mitad, alto / 2, 0]}
        visible={false}
      >
        <boxGeometry
          args={[grosor, alto, 10 + grosor]}
        />
        <meshStandardMaterial />
      </mesh>

      {/* Este */}
      <mesh
        name="pared"
        position={[mitad, alto / 2, 0]}
        visible={false}
      >
        <boxGeometry
          args={[grosor, alto, 10 + grosor]}
        />
        <meshStandardMaterial />
      </mesh>
    </>
  );
}

// ======================================================
// ESCENA PRINCIPAL
// ======================================================

export default function NeutralRoom() {

  // --------------------------------------------------
  // CONTROLES MOBILE
  // --------------------------------------------------

  const mobileControls =
    useMobileControls();

  // --------------------------------------------------
  // DETECCIÓN DE ORIENTACIÓN
  // --------------------------------------------------

    const { isPortrait } =
      useLandscapeLock();

  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
    navigator.userAgent
  );

  const showRotatePrompt =
    isMobile && isPortrait;

    const tree = useGLTF(
  "/models/Arboles/tree-1.glb"
);

  return (
    <>

      {/* ==================================================
          CONTENEDOR PRINCIPAL
      ================================================== */}

      <div
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          position: "fixed",
          inset: 0,

          // Mantener WebGL vivo
          visibility: showRotatePrompt
            ? "hidden"
            : "visible",

          pointerEvents: showRotatePrompt
            ? "none"
            : "auto",
        }}
      >

        {/* ==============================================
            ESCENA 3D
        ============================================== */}

        <Canvas
          style={{
            width: "100%",
            height: "100%",
          }}

          camera={{
            position: [0, 2.5, 3.5],
            fov: 60,
          }}

          gl={{
            powerPreference:
              "high-performance",

            onContextLost: (e) =>
              e.preventDefault(),
          }}

          frameloop={
            showRotatePrompt
              ? "never"
              : "always"
          }
        >

          {/* ---------- ILUMINACIÓN ---------- */}

          <ambientLight intensity={1.0} />

          <directionalLight
            position={[5, 10, 5]}
            intensity={2}
            castShadow
          />

          {/* ---------- CIELO ---------- */}

          <Sky
            sunPosition={[100, 20, 100]}
          />

          {/* ---------- ENTORNO ---------- */}

          <Ground />

          <primitive
  object={tree.scene.clone()}
  position={[8, -7, 1]} // Ajusta la posición del árbol
  scale={1}
/>

          <Walls />

          {/* ---------- JUGADOR ---------- */}

          <PlayerController
            controls={mobileControls}
          />

        </Canvas>

        {/* ==============================================
            CONTROLES MOBILE
        ============================================== */}

        {isMobile && !showRotatePrompt && (
          <MobileControlsOverlay
            controls={mobileControls}
          />
        )}

      </div>

      {/* ==============================================
          MENSAJE ROTAR DISPOSITIVO
      ============================================== */}

      {showRotatePrompt && (
        <RotatePrompt />
      )}

    </>
  );
}