import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useEffect } from "react";

import PlayerController from "../components/3d/player/PlayerController";
import MobileControlsOverlay from "../components/3d/mobile/MobileControlsOverlay";
import RotatePrompt from "../components/3d/mobile/RotatePrompt";
import { useMobileControls } from "../components/3d/mobile/useMobileControls";
import { useLandscapeLock } from "../components/3d/mobile/useLandscapeLock";

function SkyDome() {
  const { scene } = useGLTF("/models/Otros/sky.glb");
  useEffect(() => {
    useGLTF.preload("/models/Otros/sky.glb");
    scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.material.side = THREE.DoubleSide;
        obj.material.depthWrite = false;
        obj.material.needsUpdate = true;
        obj.renderOrder = 0.1;
      }
    });
  }, [scene]);
  return <primitive object={scene} position={[0, 0, 0]} scale={1} />;
}



export default function SalaIsla() {
  const mobileControls = useMobileControls();
  const { isPortrait } = useLandscapeLock();

  const isMobile =
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
  const showRotatePrompt = isMobile && isPortrait;

  return (
    <>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          position: "absolute",
          inset: 0,
          visibility: showRotatePrompt ? "hidden" : "visible",
          pointerEvents: showRotatePrompt ? "none" : "auto",
        }}
      >
        <Canvas
          style={{ width: "100%", height: "100%" }}
          camera={{ position: [0, 2, 10], fov: 60 }}
          gl={{
            powerPreference: "high-performance",
          }}
          frameloop={showRotatePrompt ? "never" : "always"}
        >
          <ambientLight intensity={1.0} />
          <directionalLight position={[5, 9, 6]} intensity={2} castShadow />
          <SkyDome />
          {/* 🏝️ Placeholder — isla.glb va aquí */}
          <PlayerController controls={mobileControls} />
        </Canvas>

        {/* Cartel temporal */}
        <div style={{
          position: "absolute",
          bottom: 80,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(10,8,20,0.75)",
          border: "1px solid #a855f7",
          borderRadius: 16,
          padding: "10px 24px",
          color: "#c084fc",
          fontSize: 13,
          fontFamily: "'Segoe UI', sans-serif",
          backdropFilter: "blur(8px)",
          zIndex: 100,
        }}>
          🏝️ Isla de las Estrellas — próximamente
        </div>

        {isMobile && !showRotatePrompt && (
          <MobileControlsOverlay controls={mobileControls} />
        )}
      </div>
      {showRotatePrompt && <RotatePrompt />}
    </>
  );
}