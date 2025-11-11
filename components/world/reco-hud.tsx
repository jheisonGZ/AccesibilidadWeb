"use client"

import { Html } from "@react-three/drei"

const RECOMMENDATIONS = [
  "Pausa activa de 3 minutos",
  "Ejercicio de respiración 4-7-8",
  "Contactar servicios de apoyo EISC",
  "Meditación guiada de 5 minutos",
]

export function RecoHUD() {
  return (
    <Html fullscreen>
      <div className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-4 max-w-md pointer-events-auto">
          <h3 className="text-lg font-bold text-foreground mb-3">Recomendaciones para ti</h3>
          <ul className="space-y-2">
            {RECOMMENDATIONS.map((rec, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Html>
  )
}
