import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { mapVendor } from "@/lib/mappers"

export const dynamic = "force-dynamic"

// Public vendor list used to populate the vendor dropdown on the signup screen.
export async function GET() {
  try {
    const { rows } = await query(`SELECT id, name, rating, category FROM vendors ORDER BY name`)
    return NextResponse.json({ vendors: rows.map(mapVendor) })
  } catch (err) {
    console.error("[v0] public vendors error:", err)
    return NextResponse.json({ vendors: [] }, { status: 500 })
  }
}
