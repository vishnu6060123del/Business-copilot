import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"
import { createSession, verifyPassword } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json()
    if (!identifier || !password) {
      return NextResponse.json({ error: "Email/phone and password are required." }, { status: 400 })
    }

    const value = String(identifier).trim().toLowerCase()
    const { rows } = await query<Record<string, unknown>>(
      `SELECT * FROM users WHERE LOWER(email) = $1 OR phone = $2 LIMIT 1`,
      [value, String(identifier).trim()],
    )
    const user = rows[0]
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 })
    }

    const ok = await verifyPassword(password, user.password_hash as string)
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 })
    }

    await createSession(user.id as string)
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        vendorId: user.vendor_id ?? undefined,
        email: user.email ?? undefined,
      },
    })
  } catch (err) {
    console.error("[v0] login error:", err)
    return NextResponse.json({ error: "Login failed." }, { status: 500 })
  }
}
