"use client"

import { useGLTF } from "@react-three/drei"
import { useEffect } from "react"

interface AvatarModelProps {
  url: string
}

export function AvatarModel({ url }: AvatarModelProps) {
  // TODO: Integrate Ready Player Me for custom avatars
  // For now, using placeholder GLTF models

  useEffect(() => {
    // Preload the model
    useGLTF.preload(url)
  }, [url])

  // Fallback to a simple box if model fails to load
  return (
    <mesh position={[2, 1, 0]} castShadow>
      <boxGeometry args={[0.5, 1.5, 0.5]} />
      <meshStandardMaterial color="#6366f1" />
    </mesh>
  )
}
