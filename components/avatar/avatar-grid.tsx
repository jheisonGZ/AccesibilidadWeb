"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStore } from "@/lib/store"
import { authenticatedFetcher } from "@/lib/api"

const AVATARS = [
  { id: "robot", name: "Robot", url: "/avatars/robot.glb", preview: "/friendly-robot-avatar.png" },
  { id: "astronaut", name: "Astronauta", url: "/avatars/astronaut.glb", preview: "/astronaut-avatar.jpg" },
  { id: "scientist", name: "Científico", url: "/avatars/scientist.glb", preview: "/scientist-avatar.png" },
  { id: "student", name: "Estudiante", url: "/avatars/student.glb", preview: "/student-avatar.png" },
  { id: "explorer", name: "Explorador", url: "/avatars/explorer.glb", preview: "/explorer-avatar.png" },
  { id: "artist", name: "Artista", url: "/avatars/artist.glb", preview: "/artist-avatar.png" },
]

export function AvatarGrid() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { token, setAvatarUrl } = useStore()

  const handleSelect = async (avatar: (typeof AVATARS)[0]) => {
    if (!token) return

    setLoading(true)
    try {
      await authenticatedFetcher("/api/avatars/select", token, {
        method: "POST",
        body: JSON.stringify({ avatarUrl: avatar.url }),
      })

      setAvatarUrl(avatar.url)
      router.push("/world")
    } catch (err) {
      console.error("Error selecting avatar:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {AVATARS.map((avatar) => (
        <Card
          key={avatar.id}
          glass
          className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
            selectedId === avatar.id ? "ring-4 ring-primary" : ""
          }`}
          onClick={() => setSelectedId(avatar.id)}
          role="button"
          tabIndex={0}
          aria-label={`Seleccionar avatar ${avatar.name}`}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setSelectedId(avatar.id)
            }
          }}
        >
          <div className="aspect-square mb-4 rounded-xl overflow-hidden bg-muted">
            <img
              src={avatar.preview || "/placeholder.svg"}
              alt={`Avatar ${avatar.name}`}
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-xl font-semibold text-center mb-4">{avatar.name}</h3>
          <Button
            variant={selectedId === avatar.id ? "primary" : "secondary"}
            className="w-full"
            onClick={(e) => {
              e.stopPropagation()
              handleSelect(avatar)
            }}
            disabled={loading}
          >
            {loading && selectedId === avatar.id ? "Seleccionando..." : "Seleccionar"}
          </Button>
        </Card>
      ))}
    </div>
  )
}
