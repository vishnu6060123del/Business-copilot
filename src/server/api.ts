/**
 * Serverless API route layer (mocked for the SPA demo).
 * In production these map to Next.js App Router route handlers
 * or Vercel/Netlify serverless functions backed by Aurora PostgreSQL.
 */
import type { Contract, Vendor, Spend, Alert, Insight, ChatMessage } from "@/lib/types";

export type { Alert, Insight, ChatMessage };
import {
  addContract,
  addSpend,
  addVendor,
  deleteContract,
  getContractById,
  getContracts,
  getSpend,
  getVendors,
  monthlySpendTrend,
  spendByCategory,
  spendByVendor,
  totalSpend,
} from "@/lib/db";
import { answerChat, generateAlerts, getContractInsights } from "@/lib/ai";
import { extractContractFields, extractTextFromPDF } from "@/lib/pdfExtract";

export const ENDPOINTS = {
  contracts: "/api/contracts",
  contract: (id: string) => `/api/contracts/${id}`,
  insights: (id: string) => `/api/contracts/${id}/insights`,
  upload: "/api/contracts/upload",
  spend: "/api/spend",
  vendors: "/api/vendors",
  alerts: "/api/alerts",
  chat: "/api/chat",
  compare: "/api/vendors/compare",
  dashboard: "/api/dashboard",
} as const;

export interface DashboardSummary {
  totalSpend: number;
  activeContracts: number;
  topSuppliers: { vendor: Vendor; amount: number }[];
  monthlyTrend: { month: string; amount: number }[];
  categorySpend: { category: string; amount: number }[];
  alerts: Alert[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return {
    totalSpend: totalSpend(),
    activeContracts: getContracts().filter((c) => new Date(c.endDate) >= new Date()).length,
    topSuppliers: spendByVendor().slice(0, 10),
    monthlyTrend: monthlySpendTrend(),
    categorySpend: spendByCategory(),
    alerts: generateAlerts(),
  };
}

export async function listContracts(): Promise<Contract[]> {
  return getContracts();
}

export async function fetchContract(id: string): Promise<Contract | null> {
  return getContractById(id) ?? null;
}

export async function fetchContractInsights(id: string): Promise<Insight[]> {
  const contract = getContractById(id);
  if (!contract) return [];
  return getContractInsights(contract);
}

export async function removeContract(id: string): Promise<boolean> {
  return deleteContract(id);
}

export interface UploadResult {
  extracted: {
    vendorName?: string;
    value?: number;
    startDate?: string;
    endDate?: string;
    paymentTerms?: string;
    category?: string;
    title?: string;
    rawText: string;
  };
  contract?: Contract;
}

export async function uploadContractPDF(file: File, save = true): Promise<UploadResult> {
  const text = await extractTextFromPDF(file);
  const extracted = extractContractFields(text);

  let contract: Contract | undefined;
  if (save) {
    let vendor = getVendors().find((v) => v.name.toLowerCase() === (extracted.vendorName || "").toLowerCase());
    if (!vendor) {
      vendor = addVendor({
        name: extracted.vendorName || "Unknown Vendor",
        rating: 4.0,
        category: extracted.category || "Professional Services",
      });
    }
    contract = addContract({
      vendorId: vendor.id,
      value: extracted.value ?? 0,
      startDate: extracted.startDate ?? new Date().toISOString().split("T")[0],
      endDate: extracted.endDate ?? new Date().toISOString().split("T")[0],
      paymentTerms: extracted.paymentTerms ?? "Net 30",
      category: extracted.category ?? vendor.category,
      title: extracted.title || file.name.replace(/\.pdf$/i, ""),
    });
  }

  return { extracted, contract };
}

export async function createContract(contract: Omit<Contract, "id">): Promise<Contract> {
  return addContract(contract);
}

export async function listVendors(): Promise<Vendor[]> {
  return getVendors();
}

export async function listSpend(): Promise<Spend[]> {
  return getSpend();
}

export async function recordSpend(spend: Omit<Spend, "id">): Promise<Spend> {
  return addSpend(spend);
}

export async function listAlerts(): Promise<Alert[]> {
  return generateAlerts();
}

export async function queryChat(question: string): Promise<{ answer: string; sql: string; data?: unknown[] }> {
  const result = answerChat(question);
  return { answer: result.text, sql: result.sql, data: result.data };
}

export async function compareVendors(vendorIds: string[]) {
  const vendors = getVendors().filter((v) => vendorIds.includes(v.id));
  const spendRows = getSpend();
  return vendors.map((vendor) => {
    const vendorSpend = spendRows.filter((s) => s.vendorId === vendor.id);
    const vendorContracts = getContracts().filter((c) => c.vendorId === vendor.id);
    const total = vendorSpend.reduce((sum, s) => sum + s.amount, 0);
    const avgContract = vendorContracts.length
      ? vendorContracts.reduce((sum, c) => sum + c.value, 0) / vendorContracts.length
      : 0;
    return {
      vendor,
      totalSpend: total,
      avgContractValue: avgContract,
      paymentTerms: vendorContracts.map((c) => c.paymentTerms),
      transactionCount: vendorSpend.length,
    };
  });
}

export function persistChatHistory(messages: ChatMessage[]) {
  try {
    localStorage.setItem("procurement_chat_history", JSON.stringify(messages));
  } catch {
    // ignore
  }
}

export function loadChatHistory(): ChatMessage[] {
  try {
    const raw = localStorage.getItem("procurement_chat_history");
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}
