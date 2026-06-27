import {
  addMonths,
  differenceInDays,
  format,
  parseISO,
  startOfMonth,
} from "date-fns";
import type { Alert, Contract, Insight, Vendor } from "@/lib/types";
import {
  averageContractValueByCategory,
  averageSpendByVendor,
  getContracts,
  getSpend,
  getVendorById,
  getVendors,
  spendByVendor,
  totalSpend,
} from "@/lib/db";

export function daysUntil(date: string): number {
  return differenceInDays(parseISO(date), new Date());
}

export function getContractInsights(contract: Contract): Insight[] {
  const insights: Insight[] = [];
  const days = daysUntil(contract.endDate);

  if (days <= 30 && days >= 0) {
    insights.push({
      id: `exp-${contract.id}`,
      contractId: contract.id,
      label: "Expiring Soon",
      severity: "high",
      description: `Contract ends in ${days} day${days === 1 ? "" : "s"} (${contract.endDate}). Consider renewal or sourcing alternatives.`,
    });
  } else if (days < 0) {
    insights.push({
      id: `exp-${contract.id}`,
      contractId: contract.id,
      label: "Expired",
      severity: "high",
      description: `Contract expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago. Immediate action required.`,
    });
  }

  const categoryAvg = averageContractValueByCategory(contract.category);
  if (categoryAvg > 0 && contract.value > categoryAvg * 1.1) {
    const pct = Math.round(((contract.value - categoryAvg) / categoryAvg) * 100);
    insights.push({
      id: `over-${contract.id}`,
      contractId: contract.id,
      label: "Overpaying",
      severity: "medium",
      description: `Contract value is ${pct}% above the ${contract.category} average ($${Math.round(categoryAvg).toLocaleString()}). Renegotiation opportunity.`,
    });
  }

  const alternatives = recommendVendors(contract.category, contract.vendorId);
  if (alternatives.length) {
    const alt = alternatives[0];
    insights.push({
      id: `alt-${contract.id}`,
      contractId: contract.id,
      label: "Alternative Vendor",
      severity: "low",
      description: `${alt.name} offers a lower average spend in ${contract.category} and may be a viable substitute.`,
    });
  }

  return insights;
}

export function recommendVendors(category: string, excludeVendorId: string): Vendor[] {
  return getVendors()
    .filter((v) => v.category === category && v.id !== excludeVendorId)
    .map((v) => ({ v, avg: averageSpendByVendor(v.id) }))
    .sort((a, b) => a.avg - b.avg)
    .map((x) => x.v);
}

export function generateAlerts(): Alert[] {
  const alerts: Alert[] = [];
  getContracts().forEach((contract) => {
    const days = daysUntil(contract.endDate);
    const vendor = getVendorById(contract.vendorId);
    if (days <= 30 && days >= 0) {
      alerts.push({
        id: `alert-exp-${contract.id}`,
        type: "warning",
        title: "Contract expiring soon",
        message: `${contract.title || "Contract"} with ${vendor?.name ?? "Unknown"} ends on ${contract.endDate}.`,
        contractId: contract.id,
      });
    } else if (days < 0) {
      alerts.push({
        id: `alert-expired-${contract.id}`,
        type: "danger",
        title: "Contract expired",
        message: `${contract.title || "Contract"} with ${vendor?.name ?? "Unknown"} expired on ${contract.endDate}.`,
        contractId: contract.id,
      });
    }

    const categoryAvg = averageContractValueByCategory(contract.category);
    if (categoryAvg > 0 && contract.value > categoryAvg * 1.1) {
      alerts.push({
        id: `alert-cost-${contract.id}`,
        type: "danger",
        title: "High-cost vendor detected",
        message: `${vendor?.name ?? "Unknown"} is ${Math.round(((contract.value - categoryAvg) / categoryAvg) * 100)}% above the ${contract.category} average.`,
        vendorId: contract.vendorId,
        contractId: contract.id,
      });
    }
  });
  return alerts.sort((a, b) => (a.type === "danger" ? -1 : 1) - (b.type === "danger" ? -1 : 1));
}

export interface ChatAnswer {
  sql: string;
  text: string;
  data?: unknown[];
}

export function answerChat(question: string): ChatAnswer {
  const q = question.toLowerCase();
  const contracts = getContracts();
  const vendors = getVendors();
  const spend = getSpend();

  // Expiring next month
  if (q.includes("expire") && (q.includes("next month") || q.includes("coming month"))) {
    const start = startOfMonth(addMonths(new Date(), 1));
    const endStr = format(start, "yyyy-MM");
    const matches = contracts.filter((c) => c.endDate.startsWith(endStr));
    const sql = `SELECT c.*, v.name FROM contracts c JOIN vendors v ON c.vendor_id = v.id WHERE c.end_date BETWEEN DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') AND DATE_TRUNC('month', CURRENT_DATE + INTERVAL '2 month') ORDER BY c.end_date;`;
    if (!matches.length) return { sql, text: "No contracts are scheduled to expire next month." };
    const lines = matches
      .map((c) => {
        const v = getVendorById(c.vendorId);
        return `• ${c.title || "Contract"} with ${v?.name ?? "Unknown"} ends ${c.endDate}`;
      })
      .join("\n");
    return {
      sql,
      text: `${matches.length} contract${matches.length === 1 ? "" : "s"} expire${matches.length === 1 ? "s" : ""} next month:\n${lines}`,
      data: matches,
    };
  }

  // Expiring soon / within 30 days
  if (q.includes("expire") || q.includes("renewal")) {
    const matches = contracts.filter((c) => daysUntil(c.endDate) <= 30);
    const sql = `SELECT c.*, v.name FROM contracts c JOIN vendors v ON c.vendor_id = v.id WHERE c.end_date <= CURRENT_DATE + INTERVAL '30 days' ORDER BY c.end_date;`;
    if (!matches.length) return { sql, text: "No contracts are expiring within the next 30 days." };
    const lines = matches
      .map((c) => {
        const v = getVendorById(c.vendorId);
        return `• ${c.title || "Contract"} with ${v?.name ?? "Unknown"} ends ${c.endDate}`;
      })
      .join("\n");
    return {
      sql,
      text: `${matches.length} contract${matches.length === 1 ? "" : "s"} expiring within 30 days:\n${lines}`,
      data: matches,
    };
  }

  // Most expensive supplier
  if ((q.includes("most expensive") || q.includes("highest spend") || q.includes("top supplier")) && q.includes("supplier")) {
    const ranking = spendByVendor();
    const top = ranking[0];
    const sql = `SELECT v.name, SUM(s.amount) AS total_spend FROM spend s JOIN vendors v ON s.vendor_id = v.id GROUP BY v.name ORDER BY total_spend DESC LIMIT 1;`;
    if (!top) return { sql, text: "No spend data available." };
    return {
      sql,
      text: `Your most expensive supplier is **${top.vendor.name}** with a total spend of **$${top.amount.toLocaleString()}** in the ${top.vendor.category} category.`,
      data: [{ vendor: top.vendor.name, amount: top.amount }],
    };
  }

  // Overpaying vendors
  if (q.includes("overpay") || q.includes("over budget") || q.includes("too high")) {
    const over: { contract: Contract; vendor: Vendor | undefined; diffPct: number }[] = [];
    contracts.forEach((c) => {
      const avg = averageContractValueByCategory(c.category);
      if (avg > 0 && c.value > avg * 1.1) {
        over.push({ contract: c, vendor: getVendorById(c.vendorId), diffPct: Math.round(((c.value - avg) / avg) * 100) });
      }
    });
    const sql = `SELECT c.*, v.name, AVG(c2.value) OVER (PARTITION BY c2.category) AS category_avg FROM contracts c JOIN vendors v ON c.vendor_id = v.id JOIN contracts c2 ON c.category = c2.category WHERE c.value > category_avg * 1.1 ORDER BY (c.value - category_avg) DESC;`;
    if (!over.length) return { sql, text: "No vendors are currently flagged as overpaying." };
    const lines = over.map((o) => `• ${o.vendor?.name ?? "Unknown"} — ${o.contract.title || "Contract"} is ${o.diffPct}% above category average`).join("\n");
    return {
      sql,
      text: `You may be overpaying on ${over.length} contract${over.length === 1 ? "" : "s"}:\n${lines}`,
      data: over,
    };
  }

  // Total spend
  if (q.includes("total spend") || q.includes("spend in total")) {
    const total = totalSpend();
    return {
      sql: `SELECT SUM(amount) AS total_spend FROM spend;`,
      text: `Total tracked spend is **$${total.toLocaleString()}**.`,
      data: [{ total_spend: total }],
    };
  }

  // Fallback: keyword search
  const vendorMatches = vendors.filter((v) => q.includes(v.name.toLowerCase()));
  if (vendorMatches.length) {
    const v = vendorMatches[0];
    const total = spend.filter((s) => s.vendorId === v.id).reduce((sum, s) => sum + s.amount, 0);
    return {
      sql: `SELECT v.*, SUM(s.amount) AS total_spend FROM vendors v JOIN spend s ON v.id = s.vendor_id WHERE v.id = '${v.id}' GROUP BY v.id;`,
      text: `**${v.name}** (${v.category}) has a rating of ${v.rating}/5 and total spend of **$${total.toLocaleString()}**.`,
      data: [{ vendor: v, total_spend: total }],
    };
  }

  return {
    sql: `-- Could not map question to a query. Data snapshot available.`,
    text: `I can answer questions like "Which contracts expire next month?", "Who is my most expensive supplier?", or "Show vendors where we are overpaying". Try one of those prompts.`,
    data: [{ contracts: contracts.length, vendors: vendors.length, spend_rows: spend.length }],
  };
}
