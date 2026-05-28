import { Canvas } from "@react-three/fiber";
import { Sky } from "@react-three/drei";

import PlayerController from "../components/3d/player/PlayerController";
import MobileControlsOverlay from "../components/3d/mobile/MobileControlsOverlay";
import { useMobileControls } from "../components/3d/mobile/useMobileControls";
import RotatePrompt from "../components/3d/mobile/RotatePrompt";
import { useLandscapeLock } from "../components/3d/mobile/useLandscapeLock";

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#3d9970" />
    </mesh>
  );
}

function Walls() {
  const grosor = 0.2;
  const alto   = 3;
  const mitad  = 5;

  return (
    <>
      <mesh name="pared" position={[0, alto / 2, -mitad]} visible={false}>
        <boxGeometry args={[10 + grosor, alto, grosor]} />
        <meshStandardMaterial />
      </mesh>
      <mesh name="pared" position={[0, alto / 2, mitad]} visible={false}>
        <boxGeometry args={[10 + grosor, alto, grosor]} />
        <meshStandardMaterial />
      </mesh>
      <mesh name="pared" position={[-mitad, alto / 2, 0]} visible={false}>
        <boxGeometry args={[grosor, alto, 10 + grosor]} />
        <meshStandardMaterial />
      </mesh>
      <mesh name="pared" position={[mitad, alto / 2, 0]} visible={false}>
        <boxGeometry args={[grosor, alto, 10 + grosor]} />
        <meshStandardMaterial />
      </mesh>
    </>
  );
}

export default function NeutralRoom() {
  const mobileControls        = useMobileControls();
  const { isPortrait }        = useLandscapeLock();
  const isMobile              = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const showRotatePrompt      = isMobile && isPortrait;

  return (
    <>
      {/* ✅ Canvas SIEMPRE montado — nunca se destruye el contexto WebGL */}
      <div
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          position: "fixed",
          inset: 0,
          // Ocultar visualmente pero mantener en el DOM
          visibility: showRotatePrompt ? "hidden" : "visible",
          pointerEvents: showRotatePrompt ? "none" : "auto",
        }}
      >
        <Canvas
          style={{ width: "100%", height: "100%" }}
          camera={{ position: [0, 2.5, 3.5], fov: 60 }}
          gl={{
            powerPreference: "high-performance",
            // ✅ Recuperación automática si el navegador suspende el contexto
            onContextLost: (e) => e.preventDefault(),
          }}
          frameloop={showRotatePrompt ? "never" : "always"} // ✅ pausa el render loop en portrait
        >
          <ambientLight intensity={1.0} />
          <Sky sunPosition={[100, 20, 100]} />
          <directionalLight position={[5, 10, 5]} intensity={2} castShadow />

          <Ground />
          <Walls />

          <PlayerController controls={mobileControls} />
        </Canvas>

        {isMobile && !showRotatePrompt && (
          <MobileControlsOverlay controls={mobileControls} />
        )}
      </div>

      {/* RotatePrompt encima, sin afectar el Canvas */}
      {showRotatePrompt && <RotatePrompt />}
    </>
  );
}