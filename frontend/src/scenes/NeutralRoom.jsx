import { Canvas } from "@react-three/fiber";

import PlayerController
from "../components/3d/player/PlayerController";

import MobileControlsOverlay
from "../components/3d/mobile/MobileControlsOverlay";

import { useMobileControls }
from "../components/3d/mobile/useMobileControls";

import RotatePrompt
from "../components/3d/mobile/RotatePrompt";

import { useLandscapeLock }
from "../components/3d/mobile/useLandscapeLock";

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#3d9970" />
    </mesh>
  );
}

export default function NeutralRoom() {
  
  const mobileControls =
    useMobileControls();
  
  const { isPortrait } =
    useLandscapeLock();
  
  const isMobile =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0;

  if (isPortrait) {
    return <RotatePrompt />;
  }

  return (
    <>

      <Canvas
        camera={{
          position: [0, 1, 2],
          fov: 75
        }}
      >

        <ambientLight intensity={1.5} />

        <directionalLight
          position={[5, 10, 5]}
          intensity={2}
        />

        <Ground />

        <PlayerController
          controls={mobileControls}
        />

      </Canvas>

      {
        isMobile && (
          <MobileControlsOverlay
            controls={mobileControls}
          />
        )
      }

    </>
  );
}