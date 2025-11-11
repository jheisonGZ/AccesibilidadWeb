"use client"

import { useState } from "react"
import { Html } from "@react-three/drei"

export function RelaxZone() {
  const [isActive, setIsActive] = useState(false)

  return (
    <group position={[0, 0.1, -3]}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={() => setIsActive(!isActive)}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = "pointer"
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default"
        }}
      >
        <circleGeometry args={[1.5, 32]} />
        <meshStandardMaterial
          color="#c2e9fb"
          emissive="#c2e9fb"
          emissiveIntensity={isActive ? 0.5 : 0.2}
          transparent
          opacity={0.7}
        />
      </mesh>

      {isActive && (
        <Html center distanceFactor={5}>
          <div className="bg-white rounded-xl shadow-lg p-4 w-[300px] text-center">
            <h3 className="text-lg font-bold text-foreground mb-2">Zona de Relajación</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Respira profundamente y relájate. Estás en un espacio seguro.
            </p>
            <button
              onClick={() => setIsActive(false)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Cerrar
            </button>
          </div>
        </Html>
      )}
    </group>
  )
}
