import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useEffect } from "react";

import PlayerController from "../components/3d/player/PlayerController";
import MobileControlsOverlay from "../components/3d/mobile/MobileControlsOverlay";
import RotatePrompt from "../components/3d/mobile/RotatePrompt";
import { useMobileControls } from "../components/3d/mobile/useMobileControls";
import { useLandscapeLock } from "../components/3d/mobile/useLandscapeLock";

// ─────────────────────────────────────────────────────────
// ESCENARIO PLAYA
// ─────────────────────────────────────────────────────────

function Playa() {
  const { scene } = useGLTF("/models/playa.glb");

  return (
    <primitive
      object={scene}

      // POSICIÓN DEL ESCENARIO
      // X = izquierda (-) / derecha (+)
      // Y = abajo (-) / arriba (+)
      // Z = atrás (-) / adelante (+)
      position={[0,-6, -7 ]}

      // ROTACIÓN EN RADIANES
      // [X, Y, Z]
      rotation={[0, Math.PI / -2, 0.20]} 

      // Escala general del modelo
      scale={0.25}

      // Recibe sombras
      receiveShadow

      // Proyecta sombras
      castShadow
    />
  );
}

// ─────────────────────────────────────────────────────────
// SKYDOME
// ─────────────────────────────────────────────────────────

function SkyDome() {
  const { scene } = useGLTF("/models/Otros/sky.glb");

  useEffect(() => {
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.material.side = THREE.DoubleSide;
        obj.material.depthWrite = false;
        obj.material.needsUpdate = true;
        obj.renderOrder = 0.1;
      }
    });
  }, [scene]);

  return (
    <primitive
      object={scene}
      position={[0, 0, 0]}
      scale={1}
    />
  );
}

// Precarga de modelos

useGLTF.preload("/models/playa.glb");
useGLTF.preload("/models/Otros/sky.glb");

// ─────────────────────────────────────────────────────────
// ESCENA PRINCIPAL
// ─────────────────────────────────────────────────────────

export default function SalaPlaya() {
  const mobileControls = useMobileControls();
  const { isPortrait } = useLandscapeLock();

  const isMobile =
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
      navigator.userAgent
    );

  const showRotatePrompt = isMobile && isPortrait;

  return (
    <>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          position: "fixed",
          inset: 0,

          visibility: showRotatePrompt ? "hidden" : "visible",
          pointerEvents: showRotatePrompt ? "none" : "auto",
        }}
      >
        <Canvas
          style={{
            width: "100%",
            height: "100%",
          }}
          camera={{
            position: [0, 2, 10],
            fov: 60,
          }}
          gl={{
            powerPreference: "high-performance",
            onContextLost: (e) => e.preventDefault(),
          }}
          frameloop={showRotatePrompt ? "never" : "always"}
        >
          {/* Luces */}
          <ambientLight intensity={1.0} />

          <directionalLight
            position={[5, 9, 6]}
            intensity={2}
            castShadow
          />

          {/* Cielo */}
          <SkyDome />

          {/* Playa */}
          <Playa />

       {/* Personaje */}
<PlayerController
  controls={mobileControls}
  startPosition={[0, -0.9, 6.5]}
  floorY={-0.9}
/>

        </Canvas>

        {/* Controles móviles */}
        {isMobile && !showRotatePrompt && (
          <MobileControlsOverlay controls={mobileControls} />
        )}
      </div>

      {/* Mensaje de rotación */}
      {showRotatePrompt && <RotatePrompt />}
    </>
  );
}