import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { mapVendor } from "@/lib/mappers"

export const dynamic = "force-dynamic"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    // Vendors may only edit their own profile; clients cannot edit vendor records.
    if (user.role !== "vendor" || user.vendorId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { name, rating, category } = await req.json()
    const { rows } = await query(
      `UPDATE vendors SET name = COALESCE($2, name), rating = COALESCE($3, rating), category = COALESCE($4, category)
       WHERE id = $1 RETURNING *`,
      [id, name ?? null, rating ?? null, category ?? null],
    )
    if (!rows.length) return NextResponse.json({ error: "Vendor not found." }, { status: 404 })
    return NextResponse.json({ vendor: mapVendor(rows[0]) })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    console.error("[v0] update vendor error:", err)
    return NextResponse.json({ error: "Failed to update vendor." }, { status: 500 })
  }
}
