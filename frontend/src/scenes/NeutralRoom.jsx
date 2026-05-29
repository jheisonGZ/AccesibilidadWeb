import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useEffect } from "react";

import PlayerController from "../components/3d/player/PlayerController";
import MobileControlsOverlay from "../components/3d/mobile/MobileControlsOverlay";
import RotatePrompt from "../components/3d/mobile/RotatePrompt";
import { useMobileControls } from "../components/3d/mobile/useMobileControls";
import { useLandscapeLock } from "../components/3d/mobile/useLandscapeLock";

function Escenario() {
  const { scene } = useGLTF("/models/escenario1.glb");
  return (
    <primitive
      object={scene}
      position={[-7, -5.0, -54]}
      rotation={[0, -2.45, 0.098]}
      scale={1}
      receiveShadow
      castShadow
    />
  );
}

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

useGLTF.preload("/models/escenario1.glb");
useGLTF.preload("/models/Otros/sky.glb");

export default function NeutralRoom() {
  const mobileControls = useMobileControls();
  const { isPortrait } = useLandscapeLock();

  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  const showRotatePrompt = isMobile && isPortrait;

  return (
    <>
      <div style={{
        width: "100vw", height: "100vh",
        overflow: "hidden", position: "fixed", inset: 0,
        visibility: showRotatePrompt ? "hidden" : "visible",
        pointerEvents: showRotatePrompt ? "none" : "auto",
      }}>
        <Canvas
          style={{ width: "100%", height: "100%" }}
          camera={{ position: [0, 2, 10], fov: 60 }}
          gl={{ powerPreference: "high-performance", onContextLost: (e) => e.preventDefault() }}
          frameloop={showRotatePrompt ? "never" : "always"}
        >
          <ambientLight intensity={1.0} />
          <directionalLight position={[5, 9, 6]} intensity={2} castShadow />
          <SkyDome />
          <Escenario />
          <PlayerController controls={mobileControls} />
        </Canvas>

        {isMobile && !showRotatePrompt && (
          <MobileControlsOverlay controls={mobileControls} />
        )}
      </div>
      {showRotatePrompt && <RotatePrompt />}
    </>
  );
}