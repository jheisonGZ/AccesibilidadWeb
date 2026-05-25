import { Canvas } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";

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