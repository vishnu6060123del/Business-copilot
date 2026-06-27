import { asNumber, query, queryOne } from "./db";
import { getExpiringContracts } from "./contracts";

export async function getTotalSpend() {
  const row = await queryOne<{ total_spend: string }>("SELECT COALESCE(SUM(amount), 0) AS total_spend FROM spend");
  return asNumber(row?.total_spend);
}

export async function getTopSuppliersBySpend(limit = 10) {
  const rows = await query<{
    vendor_id: string;
    vendor_name: string;
    category: string;
    rating: string;
    total_spend: string;
  }>(
    `SELECT v.id AS vendor_id, v.name AS vendor_name, v.category, v.rating,
            COALESCE(SUM(s.amount), 0) AS total_spend
     FROM vendors v
     JOIN spend s ON s.vendor_id = v.id
     GROUP BY v.id, v.name, v.category, v.rating
     ORDER BY total_spend DESC
     LIMIT $1`,
    [limit]
  );

  return rows.map((row) => ({
    ...row,
    rating: asNumber(row.rating),
    total_spend: asNumber(row.total_spend),
  }));
}

export async function getSpendByCategory() {
  const rows = await query<{ category: string; total_spend: string }>(
    `SELECT category, COALESCE(SUM(amount), 0) AS total_spend
     FROM spend
     GROUP BY category
     ORDER BY total_spend DESC`
  );

  return rows.map((row) => ({ ...row, total_spend: asNumber(row.total_spend) }));
}

export async function getDashboardAnalytics() {
  const [totalSpend, topSuppliers, expiringContracts, spendByCategory] = await Promise.all([
    getTotalSpend(),
    getTopSuppliersBySpend(10),
    getExpiringContracts(30),
    getSpendByCategory(),
  ]);

  return {
    totalSpend,
    topSuppliers,
    contractsExpiringInNext30Days: expiringContracts,
    spendByCategory,
  };
}

export async function compareSuppliers(vendorIds: string[]) {
  const rows = await query<{
    vendor_id: string;
    vendor_name: string;
    category: string;
    rating: string;
    total_spend: string;
    average_price: string;
    contract_count: string;
  }>(
    `WITH spend_agg AS (
        SELECT vendor_id, SUM(amount) AS total_spend
        FROM spend
        WHERE vendor_id = ANY($1::uuid[])
        GROUP BY vendor_id
      ), contract_agg AS (
        SELECT vendor_id, AVG(value) AS average_price, COUNT(*) AS contract_count
        FROM contracts
        WHERE vendor_id = ANY($1::uuid[])
        GROUP BY vendor_id
      )
      SELECT v.id AS vendor_id,
             v.name AS vendor_name,
             v.category,
             v.rating,
             COALESCE(sa.total_spend, 0) AS total_spend,
             COALESCE(ca.average_price, 0) AS average_price,
             COALESCE(ca.contract_count, 0) AS contract_count
      FROM vendors v
      LEFT JOIN spend_agg sa ON sa.vendor_id = v.id
      LEFT JOIN contract_agg ca ON ca.vendor_id = v.id
      WHERE v.id = ANY($1::uuid[])
      ORDER BY total_spend DESC`,
    [vendorIds]
  );

  return rows.map((row) => ({
    vendorId: row.vendor_id,
    vendorName: row.vendor_name,
    category: row.category,
    rating: asNumber(row.rating),
    totalSpend: asNumber(row.total_spend),
    averagePrice: asNumber(row.average_price),
    contractCount: asNumber(row.contract_count),
  }));
}