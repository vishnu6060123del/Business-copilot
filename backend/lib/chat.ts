import { asNumber, query, queryOne } from "./db";
import { getContractsExpiringNextMonth, getExpiringContracts } from "./contracts";

export async function answerProcurementQuestion(question: string) {
  const normalized = question.toLowerCase();

  if (normalized.includes("expire") && normalized.includes("next month")) {
    const data = await getContractsExpiringNextMonth();
    return {
      intent: "contracts_expiring_next_month",
      sql:
        "SELECT c.*, v.name FROM contracts c JOIN vendors v ON v.id = c.vendor_id WHERE c.end_date >= DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') AND c.end_date < DATE_TRUNC('month', CURRENT_DATE + INTERVAL '2 months') ORDER BY c.end_date ASC;",
      answer: data.length
        ? `${data.length} contract(s) expire next month: ${data.map((row: any) => row.vendor_name).join(", ")}.`
        : "No contracts expire next month.",
      data,
    };
  }

  if (normalized.includes("expire") || normalized.includes("renewal")) {
    const data = await getExpiringContracts(30);
    return {
      intent: "contracts_expiring_30_days",
      sql:
        "SELECT c.*, v.name FROM contracts c JOIN vendors v ON v.id = c.vendor_id WHERE c.end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' ORDER BY c.end_date ASC;",
      answer: data.length
        ? `${data.length} contract(s) expire in the next 30 days: ${data.map((row: any) => row.vendor_name).join(", ")}.`
        : "No contracts expire in the next 30 days.",
      data,
    };
  }

  if (normalized.includes("most expensive") || normalized.includes("highest spend") || normalized.includes("top supplier")) {
    const row = await queryOne<{
      vendor_id: string;
      vendor_name: string;
      total_spend: string;
    }>(
      `SELECT v.id AS vendor_id, v.name AS vendor_name, COALESCE(SUM(s.amount), 0) AS total_spend
       FROM vendors v
       JOIN spend s ON s.vendor_id = v.id
       GROUP BY v.id, v.name
       ORDER BY total_spend DESC
       LIMIT 1`
    );

    return {
      intent: "most_expensive_supplier",
      sql:
        "SELECT v.name, SUM(s.amount) AS total_spend FROM vendors v JOIN spend s ON s.vendor_id = v.id GROUP BY v.name ORDER BY total_spend DESC LIMIT 1;",
      answer: row
        ? `${row.vendor_name} is the most expensive supplier with $${asNumber(row.total_spend).toLocaleString()} in tracked spend.`
        : "No spend data is available yet.",
      data: row ? [{ ...row, total_spend: asNumber(row.total_spend) }] : [],
    };
  }

  if (normalized.includes("overpay") || normalized.includes("overpaying")) {
    const data = await query(
      `SELECT c.id AS contract_id, v.name AS vendor_name, c.value,
              COALESCE(AVG(s.amount), 0) AS average_spend
       FROM contracts c
       JOIN vendors v ON v.id = c.vendor_id
       LEFT JOIN spend s ON s.vendor_id = c.vendor_id
       GROUP BY c.id, v.name, c.value
       HAVING c.value > COALESCE(AVG(s.amount), 0)
       ORDER BY (c.value - COALESCE(AVG(s.amount), 0)) DESC`
    );

    return {
      intent: "overpaying_vendors",
      sql:
        "SELECT c.*, AVG(s.amount) AS average_spend FROM contracts c LEFT JOIN spend s ON s.vendor_id = c.vendor_id GROUP BY c.id HAVING c.value > AVG(s.amount);",
      answer: data.length
        ? `${data.length} contract(s) are above average spend and should be reviewed.`
        : "No overpaying contracts were detected by the current rule set.",
      data,
    };
  }

  const total = await queryOne<{ total_spend: string }>("SELECT COALESCE(SUM(amount), 0) AS total_spend FROM spend");
  return {
    intent: "total_spend_fallback",
    sql: "SELECT SUM(amount) AS total_spend FROM spend;",
    answer: `Total tracked spend is $${asNumber(total?.total_spend).toLocaleString()}. Try asking about expiring contracts or expensive suppliers for more detail.`,
    data: [{ totalSpend: asNumber(total?.total_spend) }],
  };
}