import { Suspense, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { KeyboardControls, Stars } from "@react-three/drei";
import { Vector3 } from "three";
import StressCharacterController from "./StressCharacterController";
import StressItem from "./StressItem";
import STRESS_ITEMS from "./StressItemsData";

const KEY_MAP = [
  { name: "forward",  keys: ["ArrowUp",    "KeyW"] },
  { name: "backward", keys: ["ArrowDown",  "KeyS"] },
  { name: "left",     keys: ["ArrowLeft",  "KeyA"] },
  { name: "right",    keys: ["ArrowRight", "KeyD"] },
  { name: "run",      keys: ["ShiftLeft",  "ShiftRight"] },
  { name: "jump",     keys: ["Space"] }, 
  
];

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#1a2e3a" roughness={0.9} metalness={0.05} />
    </mesh>
  );
}

function Walls() {
  const W = 28, H = 8;
  return (
    <group>
      {[
        [0, H/2,  W, 0, 0, 0],
        [0, H/2, -W, 0, 0, 0],
        [ W, H/2, 0, 0, Math.PI/2, 0],
        [-W, H/2, 0, 0, Math.PI/2, 0],
      ].map(([x,y,z, rx,ry,rz], i) => (
        <mesh key={i} position={[x,y,z]} rotation={[rx,ry,rz]} visible={false}>
          <boxGeometry args={[W*2, H, 0.5]} />
          <meshStandardMaterial transparent opacity={0} />
        </mesh>
      ))}
    </group>
  );
}

const StressRoom = ({ avatarId, mobileControls, isMobile = false }) => {
  const avatarPosRef = useRef(new Vector3(0, 0, 0));

  return (
    <KeyboardControls map={KEY_MAP}>
      <Canvas
        shadows={!isMobile}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        performance={{ min: 0.5 }}
        camera={{ near: 0.1, far: 300, fov: 60, position: [0, 3, 5] }}
        gl={{ antialias: !isMobile }}
        style={{ width: "100%", height: "100%" }}
      >
        <color attach="background" args={["#0a1628"]} />
        <fog attach="fog" args={["#0a1628", 25, 55]} />
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[8, 12, 6]} intensity={0.9} color="#cce8ff"
          castShadow={!isMobile} shadow-mapSize={[512, 512]}
        />
        {!isMobile && (
          <directionalLight position={[-6, 8, -4]} intensity={0.4} color="#a8d8ff" />
        )}
        <Stars radius={80} depth={30} count={isMobile ? 500 : 1500} factor={3} fade />

        <Suspense fallback={null}>
          <Floor />
          <Walls />
          <StressCharacterController
            avatarId={avatarId}
            avatarPosRef={avatarPosRef}
            mobileControls={mobileControls}
            isMobile={isMobile}
          />
          {STRESS_ITEMS.map((item) => (
            <StressItem key={item.id} item={item} avatarRef={avatarPosRef} isMobile={isMobile} />
          ))}
        </Suspense>
      </Canvas>
    </KeyboardControls>
  );
};

export default StressRoom;