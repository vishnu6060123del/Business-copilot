import { NextResponse, type NextRequest } from "next/server"
import { query } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import { mapRequirement } from "@/lib/mappers"

export const dynamic = "force-dynamic"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser()
    const { id } = await params
    const { status, title, description, category, budget } = await req.json()
    const { rows } = await query(
      `UPDATE requirements SET
         status = COALESCE($2, status),
         title = COALESCE($3, title),
         description = COALESCE($4, description),
         category = COALESCE($5, category),
         budget = COALESCE($6, budget)
       WHERE id = $1 RETURNING *`,
      [id, status ?? null, title ?? null, description ?? null, category ?? null, budget ?? null],
    )
    if (!rows.length) return NextResponse.json({ error: "Requirement not found." }, { status: 404 })
    return NextResponse.json({ requirement: mapRequirement(rows[0]) })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    console.error("[v0] update requirement error:", err)
    return NextResponse.json({ error: "Failed to update requirement." }, { status: 500 })
  }
}
