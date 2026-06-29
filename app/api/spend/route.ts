import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { genId, mapSpend } from "@/lib/mappers"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    await requireUser()
    const s = await req.json()
    if (!s.vendorId) return NextResponse.json({ error: "vendorId is required." }, { status: 400 })
    const id = genId("s")
    const today = new Date().toISOString().split("T")[0]
    const { rows } = await query(
      `INSERT INTO spend (id, vendor_id, amount, date, category) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [id, s.vendorId, s.amount ?? 0, s.date || today, s.category ?? "General"],
    )
    return NextResponse.json({ spend: mapSpend(rows[0]) })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    console.error("[v0] create spend error:", err)
    return NextResponse.json({ error: "Failed to create spend." }, { status: 500 })
  }
}
