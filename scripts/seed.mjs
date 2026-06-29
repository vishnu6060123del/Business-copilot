// Seeds Aurora DSQL with procurement demo data + demo user accounts.
import { randomBytes, scryptSync } from "node:crypto"
import { pool, exec } from "./db.mjs"

// ---- helpers ----------------------------------------------------------------
function id(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-3)}`
}
function pad(n) {
  return String(n).padStart(2, "0")
}
function iso(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function monthsAgo(n) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return iso(d)
}
function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return iso(d)
}
function firstOfMonthAgo(n) {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - n)
  return iso(d)
}
function hashPassword(password) {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(password, salt, 64).toString("hex")
  return `scrypt$${salt}$${hash}`
}

// ---- data -------------------------------------------------------------------
const vendors = [
  { id: "v_acme", name: "Acme Office Supplies", rating: 4.2, category: "Office Supplies" },
  { id: "v_techgiant", name: "TechGiant IT", rating: 4.5, category: "Technology" },
  { id: "v_globallog", name: "Global Logistics Inc", rating: 3.9, category: "Logistics" },
  { id: "v_greenenergy", name: "GreenEnergy Utilities", rating: 4.1, category: "Utilities" },
  { id: "v_safeguard", name: "SafeGuard Security", rating: 4.0, category: "Security" },
  { id: "v_marketpro", name: "MarketPro Agency", rating: 3.7, category: "Marketing" },
  { id: "v_cloudscale", name: "CloudScale SaaS", rating: 4.6, category: "Technology" },
  { id: "v_proclean", name: "ProClean Facilities", rating: 3.8, category: "Facilities" },
  { id: "v_steelworks", name: "SteelWorks Manufacturing", rating: 4.3, category: "Manufacturing" },
  { id: "v_legaleagle", name: "LegalEagle Services", rating: 4.4, category: "Professional Services" },
  { id: "v_datavault", name: "DataVault Storage", rating: 4.0, category: "Technology" },
  { id: "v_fastfleet", name: "FastFleet Transport", rating: 3.6, category: "Logistics" },
]

const contracts = [
  { vendorId: "v_acme", value: 48000, startDate: monthsAgo(12), endDate: daysFromNow(14), paymentTerms: "Net 30", category: "Office Supplies", title: "Annual Office Supplies Agreement" },
  { vendorId: "v_techgiant", value: 245000, startDate: monthsAgo(18), endDate: daysFromNow(45), paymentTerms: "Net 45", category: "Technology", title: "Enterprise Hardware & Support" },
  { vendorId: "v_globallog", value: 180000, startDate: monthsAgo(10), endDate: daysFromNow(120), paymentTerms: "Net 30", category: "Logistics", title: "Freight & Warehousing Contract" },
  { vendorId: "v_greenenergy", value: 95000, startDate: monthsAgo(24), endDate: daysFromNow(8), paymentTerms: "Net 15", category: "Utilities", title: "Renewable Energy Supply" },
  { vendorId: "v_safeguard", value: 62000, startDate: monthsAgo(8), endDate: daysFromNow(200), paymentTerms: "Net 30", category: "Security", title: "Security Monitoring Services" },
  { vendorId: "v_marketpro", value: 120000, startDate: monthsAgo(6), endDate: daysFromNow(22), paymentTerms: "Net 45", category: "Marketing", title: "Digital Marketing Retainer" },
  { vendorId: "v_cloudscale", value: 78000, startDate: monthsAgo(11), endDate: daysFromNow(90), paymentTerms: "Net 30", category: "Technology", title: "Cloud Infrastructure Subscription" },
  { vendorId: "v_proclean", value: 36000, startDate: monthsAgo(14), endDate: daysFromNow(5), paymentTerms: "Net 15", category: "Facilities", title: "Facility Cleaning Services" },
  { vendorId: "v_steelworks", value: 310000, startDate: monthsAgo(20), endDate: daysFromNow(160), paymentTerms: "Net 60", category: "Manufacturing", title: "Raw Materials Supply" },
  { vendorId: "v_legaleagle", value: 55000, startDate: monthsAgo(5), endDate: daysFromNow(60), paymentTerms: "Net 15", category: "Professional Services", title: "Legal Advisory Retainer" },
  { vendorId: "v_datavault", value: 42000, startDate: monthsAgo(9), endDate: daysFromNow(18), paymentTerms: "Net 30", category: "Technology", title: "Backup & Disaster Recovery" },
  { vendorId: "v_fastfleet", value: 150000, startDate: monthsAgo(7), endDate: daysFromNow(110), paymentTerms: "Net 30", category: "Logistics", title: "Last-Mile Delivery Contract" },
]

const baseSpend = {
  v_acme: 3800, v_techgiant: 18000, v_globallog: 14000, v_greenenergy: 7500,
  v_safeguard: 4800, v_marketpro: 9500, v_cloudscale: 6000, v_proclean: 2800,
  v_steelworks: 24000, v_legaleagle: 4200, v_datavault: 3300, v_fastfleet: 11500,
}

const products = [
  { vendorId: "v_acme", name: "A4 Copy Paper (box)", description: "Premium 500-sheet reams", price: 24.99, unit: "box", category: "Office Supplies" },
  { vendorId: "v_acme", name: "Ergonomic Office Chair", description: "Adjustable lumbar support", price: 199.0, unit: "each", category: "Office Supplies" },
  { vendorId: "v_techgiant", name: "Business Laptop", description: "14-inch Intel Core i7", price: 1299.0, unit: "each", category: "Technology" },
  { vendorId: "v_techgiant", name: "IT Support Hours", description: "Remote and on-site support", price: 150.0, unit: "hour", category: "Technology" },
  { vendorId: "v_globallog", name: "Freight Shipment", description: "Domestic pallet transport", price: 450.0, unit: "shipment", category: "Logistics" },
  { vendorId: "v_greenenergy", name: "Renewable Energy kWh", description: "Green electricity credit", price: 0.12, unit: "kWh", category: "Utilities" },
  { vendorId: "v_safeguard", name: "Security Camera Kit", description: "4-camera surveillance system", price: 899.0, unit: "kit", category: "Security" },
  { vendorId: "v_marketpro", name: "Campaign Management", description: "Monthly retainer", price: 8500.0, unit: "month", category: "Marketing" },
  { vendorId: "v_cloudscale", name: "Cloud Compute", description: "Reserved instances", price: 2400.0, unit: "month", category: "Technology" },
  { vendorId: "v_proclean", name: "Office Cleaning", description: "Daily janitorial service", price: 1200.0, unit: "month", category: "Facilities" },
  { vendorId: "v_steelworks", name: "Steel Sheet", description: "Cold-rolled steel", price: 650.0, unit: "ton", category: "Manufacturing" },
  { vendorId: "v_legaleagle", name: "Legal Consultation", description: "Hourly legal counsel", price: 350.0, unit: "hour", category: "Professional Services" },
  { vendorId: "v_datavault", name: "Backup Storage", description: "1 TB encrypted backup", price: 95.0, unit: "TB/month", category: "Technology" },
  { vendorId: "v_fastfleet", name: "Last-Mile Delivery", description: "Same-day local delivery", price: 28.0, unit: "parcel", category: "Logistics" },
]

const requirements = [
  { clientName: "Apex Manufacturing", title: "Steel sheets for Q3 production", description: "Need 50 tons of cold-rolled steel sheets delivered by next month.", category: "Manufacturing", budget: 35000, date: monthsAgo(0), status: "open" },
  { clientName: "BrightStart Offices", title: "Office furniture refresh", description: "Looking for 30 ergonomic chairs and 10 desks.", category: "Office Supplies", budget: 8000, date: monthsAgo(0), status: "open" },
  { clientName: "CloudFirst Inc", title: "Cloud migration support", description: "Need 200 hours of cloud engineering support.", category: "Technology", budget: 50000, date: daysFromNow(-2), status: "open" },
]

const plans = ["Starter", "Growth", "Enterprise"]
const planPrices = [99, 299, 799]
const methods = ["Credit Card", "ACH", "Wire Transfer"]

async function wipe(table) {
  await exec(`DELETE FROM ${table}`)
}

async function main() {
  console.log("[seed] clearing tables…")
  for (const t of ["payments", "subscriptions", "requirements", "products", "spend", "contracts", "vendors", "sessions", "users"]) {
    await wipe(t)
  }

  console.log("[seed] vendors…")
  for (const v of vendors) {
    await exec(`INSERT INTO vendors (id, name, rating, category) VALUES ($1,$2,$3,$4)`, [v.id, v.name, v.rating, v.category])
  }

  console.log("[seed] contracts…")
  for (const c of contracts) {
    await exec(
      `INSERT INTO contracts (id, vendor_id, value, start_date, end_date, payment_terms, category, title) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [id("c"), c.vendorId, c.value, c.startDate, c.endDate, c.paymentTerms, c.category, c.title],
    )
  }

  console.log("[seed] spend (12 months x 12 vendors)…")
  for (const v of vendors) {
    const base = baseSpend[v.id] ?? 5000
    for (let i = 11; i >= 0; i--) {
      const variance = 0.85 + Math.random() * 0.35
      await exec(`INSERT INTO spend (id, vendor_id, amount, date, category) VALUES ($1,$2,$3,$4,$5)`, [
        id("s"),
        v.id,
        Math.round(base * variance),
        firstOfMonthAgo(i),
        v.category,
      ])
    }
  }

  console.log("[seed] products…")
  for (const p of products) {
    await exec(`INSERT INTO products (id, vendor_id, name, description, price, unit, category) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [
      id("p"), p.vendorId, p.name, p.description, p.price, p.unit, p.category,
    ])
  }

  console.log("[seed] requirements…")
  for (const r of requirements) {
    await exec(`INSERT INTO requirements (id, client_name, title, description, category, budget, date, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [
      id("r"), r.clientName, r.title, r.description, r.category, r.budget, r.date, r.status,
    ])
  }

  console.log("[seed] subscriptions…")
  for (const v of vendors) {
    const idx = Math.floor(Math.random() * 3)
    await exec(`INSERT INTO subscriptions (id, vendor_id, plan, price, renew_date, status) VALUES ($1,$2,$3,$4,$5,$6)`, [
      id("sub"), v.id, plans[idx], planPrices[idx], daysFromNow(30 + Math.floor(Math.random() * 60)), "active",
    ])
  }

  console.log("[seed] payments…")
  for (const v of vendors) {
    const count = 2 + Math.floor(Math.random() * 3)
    for (let k = 0; k < count; k++) {
      await exec(`INSERT INTO payments (id, vendor_id, amount, date, method, description) VALUES ($1,$2,$3,$4,$5,$6)`, [
        id("pay"), v.id, [49, 99, 299, 799][Math.floor(Math.random() * 4)], monthsAgo(Math.floor(Math.random() * 6)), methods[Math.floor(Math.random() * 3)], "Subscription payment",
      ])
    }
  }

  console.log("[seed] demo users…")
  await exec(`INSERT INTO users (id, email, phone, name, role, vendor_id, password_hash) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [
    id("u"), "demo@client.com", null, "Apex Manufacturing", "client", null, hashPassword("demo1234"),
  ])
  await exec(`INSERT INTO users (id, email, phone, name, role, vendor_id, password_hash) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [
    id("u"), "demo@vendor.com", null, "Acme Office Supplies", "vendor", "v_acme", hashPassword("demo1234"),
  ])

  console.log("[seed] done.")
  await pool.end()
}

main().catch((err) => {
  console.error("[seed] error:", err)
  process.exit(1)
})
