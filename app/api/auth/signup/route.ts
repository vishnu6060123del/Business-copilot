import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"
import { createSession, hashPassword } from "@/lib/auth"
import { genId } from "@/lib/mappers"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, password, role } = body
    const identifierType: "email" | "phone" = body.identifierType === "phone" ? "phone" : "email"
    const identifier = String(body.identifier ?? "").trim()
    let vendorId: string | null = role === "vendor" ? (body.vendorId ?? null) : null

    if (!name || !password || !identifier) {
      return NextResponse.json({ error: "Name, contact, and password are required." }, { status: 400 })
    }
    if (String(password).length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 })
    }
    if (role !== "vendor" && role !== "client") {
      return NextResponse.json({ error: "Invalid role." }, { status: 400 })
    }
    if (role === "vendor" && !vendorId) {
      return NextResponse.json({ error: "Please select your vendor profile." }, { status: 400 })
    }

    const email = identifierType === "email" ? identifier.toLowerCase() : null
    const phone = identifierType === "phone" ? identifier : null

    // Uniqueness check (no DB unique constraint in DSQL flow — enforce in app).
    const existing = await query(
      `SELECT id FROM users WHERE ($1::text IS NOT NULL AND LOWER(email) = $1) OR ($2::text IS NOT NULL AND phone = $2) LIMIT 1`,
      [email, phone],
    )
    if (existing.rows.length) {
      return NextResponse.json({ error: "An account with this email/phone already exists." }, { status: 409 })
    }

    // Validate vendor exists when registering as a vendor.
    if (role === "vendor" && vendorId) {
      const v = await query(`SELECT id FROM vendors WHERE id = $1`, [vendorId])
      if (!v.rows.length) {
        return NextResponse.json({ error: "Selected vendor profile not found." }, { status: 400 })
      }
    } else {
      vendorId = null
    }

    const id = genId("u")
    const passwordHash = await hashPassword(String(password))
    await query(
      `INSERT INTO users (id, email, phone, name, role, vendor_id, password_hash) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [id, email, phone, String(name).trim(), role, vendorId, passwordHash],
    )

    await createSession(id)
    return NextResponse.json({
      user: { id, name: String(name).trim(), role, vendorId: vendorId ?? undefined, email: email ?? undefined },
    })
  } catch (err) {
    console.error("[v0] signup error:", err)
    return NextResponse.json({ error: "Sign up failed." }, { status: 500 })
  }
}
