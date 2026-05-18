import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useStressRoom } from "../../context/StressRoomContext";

const StressItem = ({ item, avatarRef, isMobile }) => {
  const { collected, openChallenge, challengeOpen } = useStressRoom();
  const meshRef = useRef();
  const alreadyCollected = collected.includes(item.id);

  useFrame((state) => {
    if (!meshRef.current || alreadyCollected) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.position.y = item.position[1] + Math.sin(t * 1.8 + item.id) * 0.25;
    meshRef.current.rotation.y += 0.008;

    if (avatarRef?.current && !challengeOpen && t > 3) {
      const dx = meshRef.current.position.x - avatarRef.current.x;
      const dz = meshRef.current.position.z - avatarRef.current.z;
      if (Math.sqrt(dx * dx + dz * dz) < 2.2) openChallenge(item.id);
    }
  });

  if (alreadyCollected) return null;

  return (
    <group position={item.position}>
      <pointLight color={item.glowColor} intensity={1.2} distance={5} decay={2} />
      <mesh ref={meshRef}>
        <icosahedronGeometry args={[0.45, isMobile ? 0 : 1]} />
        <meshStandardMaterial
          color={item.color} emissive={item.glowColor} emissiveIntensity={0.4}
          roughness={0.3} metalness={0.5}
        />
      </mesh>
      <Html position={[0, 1.1, 0]} center distanceFactor={8} style={{ pointerEvents: "none" }}>
        <div style={{
          background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
          border: `1px solid ${item.color}55`, borderRadius: "10px",
          padding: "4px 10px", color: item.color,
          fontSize: isMobile ? "11px" : "12px", fontWeight: 600,
          whiteSpace: "nowrap", fontFamily: "'Segoe UI', sans-serif",
          boxShadow: `0 0 8px ${item.glowColor}44`,
        }}>
          {item.emoji} {item.title}
        </div>
      </Html>
    </group>
  );
};

export default StressItem;