"use client"

import { useState, useRef, useEffect } from "react"
import { Html } from "@react-three/drei"
import { useStore } from "@/lib/store"
import { authenticatedFetcher } from "@/lib/api"

const MOODS = ["Estable", "Ansioso", "Tranquilo", "Triste", "Eufórico", "Apático"]

const QUESTIONS = [
  "¿Cómo describirías tu nivel de energía hoy?",
  "¿Has experimentado dificultades para concentrarte?",
  "¿Cómo calificarías tu calidad de sueño reciente?",
  "¿Te sientes conectado con tus compañeros y amigos?",
  "¿Qué tan abrumado te sientes con tus responsabilidades académicas?",
]

export function QuestionnairePanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)
  const [answers, setAnswers] = useState<string[]>(Array(QUESTIONS.length).fill(""))
  const [submitted, setSubmitted] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const { token } = useStore()

  // Focus trap for accessibility
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      const handleTab = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault()
            lastElement?.focus()
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault()
            firstElement?.focus()
          }
        }
        if (e.key === "Escape") {
          setIsOpen(false)
        }
      }

      document.addEventListener("keydown", handleTab)
      firstElement?.focus()

      return () => document.removeEventListener("keydown", handleTab)
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!selectedMood || !token) return

    try {
      await authenticatedFetcher("/api/sessions/save", token, {
        method: "POST",
        body: JSON.stringify({
          questionnaire: {
            mood: selectedMood,
            answers,
            timestamp: Date.now(),
          },
          recommendations: {
            summary: "Recomendaciones personalizadas basadas en tu estado emocional",
            items: [
              "Pausa activa de 3 minutos",
              "Ejercicio de respiración 4-7-8",
              "Contactar con servicios de apoyo EISC",
            ],
          },
        }),
      })

      setSubmitted(true)
      setTimeout(() => {
        setIsOpen(false)
        setSubmitted(false)
        setSelectedMood(null)
        setAnswers(Array(QUESTIONS.length).fill(""))
      }, 2000)
    } catch (err) {
      console.error("Error saving session:", err)
    }
  }

  return (
    <group position={[-3, 1, 0]}>
      <mesh
        onClick={() => setIsOpen(true)}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = "pointer"
        }}
        onPointerOut={() => {
          document.body.style.cursor = "default"
        }}
      >
        <boxGeometry args={[1, 1.5, 0.1]} />
        <meshStandardMaterial color="#6366f1" />
      </mesh>

      {isOpen && (
        <Html center distanceFactor={5}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="questionnaire-title"
            className="bg-white rounded-2xl shadow-2xl p-6 w-[400px] max-h-[600px] overflow-y-auto"
            style={{ transform: "translate(-50%, -50%)" }}
          >
            {!submitted ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h2 id="questionnaire-title" className="text-2xl font-bold text-foreground">
                    ¿Cómo te sientes hoy?
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Cerrar cuestionario"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-3">Selecciona tu estado emocional:</label>
                    <div className="flex flex-wrap gap-2">
                      {MOODS.map((mood) => (
                        <button
                          key={mood}
                          onClick={() => setSelectedMood(mood)}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                            selectedMood === mood
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-secondary"
                          }`}
                          aria-pressed={selectedMood === mood}
                        >
                          {mood}
                        </button>
                      ))}
                    </div>
                  </div>

                  {QUESTIONS.map((question, index) => (
                    <div key={index}>
                      <label htmlFor={`question-${index}`} className="block text-sm font-medium mb-2">
                        {question}
                      </label>
                      <input
                        id={`question-${index}`}
                        type="text"
                        value={answers[index]}
                        onChange={(e) => {
                          const newAnswers = [...answers]
                          newAnswers[index] = e.target.value
                          setAnswers(newAnswers)
                        }}
                        className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Tu respuesta..."
                      />
                    </div>
                  ))}

                  <button
                    onClick={handleSubmit}
                    disabled={!selectedMood}
                    className="w-full px-6 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Enviar
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">✓</div>
                <h3 className="text-xl font-bold text-foreground mb-2">¡Guardado!</h3>
                <p className="text-muted-foreground">Tus respuestas han sido registradas</p>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}
