import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"
import { requireUser } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser()
    const { id } = await params
    if (user.role !== "vendor" || !user.vendorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    // Scope deletion to the vendor's own products.
    const { rowCount } = await query(`DELETE FROM products WHERE id = $1 AND vendor_id = $2`, [id, user.vendorId])
    return NextResponse.json({ deleted: (rowCount ?? 0) > 0 })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    console.error("[v0] delete product error:", err)
    return NextResponse.json({ error: "Failed to delete product." }, { status: 500 })
  }
}
