import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const selectAvatarSchema = z.object({
  avatarUrl: z.string().url(),
})

// Mock storage for avatar selections
const avatarSelections = new Map<string, string>()
const mockUsers = new Map<string, { email: string; hasAvatar: boolean }>()

function getUserFromToken(token: string): string | null {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64").toString())
    return decoded.email
  } catch {
    return null
  }
}

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
    const result = selectAvatarSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ error: "URL de avatar inválida" }, { status: 400 })
    }

    const { avatarUrl } = result.data

    // Store avatar selection
    avatarSelections.set(email, avatarUrl)

    // Update user hasAvatar flag
    const user = mockUsers.get(email)
    if (user) {
      user.hasAvatar = true
    }

    return NextResponse.json({ ok: true, avatarUrl })
  } catch (error) {
    return NextResponse.json({ error: "Error al guardar avatar" }, { status: 500 })
  }
}
