import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";

function Avatar({ avatar }) {
  // Cambiamos la forma según avatar
  if (avatar === "chibi-2") {
    // Cono
    return (
      <mesh position={[0, 0.5, -1]}>
        <coneGeometry args={[0.4, 1, 32]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    );
  }

  if (avatar === "chibi-3") {
    // Cilindro
    return (
      <mesh position={[0, 0.5, -1]}>
        <cylinderGeometry args={[0.35, 0.35, 1, 32]} />
        <meshStandardMaterial color="skyblue" />
      </mesh>
    );
  }

  // chibi-1 (default): esfera
  return (
    <mesh position={[0, 0.5, -1]}>
      <sphereGeometry args={[0.45, 32, 32]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
}

function Box({ emotion }) {
  const color =
    emotion === "ansiedad" ? "red" : emotion === "estres" ? "yellow" : "green";

  return (
    <mesh position={[0, 0.5, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color="#999" />
    </mesh>
  );
}

export default function BasicRoom() {
  const emotion = localStorage.getItem("emotion") || "neutro";
  const avatar = localStorage.getItem("avatar") || "chibi-1";

  return (
    <Canvas camera={{ position: [3, 2, 3], fov: 50 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      <Box emotion={emotion} />
      <Avatar avatar={avatar} />
      <Ground />

      {/* Etiqueta en 3D (opcional, pero queda genial para demo) */}
      <Text position={[0, 1.6, -1]} fontSize={0.25}>
        {avatar}
      </Text>

      <OrbitControls />
    </Canvas>
  );
}
