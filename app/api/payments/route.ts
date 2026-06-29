import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { genId, mapPayment } from "@/lib/mappers"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser()
    const p = await req.json()
    if (user.role !== "vendor" || !user.vendorId || user.vendorId !== p.vendorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const id = genId("pay")
    const today = new Date().toISOString().split("T")[0]
    const { rows } = await query(
      `INSERT INTO payments (id, vendor_id, amount, date, method, description)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [id, p.vendorId, p.amount ?? 0, p.date || today, p.method ?? "Credit Card", p.description ?? "Payment"],
    )
    return NextResponse.json({ payment: mapPayment(rows[0]) })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    console.error("[v0] create payment error:", err)
    return NextResponse.json({ error: "Failed to create payment." }, { status: 500 })
  }
}
