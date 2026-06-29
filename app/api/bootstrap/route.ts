import { NextResponse } from "next/server"
import { query } from "@/lib/db"
import { requireUser } from "@/lib/auth"
import {
  mapContract,
  mapPayment,
  mapProduct,
  mapRequirement,
  mapSpend,
  mapSubscription,
  mapVendor,
} from "@/lib/mappers"

export const dynamic = "force-dynamic"

// Returns the full dataset used to hydrate the client-side cache after login.
export async function GET() {
  try {
    await requireUser()
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [vendors, contracts, spend, products, requirements, subscriptions, payments] = await Promise.all([
      query(`SELECT * FROM vendors`),
      query(`SELECT * FROM contracts`),
      query(`SELECT * FROM spend`),
      query(`SELECT * FROM products`),
      query(`SELECT * FROM requirements`),
      query(`SELECT * FROM subscriptions`),
      query(`SELECT * FROM payments`),
    ])

    return NextResponse.json({
      vendors: vendors.rows.map(mapVendor),
      contracts: contracts.rows.map(mapContract),
      spend: spend.rows.map(mapSpend),
      products: products.rows.map(mapProduct),
      requirements: requirements.rows.map(mapRequirement),
      subscriptions: subscriptions.rows.map(mapSubscription),
      payments: payments.rows.map(mapPayment),
    })
  } catch (err) {
    console.error("[v0] bootstrap error:", err)
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 })
  }
}
