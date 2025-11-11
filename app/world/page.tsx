"use client"

import { WorldCanvas } from "@/components/world/world-canvas"
import { WorldSidebar } from "@/components/world/world-sidebar"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function WorldPage() {
  const { token, avatarUrl } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (!token) {
      router.push("/")
    }
  }, [token, router])

  if (!token) {
    return null
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <WorldCanvas avatarUrl={avatarUrl || "/avatars/robot.glb"} />
      <WorldSidebar />
    </div>
  )
}
