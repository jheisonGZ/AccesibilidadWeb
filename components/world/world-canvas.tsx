"use client"

import { Canvas } from "@react-three/fiber"
import { Environment, OrbitControls } from "@react-three/drei"
import { AvatarModel } from "./avatar-model"
import { BreathingSphere } from "./breathing-sphere"
import { QuestionnairePanel } from "./questionnaire-panel"
import { RelaxZone } from "./relax-zone"
import { RecoHUD } from "./reco-hud"

interface WorldCanvasProps {
  avatarUrl: string
}

export function WorldCanvas({ avatarUrl }: WorldCanvasProps) {
  return (
    <Canvas camera={{ position: [0, 2.5, 6], fov: 50 }} className="w-full h-full">
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <Environment preset="sunset" />

      <AvatarModel url={avatarUrl} />
      <BreathingSphere />
      <QuestionnairePanel />
      <RelaxZone />
      <RecoHUD />

      <OrbitControls enablePan={false} minDistance={3} maxDistance={10} maxPolarAngle={Math.PI / 2} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e0e7ff" />
      </mesh>
    </Canvas>
  )
}
