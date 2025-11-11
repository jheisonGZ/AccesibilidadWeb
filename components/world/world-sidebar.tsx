"use client"

import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"

const ACTIONS = [
  { id: "questionnaire", label: "Cuestionario", icon: "📋" },
  { id: "breathing", label: "Respiración", icon: "🫁" },
  { id: "relaxation", label: "Relajación", icon: "🧘" },
  { id: "recommendations", label: "Recomendaciones", icon: "💡" },
]

export function WorldSidebar() {
  const router = useRouter()
  const { logout } = useStore()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
      {ACTIONS.map((action) => (
        <button
          key={action.id}
          className="bg-white/90 backdrop-blur-sm hover:bg-white rounded-xl p-4 shadow-lg transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
          aria-label={action.label}
          title={action.label}
        >
          <div className="text-2xl mb-1">{action.icon}</div>
          <div className="text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {action.label}
          </div>
        </button>
      ))}

      <div className="h-px bg-border my-2" />

      <button
        onClick={handleLogout}
        className="bg-white/90 backdrop-blur-sm hover:bg-red-50 rounded-xl p-4 shadow-lg transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group"
        aria-label="Salir"
        title="Salir"
      >
        <div className="text-2xl mb-1">🚪</div>
        <div className="text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          Salir
        </div>
      </button>
    </div>
  )
}
