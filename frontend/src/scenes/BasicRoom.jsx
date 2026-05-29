import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

import RotatePrompt from "../components/3d/mobile/RotatePrompt";

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#3d9970" />
    </mesh>
  );
}

function Avatar() {
  const { scene } = useGLTF("/models/hombre.glb");

  return (
    <primitive
      object={scene}
      scale={0.01}
      position={[0, -1, 0]}
    />
  );
}

export default function BasicRoom() {

  // ✅ detectar móvil inmediatamente
  const isMobile =
    typeof window !== "undefined" &&
    (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.innerWidth <= 768
    );

  // ✅ detectar orientación
  const isPortrait =
  typeof window !== "undefined" &&
  window.innerHeight > window.innerWidth;

  // ✅ NO montar el Canvas si está vertical
  if (isMobile && isPortrait) {
    return <RotatePrompt />;
  }

  return (
    <Canvas camera={{ position: [0, 3, 6], fov: 60 }}>

      <ambientLight intensity={1.5} />

      <directionalLight
        position={[5, 10, 5]}
        intensity={2}
      />

      <Ground />

      <Avatar />

    </Canvas>
  );
}