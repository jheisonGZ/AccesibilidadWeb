import { Canvas } from "@react-three/fiber";
import { Sky } from "@react-three/drei";

import PlayerController from "../components/3d/player/PlayerController";
import MobileControlsOverlay from "../components/3d/mobile/MobileControlsOverlay";
import { useMobileControls } from "../components/3d/mobile/useMobileControls";
import RotatePrompt from "../components/3d/mobile/RotatePrompt";
import { useLandscapeLock } from "../components/3d/mobile/useLandscapeLock";

function Ground() { //s
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#3d9970" />
    </mesh>
  );
}

export default function NeutralRoom() {
  const mobileControls = useMobileControls();
  const { isPortrait } = useLandscapeLock();
  const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  if (isPortrait) {
    return <RotatePrompt />;
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "fixed",
        inset: 0,
      }}
    >
      <Canvas
        style={{ width: "100%", height: "100%" }}
        camera={{ position: [0, 1, 2], fov: 75 }}
      >
        <ambientLight intensity={1.5} />

        <Sky sunPosition={[100, 20, 100]} />

        <directionalLight position={[5, 10, 5]} intensity={2} />

        <Ground />

        <PlayerController controls={mobileControls} />
      </Canvas>

      {isMobile && <MobileControlsOverlay controls={mobileControls} />}
    </div>
  );
}