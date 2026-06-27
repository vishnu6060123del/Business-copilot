import type { PoolClient } from "pg";
import { asNumber, query, queryOne, withTransaction } from "./db";
import type { SaveContractInput } from "./validation";

export interface ExtractedContractData {
  vendorName: string;
  value: number;
  startDate: string;
  endDate: string;
  paymentTerms: string;
  category: string;
}

const vendorHints = [
  { token: "acme", name: "Acme Office Supplies", category: "Office Supplies" },
  { token: "cloud", name: "CloudScale SaaS", category: "Technology" },
  { token: "tech", name: "TechGiant IT", category: "Technology" },
  { token: "logistics", name: "Global Logistics Inc", category: "Logistics" },
  { token: "freight", name: "Global Logistics Inc", category: "Logistics" },
  { token: "energy", name: "GreenEnergy Utilities", category: "Utilities" },
  { token: "security", name: "SafeGuard Security", category: "Security" },
  { token: "marketing", name: "MarketPro Agency", category: "Marketing" },
  { token: "clean", name: "ProClean Facilities", category: "Facilities" },
  { token: "steel", name: "SteelWorks Manufacturing", category: "Manufacturing" },
];

function dateDaysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateDaysAgo(days: number) {
  return dateDaysFromNow(-days);
}

export async function simulateContractExtraction(file: File): Promise<ExtractedContractData> {
  const fileName = file.name.toLowerCase();
  const hint = vendorHints.find((item) => fileName.includes(item.token)) ?? vendorHints[file.size % vendorHints.length];
  const value = 25_000 + (file.size % 225_000);
  const endOffset = 10 + (file.size % 120);
  const netTerms = ["Net 15", "Net 30", "Net 45", "Net 60"][file.size % 4];

  return {
    vendorName: hint.name,
    value,
    startDate: dateDaysAgo(365),
    endDate: dateDaysFromNow(endOffset),
    paymentTerms: netTerms,
    category: hint.category,
  };
}

async function findOrCreateVendor(client: PoolClient, input: SaveContractInput) {
  if (input.vendorId) {
    const result = await client.query(
      "SELECT id, name, rating, category FROM vendors WHERE id = $1",
      [input.vendorId]
    );
    if (!result.rows[0]) throw new Error("Vendor not found");
    return result.rows[0];
  }

  const vendorName = input.vendorName!;
  const result = await client.query(
    `INSERT INTO vendors (name, rating, category)
     VALUES ($1, $2, $3)
     ON CONFLICT (name)
     DO UPDATE SET category = EXCLUDED.category, rating = COALESCE(vendors.rating, EXCLUDED.rating)
     RETURNING id, name, rating, category`,
    [vendorName, input.vendorRating ?? 4, input.category]
  );

  return result.rows[0];
}

export async function saveContract(input: SaveContractInput) {
  return withTransaction(async (client) => {
    const vendor = await findOrCreateVendor(client, input);
    const contract = await client.query(
      `INSERT INTO contracts (vendor_id, value, start_date, end_date, payment_terms, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, vendor_id, value, start_date, end_date, payment_terms, category`,
      [vendor.id, input.value, input.startDate, input.endDate, input.paymentTerms, input.category]
    );

    return {
      vendor,
      contract: contract.rows[0],
    };
  });
}

export async function getExpiringContracts(days = 30) {
  return query(
    `SELECT c.id, c.vendor_id, v.name AS vendor_name, c.value, c.start_date, c.end_date,
            c.payment_terms, c.category
     FROM contracts c
     JOIN vendors v ON v.id = c.vendor_id
     WHERE c.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($1 || ' days')::interval
     ORDER BY c.end_date ASC`,
    [days]
  );
}

export async function getContractsExpiringNextMonth() {
  return query(
    `SELECT c.id, c.vendor_id, v.name AS vendor_name, c.value, c.start_date, c.end_date,
            c.payment_terms, c.category
     FROM contracts c
     JOIN vendors v ON v.id = c.vendor_id
     WHERE c.end_date >= DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month')
       AND c.end_date < DATE_TRUNC('month', CURRENT_DATE + INTERVAL '2 months')
     ORDER BY c.end_date ASC`
  );
}

export async function getAverageSpendForVendor(vendorId: string) {
  const row = await queryOne<{ average_spend: string }>(
    "SELECT COALESCE(AVG(amount), 0) AS average_spend FROM spend WHERE vendor_id = $1",
    [vendorId]
  );
  return asNumber(row?.average_spend);
}

export async function recommendLowerCostVendor(category: string, currentVendorId: string) {
  return queryOne<{
    id: string;
    name: string;
    average_spend: string;
  }>(
    `SELECT v.id, v.name, COALESCE(AVG(s.amount), 0) AS average_spend
     FROM vendors v
     LEFT JOIN spend s ON s.vendor_id = v.id
     WHERE v.category = $1 AND v.id <> $2
     GROUP BY v.id, v.name
     ORDER BY average_spend ASC NULLS LAST
     LIMIT 1`,
    [category, currentVendorId]
  );
}