import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const loginSchema = z.object({
  email: z.string().email().endsWith("@correounivalle.edu.co", {
    message: "Debe usar un correo institucional @correounivalle.edu.co",
  }),
  password: z.string().optional(),
})

// Mock user storage (in-memory for demo)
const mockUsers = new Map<string, { email: string; hasAvatar: boolean }>()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = loginSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: result.error.errors[0].message }, { status: 400 })
    }

    const { email } = result.data

    // Check if user exists or create new one
    let user = mockUsers.get(email)
    if (!user) {
      user = { email, hasAvatar: false }
      mockUsers.set(email, user)
    }

    // Generate simple mock token (in production, use proper JWT)
    const token = Buffer.from(JSON.stringify({ email, timestamp: Date.now() })).toString("base64")

    return NextResponse.json({
      token,
      email: user.email,
      hasAvatar: user.hasAvatar,
    })
  } catch (error) {
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
