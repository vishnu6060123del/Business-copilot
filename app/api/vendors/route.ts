import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { genId, mapVendor } from "@/lib/mappers"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    await requireUser()
    const { name, rating, category } = await req.json()
    if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 })
    const id = genId("v")
    const { rows } = await query(
      `INSERT INTO vendors (id, name, rating, category) VALUES ($1,$2,$3,$4) RETURNING *`,
      [id, name, rating ?? 4.0, category ?? "General"],
    )
    return NextResponse.json({ vendor: mapVendor(rows[0]) })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    console.error("[v0] create vendor error:", err)
    return NextResponse.json({ error: "Failed to create vendor." }, { status: 500 })
  }
}
