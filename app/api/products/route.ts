import { NextResponse, type NextRequest } from "next/server"
import { query } from "@server/db"
import { requireUser } from "@server/auth"
import { genId, mapProduct } from "@server/mappers"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const p = await req.json()
    // Vendors may only add products to their own catalog.
    if (user.role !== "vendor" || !user.vendorId || user.vendorId !== p.vendorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (!p.name) return NextResponse.json({ error: "Name is required." }, { status: 400 })
    const id = genId("p")
    const { rows } = await query(
      `INSERT INTO products (id, vendor_id, name, description, price, unit, category)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, p.vendorId, p.name, p.description ?? "", p.price ?? 0, p.unit ?? "each", p.category ?? "General"],
    )
    return NextResponse.json({ product: mapProduct(rows[0]) })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    console.error("[v0] create product error:", err)
    return NextResponse.json({ error: "Failed to create product." }, { status: 500 })
  }
}
