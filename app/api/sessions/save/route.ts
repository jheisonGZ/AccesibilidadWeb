import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const sessionSchema = z.object({
  questionnaire: z.object({
    mood: z.string(),
    answers: z.array(z.string()),
    timestamp: z.number(),
  }),
  recommendations: z.object({
    summary: z.string(),
    items: z.array(z.string()),
  }),
})

function getUserFromToken(token: string): string | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString())
    return decoded.email
  } catch {
    return null
  }
}

// Mock storage for sessions
const sessions = new Map<string, any[]>()

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const email = getUserFromToken(token)

    if (!email) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const body = await request.json()
    const result = sessionSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: "Datos de sesión inválidos" }, { status: 400 })
    }

    // Store session
    const userSessions = sessions.get(email) || []
    userSessions.push(result.data)
    sessions.set(email, userSessions)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar sesión" }, { status: 500 })
  }
}
