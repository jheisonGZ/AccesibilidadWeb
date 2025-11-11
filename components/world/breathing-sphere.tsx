"use client"

import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Mesh } from "three"

export function BreathingSphere() {
  const meshRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      // Breathing animation: expand and contract
      const breathingCycle = Math.sin(state.clock.elapsedTime * 0.5) * 0.2 + 1
      meshRef.current.scale.setScalar(breathingCycle)
    }
  })

  return (
    <mesh ref={meshRef} position={[3, 1, 0]} castShadow>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.3} transparent opacity={0.8} />
    </mesh>
  )
}
