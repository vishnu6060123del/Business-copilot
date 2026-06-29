import { NextResponse, type NextRequest } from "next/server"
import { query } from "@server/db"
import { requireUser } from "@server/auth"
import { genId, mapContract } from "@server/mappers"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    await requireUser()
    const c = await req.json()
    if (!c.vendorId) return NextResponse.json({ error: "vendorId is required." }, { status: 400 })

    // App-layer referential integrity (DSQL has no foreign keys).
    const vendor = await query(`SELECT id FROM vendors WHERE id = $1`, [c.vendorId])
    if (!vendor.rows.length) return NextResponse.json({ error: "Vendor not found." }, { status: 400 })

    const id = genId("c")
    const today = new Date().toISOString().split("T")[0]
    const { rows } = await query(
      `INSERT INTO contracts (id, vendor_id, value, start_date, end_date, payment_terms, category, title)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        id,
        c.vendorId,
        c.value ?? 0,
        c.startDate || today,
        c.endDate || today,
        c.paymentTerms || "Net 30",
        c.category || "Professional Services",
        c.title || "New Contract",
      ],
    )
    return NextResponse.json({ contract: mapContract(rows[0]) })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    console.error("[v0] create contract error:", err)
    return NextResponse.json({ error: "Failed to create contract." }, { status: 500 })
  }
}
