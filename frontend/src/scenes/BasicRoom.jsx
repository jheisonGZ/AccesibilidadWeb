// ─────────────────────────────────────────────────────────────────────────────
// BasicRoom.jsx — src/scenes/BasicRoom.jsx
// El audio ambiental lo maneja Scene.jsx
// ─────────────────────────────────────────────────────────────────────────────

import { Canvas }   from "@react-three/fiber";
import { useGLTF }  from "@react-three/drei";
import { useEffect, useState } from "react";

import Mariposa     from "../components/Mariposa";
import RotatePrompt from "../components/3d/mobile/RotatePrompt";

// ── Sub-componentes 3D ────────────────────────────────────────────────────────

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
  return <primitive object={scene} scale={0.01} position={[0, -1, 0]} />;
}

useGLTF.preload("/models/hombre.glb");

// ── Componente principal ──────────────────────────────────────────────────────

export default function BasicRoom() {
  const [dimensions, setDimensions] = useState({
    width:  window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => setDimensions({
      width:  window.innerWidth,
      height: window.innerHeight,
    });
    window.addEventListener("resize",            handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize",            handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  const isMobile =
    "ontouchstart" in window     ||
    navigator.maxTouchPoints > 0 ||
    dimensions.width <= 768;

  const isPortrait = dimensions.height > dimensions.width;

  if (isMobile && isPortrait) return <RotatePrompt />;

  return (
    <div style={{ position: "fixed", inset: 0, width: "100%", height: "100dvh", overflow: "hidden" }}>
      <Canvas
        style={{ width: "100%", height: "100%" }}
        camera={{ position: [0, 3, 6], fov: 60 }}
        gl={{
          powerPreference: "high-performance",
          antialias:       false,
          onContextLost:   (e) => e.preventDefault(),
        }}
      >
        <ambientLight     intensity={1.5} />
        <directionalLight position={[5, 10, 5]} intensity={2} />
        <pointLight       position={[0,  2,  2]} intensity={1} />
        <Ground />
        <Avatar />
        <Mariposa position={[0, 2, 0]} scale={1} />
      </Canvas>
    </div>
  );
}