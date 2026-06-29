import { NextResponse, type NextRequest } from "next/server"
import { query } from "@server/db"
import { requireUser } from "@server/auth"

export const dynamic = "force-dynamic"

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUser()
    const { id } = await params
    const { rowCount } = await query(`DELETE FROM contracts WHERE id = $1`, [id])
    return NextResponse.json({ deleted: (rowCount ?? 0) > 0 })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    console.error("[v0] delete contract error:", err)
    return NextResponse.json({ error: "Failed to delete contract." }, { status: 500 })
  }
}
