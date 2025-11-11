"use client"

import { Canvas } from "@react-three/fiber"
import { Environment, Float, Text3D, Center } from "@react-three/drei"
import { LoginForm } from "./login-form"
import { useRef } from "react"
import { useFrame } from "@react-three/fiber"
import type { Mesh, Group } from "three"

function EmotionalHeart({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle pulsing like a heartbeat
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 1
      meshRef.current.scale.setScalar(pulse)
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position}>
        {/* Heart shape using two spheres and a cone */}
        <group>
          <mesh position={[-0.3, 0.3, 0]}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color="#ff6b9d" emissive="#ff6b9d" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0.3, 0.3, 0]}>
            <sphereGeometry args={[0.5, 32, 32]} />
            <meshStandardMaterial color="#ff6b9d" emissive="#ff6b9d" emissiveIntensity={0.3} />
          </mesh>
          <mesh position={[0, -0.2, 0]} rotation={[0, 0, Math.PI]}>
            <coneGeometry args={[0.7, 1.2, 32]} />
            <meshStandardMaterial color="#ff6b9d" emissive="#ff6b9d" emissiveIntensity={0.3} />
          </mesh>
        </group>
      </mesh>
    </Float>
  )
}

function ThoughtBubbles({ position }: { position: [number, number, number] }) {
  const groupRef = useRef<Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.3
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.8}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial color="#a8c0ff" emissive="#6366f1" emissiveIntensity={0.2} transparent opacity={0.7} />
        </mesh>
        <mesh position={[-0.5, -0.6, 0]}>
          <sphereGeometry args={[0.3, 32, 32]} />
          <meshStandardMaterial color="#a8c0ff" emissive="#6366f1" emissiveIntensity={0.2} transparent opacity={0.6} />
        </mesh>
        <mesh position={[-0.7, -1, 0]}>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial color="#a8c0ff" emissive="#6366f1" emissiveIntensity={0.2} transparent opacity={0.5} />
        </mesh>
      </Float>
    </group>
  )
}

function CalmWaves() {
  const meshRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle wave motion
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2
    }
  })

  return (
    <Float speed={0.8} rotationIntensity={0.1} floatIntensity={0.3}>
      <mesh ref={meshRef} position={[3, -1, -3]}>
        <torusGeometry args={[1.2, 0.3, 16, 100]} />
        <meshStandardMaterial color="#8dd3c7" emissive="#8dd3c7" emissiveIntensity={0.3} transparent opacity={0.6} />
      </mesh>
    </Float>
  )
}

function EnergyOrb({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.5
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.7

      // Pulsing energy
      const energy = Math.sin(state.clock.elapsedTime * 3) * 0.2 + 1
      meshRef.current.scale.setScalar(energy)
    }
  })

  return (
    <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef} position={position}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial color="#ffd93d" emissive="#ffd93d" emissiveIntensity={0.5} wireframe />
      </mesh>
    </Float>
  )
}

function BreathingSphere() {
  const meshRef = useRef<Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      // Breathing cycle: 4 seconds in, 4 seconds out
      const breathingCycle = Math.sin(state.clock.elapsedTime * 0.4) * 0.4 + 1
      meshRef.current.scale.setScalar(breathingCycle)

      // @ts-ignore
      if (meshRef.current.material) {
        // @ts-ignore
        meshRef.current.material.emissiveIntensity = breathingCycle * 0.3
      }
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -5]}>
      <sphereGeometry args={[2.5, 32, 32]} />
      <meshStandardMaterial
        color="#c2e9fb"
        emissive="#6366f1"
        emissiveIntensity={0.2}
        transparent
        opacity={0.2}
        wireframe
      />
    </mesh>
  )
}

function FloatingEmotionWords() {
  const groupRef = useRef<Group>(null)

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1
    }
  })

  const emotions = [
    { text: "Calma", position: [-4, 2, -4], color: "#8dd3c7" },
    { text: "Paz", position: [4, 1, -4], color: "#a8c0ff" },
    { text: "Esperanza", position: [0, 3, -5], color: "#ffd93d" },
  ]

  return (
    <group ref={groupRef}>
      {emotions.map((emotion, index) => (
        <Float key={index} speed={1 + index * 0.3} rotationIntensity={0.2} floatIntensity={0.5}>
          <Center position={emotion.position as [number, number, number]}>
            <Text3D font="/fonts/Inter_Bold.json" size={0.3} height={0.1} curveSegments={12}>
              {emotion.text}
              <meshStandardMaterial
                color={emotion.color}
                emissive={emotion.color}
                emissiveIntensity={0.4}
                transparent
                opacity={0.7}
              />
            </Text3D>
          </Center>
        </Float>
      ))}
    </group>
  )
}

export function LoginScene() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-[#a8c0ff] via-[#c2e9fb] to-[#e0c3fc]">
      {/* 3D Canvas Background */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} color="#ff6b9d" />
          <Environment preset="sunset" />

          <EmotionalHeart position={[-3, 1, -2]} />
          <ThoughtBubbles position={[3, 2, -3]} />
          <CalmWaves />
          <EnergyOrb position={[-4, -1, -3]} />
          <BreathingSphere />
          <FloatingEmotionWords />
        </Canvas>
      </div>

      {/* Login Form Overlay */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-[#2d3748] mb-3 tracking-tight">Bienestar Emocional</h1>
            <p className="text-lg text-[#4a5568] font-medium">Universidad del Valle</p>
            <p className="text-sm text-[#718096] mt-2">Espacio seguro para tu salud mental</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
