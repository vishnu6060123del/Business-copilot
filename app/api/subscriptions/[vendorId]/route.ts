import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { mapSubscription } from "@/lib/mappers"

export const dynamic = "force-dynamic"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ vendorId: string }> }) {
  try {
    const user = await requireUser()
    const { vendorId } = await params
    if (user.role !== "vendor" || user.vendorId !== vendorId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const { plan, price, status, renewDate } = await req.json()
    const { rows } = await query(
      `UPDATE subscriptions SET
         plan = COALESCE($2, plan),
         price = COALESCE($3, price),
         status = COALESCE($4, status),
         renew_date = COALESCE($5, renew_date)
       WHERE vendor_id = $1 RETURNING *`,
      [vendorId, plan ?? null, price ?? null, status ?? null, renewDate ?? null],
    )
    if (!rows.length) return NextResponse.json({ error: "Subscription not found." }, { status: 404 })
    return NextResponse.json({ subscription: mapSubscription(rows[0]) })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    console.error("[v0] update subscription error:", err)
    return NextResponse.json({ error: "Failed to update subscription." }, { status: 500 })
  }
}
