import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = "";

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    text += pageText + "\n";
  }
  return text.trim();
}

function findLine(text: string, patterns: string[]): string | undefined {
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const lower = line.toLowerCase();
    for (const pattern of patterns) {
      if (lower.includes(pattern.toLowerCase())) {
        const idx = lower.indexOf(pattern.toLowerCase());
        const after = line.slice(idx + pattern.length).trim();
        const cleaned = after.replace(/^[:\-–]\s*/, "").trim();
        if (cleaned) return cleaned;
      }
    }
  }
  return undefined;
}

function parseCurrency(value: string): number | undefined {
  const match = value.replace(/,/g, "").match(/\$?\s*(\d+(?:\.\d{1,2})?)\s*[Kk]?/);
  if (!match) return undefined;
  let num = parseFloat(match[1]);
  if (/[Kk]\b/.test(value)) num *= 1000;
  return Math.round(num);
}

function parseDate(value: string): string | undefined {
  const clean = value.replace(/[^0-9a-zA-Z\/\-]/g, " ").trim();
  const patterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
    /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/,
    /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/,
  ];
  for (const re of patterns) {
    const m = clean.match(re);
    if (m) {
      let iso: string | undefined;
      if (/[A-Za-z]+/.test(m[1]) && m.length >= 4) {
        const d = new Date(`${m[1]} ${m[2]}, ${m[3]}`);
        if (!isNaN(d.getTime())) iso = d.toISOString().split("T")[0];
      } else if (/^\d{4}/.test(m[1])) {
        iso = `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
      } else if (/[A-Za-z]+/.test(m[2])) {
        const d = new Date(`${m[2]} ${m[1]}, ${m[3]}`);
        if (!isNaN(d.getTime())) iso = d.toISOString().split("T")[0];
      } else {
        iso = `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
      }
      if (iso) return iso;
    }
  }
  return undefined;
}

function inferCategory(text: string, vendorName?: string): string {
  const lower = text.toLowerCase();
  const keywords: Record<string, string[]> = {
    Technology: ["software", "cloud", "saas", "hardware", "it ", "data", "hosting", "backup"],
    Logistics: ["logistics", "freight", "transport", "delivery", "shipping", "warehouse"],
    Utilities: ["energy", "electricity", "gas", "water", "utility"],
    Security: ["security", "monitoring", "surveillance"],
    Marketing: ["marketing", "advertising", "agency", "campaign", "media"],
    Facilities: ["cleaning", "facilities", "maintenance", "janitorial"],
    Manufacturing: ["manufacturing", "raw materials", "steel", "production"],
    "Professional Services": ["legal", "consulting", "advisory", "audit"],
    "Office Supplies": ["office supplies", "stationery", "paper", "ink"],
  };
  for (const [cat, words] of Object.entries(keywords)) {
    if (words.some((w) => lower.includes(w))) return cat;
  }
  if (vendorName) {
    const lowerName = vendorName.toLowerCase();
    for (const v of getVendors()) {
      if (lowerName.includes(v.name.toLowerCase().split(" ")[0])) return v.category;
    }
  }
  return "Professional Services";
}

import { getVendors } from "@/lib/db";

export interface ExtractedContract {
  vendorName?: string;
  value?: number;
  startDate?: string;
  endDate?: string;
  paymentTerms?: string;
  category?: string;
  title?: string;
  rawText: string;
}

export function extractContractFields(text: string): ExtractedContract {
  const vendorName = findLine(text, ["Vendor", "Supplier", "Contractor", "Provider"]) || text.split(/\r?\n/)[0]?.trim();
  const valueLine = findLine(text, ["Contract Value", "Total Value", "Agreement Value", "Contract Amount", "Value", "Amount"]);
  const value = valueLine ? parseCurrency(valueLine) : undefined;
  const startDate = parseDate(findLine(text, ["Start Date", "Effective Date", "Commencement Date"]) || "");
  const endDate = parseDate(findLine(text, ["End Date", "Expiration Date", "Renewal Date", "Term End"]) || "");
  const paymentTerms = findLine(text, ["Payment Terms", "Terms", "Net " ]) || findNetTerms(text);
  const title = findLine(text, ["Agreement", "Contract Title", "Service Agreement"]) || "New Contract";

  return {
    vendorName: vendorName || undefined,
    value,
    startDate,
    endDate,
    paymentTerms,
    category: inferCategory(text, vendorName),
    title,
    rawText: text,
  };
}

function findNetTerms(text: string): string | undefined {
  const match = text.match(/Net\s+\d{1,3}/i);
  return match ? match[0] : undefined;
}
