import type {
  Contract,
  Payment,
  Product,
  Requirement,
  Spend,
  Subscription,
  Vendor,
} from "@/lib/types";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/apiClient";

/**
 * Client-side data cache hydrated from Aurora DSQL via /api/bootstrap.
 * Reads are synchronous against this cache (so existing pages work unchanged);
 * writes update the cache optimistically AND persist to the backend API.
 */

let vendors: Vendor[] = [];
let contracts: Contract[] = [];
let spend: Spend[] = [];
let products: Product[] = [];
let requirements: Requirement[] = [];
let subscriptions: Subscription[] = [];
let payments: Payment[] = [];

let hydrated = false;

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36).slice(-4)}`;
}

interface BootstrapPayload {
  vendors: Vendor[];
  contracts: Contract[];
  spend: Spend[];
  products: Product[];
  requirements: Requirement[];
  subscriptions: Subscription[];
  payments: Payment[];
}

export async function hydrateFromServer(): Promise<void> {
  const data = await apiGet<BootstrapPayload>("/api/bootstrap");
  vendors = data.vendors || [];
  contracts = data.contracts || [];
  spend = data.spend || [];
  products = data.products || [];
  requirements = data.requirements || [];
  subscriptions = data.subscriptions || [];
  payments = data.payments || [];
  hydrated = true;
}

export function isHydrated() {
  return hydrated;
}

function logError(context: string, err: unknown) {
  console.error(`[v0] persist ${context} failed:`, err);
}

export function getVendors(): Vendor[] {
  return vendors;
}

export function getVendorById(vendorId: string): Vendor | undefined {
  return vendors.find((v) => v.id === vendorId);
}

export function updateVendor(vendorId: string, updates: Partial<Vendor>): Vendor | undefined {
  const idx = vendors.findIndex((v) => v.id === vendorId);
  if (idx < 0) return undefined;
  vendors[idx] = { ...vendors[idx], ...updates };
  apiPatch(`/api/vendors/${vendorId}`, {
    name: updates.name,
    category: updates.category,
    rating: updates.rating,
  }).catch((err) => logError("updateVendor", err));
  return vendors[idx];
}

export function addVendor(vendor: Omit<Vendor, "id">): Vendor {
  const newVendor: Vendor = { ...vendor, id: id("v") };
  vendors.push(newVendor);
  apiPost<{ vendor: Vendor }>("/api/vendors", vendor)
    .then((res) => {
      // Reconcile local id with the server-generated id.
      const idx = vendors.findIndex((v) => v.id === newVendor.id);
      if (idx >= 0) vendors[idx] = res.vendor;
    })
    .catch((err) => logError("addVendor", err));
  return newVendor;
}

export function getContracts(): Contract[] {
  return contracts.slice().sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
}

export function getContractById(contractId: string): Contract | undefined {
  return contracts.find((c) => c.id === contractId);
}

export function getContractsByVendor(vendorId: string): Contract[] {
  return contracts.filter((c) => c.vendorId === vendorId);
}

export function addContract(contract: Omit<Contract, "id">): Contract {
  const newContract: Contract = { ...contract, id: id("c") };
  contracts.push(newContract);
  apiPost<{ contract: Contract }>("/api/contracts", contract)
    .then((res) => {
      const idx = contracts.findIndex((c) => c.id === newContract.id);
      if (idx >= 0) contracts[idx] = res.contract;
    })
    .catch((err) => logError("addContract", err));
  return newContract;
}

export function deleteContract(contractId: string): boolean {
  const idx = contracts.findIndex((c) => c.id === contractId);
  if (idx >= 0) {
    contracts.splice(idx, 1);
    apiDelete(`/api/contracts/${contractId}`).catch((err) => logError("deleteContract", err));
    return true;
  }
  return false;
}

export function getSpend(): Spend[] {
  return spend;
}

export function addSpend(record: Omit<Spend, "id">): Spend {
  const newRecord: Spend = { ...record, id: id("s") };
  spend.push(newRecord);
  apiPost<{ spend: Spend }>("/api/spend", record)
    .then((res) => {
      const idx = spend.findIndex((s) => s.id === newRecord.id);
      if (idx >= 0) spend[idx] = res.spend;
    })
    .catch((err) => logError("addSpend", err));
  return newRecord;
}

export function getProducts(): Product[] {
  return products;
}

export function getProductsByVendor(vendorId: string): Product[] {
  return products.filter((p) => p.vendorId === vendorId);
}

export function addProduct(product: Omit<Product, "id">): Product {
  const newProduct: Product = { ...product, id: id("p") };
  products.push(newProduct);
  apiPost<{ product: Product }>("/api/products", product)
    .then((res) => {
      const idx = products.findIndex((p) => p.id === newProduct.id);
      if (idx >= 0) products[idx] = res.product;
    })
    .catch((err) => logError("addProduct", err));
  return newProduct;
}

export function deleteProduct(productId: string): boolean {
  const idx = products.findIndex((p) => p.id === productId);
  if (idx >= 0) {
    products.splice(idx, 1);
    apiDelete(`/api/products/${productId}`).catch((err) => logError("deleteProduct", err));
    return true;
  }
  return false;
}

export function getRequirements(): Requirement[] {
  return requirements.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function addRequirement(requirement: Omit<Requirement, "id">): Requirement {
  const newRequirement: Requirement = { ...requirement, id: id("r") };
  requirements.push(newRequirement);
  apiPost<{ requirement: Requirement }>("/api/requirements", requirement)
    .then((res) => {
      const idx = requirements.findIndex((r) => r.id === newRequirement.id);
      if (idx >= 0) requirements[idx] = res.requirement;
    })
    .catch((err) => logError("addRequirement", err));
  return newRequirement;
}

export function updateRequirement(requirementId: string, updates: Partial<Requirement>): Requirement | undefined {
  const idx = requirements.findIndex((r) => r.id === requirementId);
  if (idx < 0) return undefined;
  requirements[idx] = { ...requirements[idx], ...updates };
  apiPatch(`/api/requirements/${requirementId}`, updates).catch((err) => logError("updateRequirement", err));
  return requirements[idx];
}

export function getSubscriptionByVendor(vendorId: string): Subscription | undefined {
  return subscriptions.find((s) => s.vendorId === vendorId);
}

export function updateSubscription(vendorId: string, updates: Partial<Subscription>): Subscription | undefined {
  const idx = subscriptions.findIndex((s) => s.vendorId === vendorId);
  if (idx < 0) return undefined;
  subscriptions[idx] = { ...subscriptions[idx], ...updates };
  // Only persist columns that exist in the database (payment method/card details are client-only).
  const { plan, price, status, renewDate } = updates;
  if (plan !== undefined || price !== undefined || status !== undefined || renewDate !== undefined) {
    apiPatch(`/api/subscriptions/${vendorId}`, { plan, price, status, renewDate }).catch((err) =>
      logError("updateSubscription", err),
    );
  }
  return subscriptions[idx];
}

export function getPaymentsByVendor(vendorId: string): Payment[] {
  return payments.filter((p) => p.vendorId === vendorId).sort((a, b) => b.date.localeCompare(a.date));
}

export function addPayment(payment: Omit<Payment, "id">): Payment {
  const newPayment: Payment = { ...payment, id: id("pay") };
  payments.push(newPayment);
  apiPost<{ payment: Payment }>("/api/payments", payment)
    .then((res) => {
      const idx = payments.findIndex((p) => p.id === newPayment.id);
      if (idx >= 0) payments[idx] = res.payment;
    })
    .catch((err) => logError("addPayment", err));
  return newPayment;
}

export function totalSpend(): number {
  return spend.reduce((sum, s) => sum + s.amount, 0);
}

export function spendByVendor(): { vendor: Vendor; amount: number }[] {
  const map = new Map<string, number>();
  spend.forEach((s) => map.set(s.vendorId, (map.get(s.vendorId) || 0) + s.amount));
  return vendors
    .map((v) => ({ vendor: v, amount: map.get(v.id) || 0 }))
    .sort((a, b) => b.amount - a.amount);
}

export function spendByCategory(): { category: string; amount: number }[] {
  const map = new Map<string, number>();
  spend.forEach((s) => map.set(s.category, (map.get(s.category) || 0) + s.amount));
  return Array.from(map.entries())
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function monthlySpendTrend(): { month: string; amount: number }[] {
  const map = new Map<string, number>();
  spend.forEach((s) => {
    const key = s.date.slice(0, 7);
    map.set(key, (map.get(key) || 0) + s.amount);
  });
  return Array.from(map.entries())
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function averageContractValueByCategory(category: string): number {
  const values = contracts.filter((c) => c.category === category).map((c) => c.value);
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function averageSpendByVendor(vendorId: string): number {
  const rows = spend.filter((s) => s.vendorId === vendorId);
  if (!rows.length) return 0;
  return rows.reduce((sum, s) => sum + s.amount, 0) / rows.length;
}

export function vendorRevenue(vendorId: string): number {
  return spend.filter((s) => s.vendorId === vendorId).reduce((sum, s) => sum + s.amount, 0);
}

export function vendorClientCount(vendorId: string): number {
  return new Set(spend.filter((s) => s.vendorId === vendorId).map(() => "client")).size;
}
