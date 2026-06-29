import { NextResponse, type NextRequest } from "next/server"
import { query } from "@server/db"
import { requireUser } from "@server/auth"
import { genId, mapRequirement } from "@server/mappers"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    await requireUser()
    const r = await req.json()
    if (!r.clientName || !r.title) {
      return NextResponse.json({ error: "Client name and title are required." }, { status: 400 })
    }
    const id = genId("r")
    const today = new Date().toISOString().split("T")[0]
    const { rows } = await query(
      `INSERT INTO requirements (id, client_name, title, description, category, budget, date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        id,
        r.clientName,
        r.title,
        r.description ?? "",
        r.category ?? "General",
        r.budget ?? null,
        r.date || today,
        r.status || "open",
      ],
    )
    return NextResponse.json({ requirement: mapRequirement(rows[0]) })
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    console.error("[v0] create requirement error:", err)
    return NextResponse.json({ error: "Failed to create requirement." }, { status: 500 })
  }
}
