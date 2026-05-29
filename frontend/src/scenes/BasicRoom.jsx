import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useEffect, useState } from "react";

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

useGLTF.preload("/models/hombre.glb");

export default function BasicRoom() {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const update = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  const isMobile =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    dimensions.width <= 768;

  const isPortrait = dimensions.height > dimensions.width;

  if (isMobile && isPortrait) {
    return <RotatePrompt />;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100dvh", // dynamic viewport height — excluye barra del browser
        overflow: "hidden",
      }}
    >
      <Canvas
        style={{ width: "100%", height: "100%" }}
        camera={{ position: [0, 3, 6], fov: 60 }}
        gl={{ powerPreference: "high-performance", onContextLost: (e) => e.preventDefault() }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[5, 10, 5]} intensity={2} />
        <Ground />
        <Avatar />
      </Canvas>
    </div>
  );
}