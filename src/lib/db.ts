import type {
  Contract,
  Payment,
  Product,
  Requirement,
  Spend,
  Subscription,
  Vendor,
} from "@/lib/types";
import { formatISO, startOfMonth, subMonths } from "date-fns";

const DB_KEY = "procurement_copilot_db_v2";

let vendors: Vendor[] = [];
let contracts: Contract[] = [];
let spend: Spend[] = [];
let products: Product[] = [];
let requirements: Requirement[] = [];
let subscriptions: Subscription[] = [];
let payments: Payment[] = [];

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36).slice(-4)}`;
}

function isoMonthsAgo(n: number) {
  return subMonths(new Date(), n).toISOString().split("T")[0];
}

function isoDaysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

function seed() {
  vendors = [
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
  ];

  contracts = [
    {
      id: id("c"),
      vendorId: "v_acme",
      value: 48_000,
      startDate: isoMonthsAgo(12),
      endDate: isoDaysFromNow(14),
      paymentTerms: "Net 30",
      category: "Office Supplies",
      title: "Annual Office Supplies Agreement",
    },
    {
      id: id("c"),
      vendorId: "v_techgiant",
      value: 245_000,
      startDate: isoMonthsAgo(18),
      endDate: isoDaysFromNow(45),
      paymentTerms: "Net 45",
      category: "Technology",
      title: "Enterprise Hardware & Support",
    },
    {
      id: id("c"),
      vendorId: "v_globallog",
      value: 180_000,
      startDate: isoMonthsAgo(10),
      endDate: isoDaysFromNow(120),
      paymentTerms: "Net 30",
      category: "Logistics",
      title: "Freight & Warehousing Contract",
    },
    {
      id: id("c"),
      vendorId: "v_greenenergy",
      value: 95_000,
      startDate: isoMonthsAgo(24),
      endDate: isoDaysFromNow(8),
      paymentTerms: "Net 15",
      category: "Utilities",
      title: "Renewable Energy Supply",
    },
    {
      id: id("c"),
      vendorId: "v_safeguard",
      value: 62_000,
      startDate: isoMonthsAgo(8),
      endDate: isoDaysFromNow(200),
      paymentTerms: "Net 30",
      category: "Security",
      title: "Security Monitoring Services",
    },
    {
      id: id("c"),
      vendorId: "v_marketpro",
      value: 120_000,
      startDate: isoMonthsAgo(6),
      endDate: isoDaysFromNow(22),
      paymentTerms: "Net 45",
      category: "Marketing",
      title: "Digital Marketing Retainer",
    },
    {
      id: id("c"),
      vendorId: "v_cloudscale",
      value: 78_000,
      startDate: isoMonthsAgo(11),
      endDate: isoDaysFromNow(90),
      paymentTerms: "Net 30",
      category: "Technology",
      title: "Cloud Infrastructure Subscription",
    },
    {
      id: id("c"),
      vendorId: "v_proclean",
      value: 36_000,
      startDate: isoMonthsAgo(14),
      endDate: isoDaysFromNow(5),
      paymentTerms: "Net 15",
      category: "Facilities",
      title: "Facility Cleaning Services",
    },
    {
      id: id("c"),
      vendorId: "v_steelworks",
      value: 310_000,
      startDate: isoMonthsAgo(20),
      endDate: isoDaysFromNow(160),
      paymentTerms: "Net 60",
      category: "Manufacturing",
      title: "Raw Materials Supply",
    },
    {
      id: id("c"),
      vendorId: "v_legaleagle",
      value: 55_000,
      startDate: isoMonthsAgo(5),
      endDate: isoDaysFromNow(60),
      paymentTerms: "Net 15",
      category: "Professional Services",
      title: "Legal Advisory Retainer",
    },
    {
      id: id("c"),
      vendorId: "v_datavault",
      value: 42_000,
      startDate: isoMonthsAgo(9),
      endDate: isoDaysFromNow(18),
      paymentTerms: "Net 30",
      category: "Technology",
      title: "Backup & Disaster Recovery",
    },
    {
      id: id("c"),
      vendorId: "v_fastfleet",
      value: 150_000,
      startDate: isoMonthsAgo(7),
      endDate: isoDaysFromNow(110),
      paymentTerms: "Net 30",
      category: "Logistics",
      title: "Last-Mile Delivery Contract",
    },
  ];

  // Spend history: 12 months per vendor with realistic monthly amounts.
  spend = [];
  const baseSpend: Record<string, number> = {
    v_acme: 3_800,
    v_techgiant: 18_000,
    v_globallog: 14_000,
    v_greenenergy: 7_500,
    v_safeguard: 4_800,
    v_marketpro: 9_500,
    v_cloudscale: 6_000,
    v_proclean: 2_800,
    v_steelworks: 24_000,
    v_legaleagle: 4_200,
    v_datavault: 3_300,
    v_fastfleet: 11_500,
  };

  vendors.forEach((vendor) => {
    const base = baseSpend[vendor.id] ?? 5_000;
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(new Date(), i));
      const variance = 0.85 + Math.random() * 0.35;
      spend.push({
        id: id("s"),
        vendorId: vendor.id,
        amount: Math.round(base * variance),
        date: formatISO(monthStart).split("T")[0],
        category: vendor.category,
      });
    }
  });

  // Vendor product catalogs
  products = [
    { id: id("p"), vendorId: "v_acme", name: "A4 Copy Paper (box)", description: "Premium 500-sheet reams", price: 24.99, unit: "box", category: "Office Supplies" },
    { id: id("p"), vendorId: "v_acme", name: "Ergonomic Office Chair", description: "Adjustable lumbar support", price: 199.0, unit: "each", category: "Office Supplies" },
    { id: id("p"), vendorId: "v_techgiant", name: "Business Laptop", description: "14-inch Intel Core i7", price: 1_299.0, unit: "each", category: "Technology" },
    { id: id("p"), vendorId: "v_techgiant", name: "IT Support Hours", description: "Remote and on-site support", price: 150.0, unit: "hour", category: "Technology" },
    { id: id("p"), vendorId: "v_globallog", name: "Freight Shipment", description: "Domestic pallet transport", price: 450.0, unit: "shipment", category: "Logistics" },
    { id: id("p"), vendorId: "v_greenenergy", name: "Renewable Energy kWh", description: "Green electricity credit", price: 0.12, unit: "kWh", category: "Utilities" },
    { id: id("p"), vendorId: "v_safeguard", name: "Security Camera Kit", description: "4-camera surveillance system", price: 899.0, unit: "kit", category: "Security" },
    { id: id("p"), vendorId: "v_marketpro", name: "Campaign Management", description: "Monthly retainer", price: 8_500.0, unit: "month", category: "Marketing" },
    { id: id("p"), vendorId: "v_cloudscale", name: "Cloud Compute", description: "Reserved instances", price: 2_400.0, unit: "month", category: "Technology" },
    { id: id("p"), vendorId: "v_proclean", name: "Office Cleaning", description: "Daily janitorial service", price: 1_200.0, unit: "month", category: "Facilities" },
    { id: id("p"), vendorId: "v_steelworks", name: "Steel Sheet", description: "Cold-rolled steel", price: 650.0, unit: "ton", category: "Manufacturing" },
    { id: id("p"), vendorId: "v_legaleagle", name: "Legal Consultation", description: "Hourly legal counsel", price: 350.0, unit: "hour", category: "Professional Services" },
    { id: id("p"), vendorId: "v_datavault", name: "Backup Storage", description: "1 TB encrypted backup", price: 95.0, unit: "TB/month", category: "Technology" },
    { id: id("p"), vendorId: "v_fastfleet", name: "Last-Mile Delivery", description: "Same-day local delivery", price: 28.0, unit: "parcel", category: "Logistics" },
  ];

  // Client material requirements posted to the marketplace
  requirements = [
    {
      id: id("r"),
      clientName: "Apex Manufacturing",
      title: "Steel sheets for Q3 production",
      description: "Need 50 tons of cold-rolled steel sheets delivered by next month.",
      category: "Manufacturing",
      budget: 35_000,
      date: isoMonthsAgo(0),
      status: "open",
    },
    {
      id: id("r"),
      clientName: "BrightStart Offices",
      title: "Office furniture refresh",
      description: "Looking for 30 ergonomic chairs and 10 desks.",
      category: "Office Supplies",
      budget: 8_000,
      date: isoMonthsAgo(0),
      status: "open",
    },
    {
      id: id("r"),
      clientName: "CloudFirst Inc",
      title: "Cloud migration support",
      description: "Need 200 hours of cloud engineering support.",
      category: "Technology",
      budget: 50_000,
      date: isoDaysFromNow(-2),
      status: "open",
    },
  ];

  // Vendor subscriptions
  subscriptions = vendors.map((vendor) => ({
    id: id("sub"),
    vendorId: vendor.id,
    plan: (["Starter", "Growth", "Enterprise"] as const)[Math.floor(Math.random() * 3)],
    price: [99, 299, 799][Math.floor(Math.random() * 3)],
    renewDate: isoDaysFromNow(30 + Math.floor(Math.random() * 60)),
    status: "active" as const,
  }));

  // Vendor payment history
  payments = vendors.flatMap((vendor) => {
    const count = 2 + Math.floor(Math.random() * 3);
    return Array.from({ length: count }).map(() => ({
      id: id("pay"),
      vendorId: vendor.id,
      amount: [49, 99, 299, 799][Math.floor(Math.random() * 4)],
      date: isoMonthsAgo(Math.floor(Math.random() * 6)),
      method: ["Credit Card", "ACH", "Wire Transfer"][Math.floor(Math.random() * 3)],
      description: "Subscription payment",
    }));
  });

  save();
}

function save() {
  try {
    localStorage.setItem(
      DB_KEY,
      JSON.stringify({ vendors, contracts, spend, products, requirements, subscriptions, payments })
    );
  } catch {
    // ignore storage errors
  }
}

function load() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as {
        vendors: Vendor[];
        contracts: Contract[];
        spend: Spend[];
        products: Product[];
        requirements: Requirement[];
        subscriptions: Subscription[];
        payments: Payment[];
      };
      vendors = parsed.vendors || [];
      contracts = parsed.contracts || [];
      spend = parsed.spend || [];
      products = parsed.products || [];
      requirements = parsed.requirements || [];
      subscriptions = parsed.subscriptions || [];
      payments = parsed.payments || [];
      return;
    }
  } catch {
    // fall through to seed
  }
  seed();
}

load();

export function resetDatabase() {
  seed();
}

export function getVendors(): Vendor[] {
  return vendors;
}

export function getVendorById(id: string): Vendor | undefined {
  return vendors.find((v) => v.id === id);
}

export function updateVendor(id: string, updates: Partial<Vendor>): Vendor | undefined {
  const idx = vendors.findIndex((v) => v.id === id);
  if (idx < 0) return undefined;
  vendors[idx] = { ...vendors[idx], ...updates };
  save();
  return vendors[idx];
}

export function addVendor(vendor: Omit<Vendor, "id">): Vendor {
  const newVendor: Vendor = { ...vendor, id: id("v") };
  vendors.push(newVendor);
  save();
  return newVendor;
}

export function getContracts(): Contract[] {
  return contracts.slice().sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
}

export function getContractById(id: string): Contract | undefined {
  return contracts.find((c) => c.id === id);
}

export function getContractsByVendor(vendorId: string): Contract[] {
  return contracts.filter((c) => c.vendorId === vendorId);
}

export function addContract(contract: Omit<Contract, "id">): Contract {
  const newContract: Contract = { ...contract, id: id("c") };
  contracts.push(newContract);
  save();
  return newContract;
}

export function deleteContract(id: string): boolean {
  const idx = contracts.findIndex((c) => c.id === id);
  if (idx >= 0) {
    contracts.splice(idx, 1);
    save();
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
  save();
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
  save();
  return newProduct;
}

export function deleteProduct(id: string): boolean {
  const idx = products.findIndex((p) => p.id === id);
  if (idx >= 0) {
    products.splice(idx, 1);
    save();
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
  save();
  return newRequirement;
}

export function updateRequirement(id: string, updates: Partial<Requirement>): Requirement | undefined {
  const idx = requirements.findIndex((r) => r.id === id);
  if (idx < 0) return undefined;
  requirements[idx] = { ...requirements[idx], ...updates };
  save();
  return requirements[idx];
}

export function getSubscriptionByVendor(vendorId: string): Subscription | undefined {
  return subscriptions.find((s) => s.vendorId === vendorId);
}

export function updateSubscription(vendorId: string, updates: Partial<Subscription>): Subscription | undefined {
  const idx = subscriptions.findIndex((s) => s.vendorId === vendorId);
  if (idx < 0) return undefined;
  subscriptions[idx] = { ...subscriptions[idx], ...updates };
  save();
  return subscriptions[idx];
}

export function getPaymentsByVendor(vendorId: string): Payment[] {
  return payments.filter((p) => p.vendorId === vendorId).sort((a, b) => b.date.localeCompare(a.date));
}

export function addPayment(payment: Omit<Payment, "id">): Payment {
  const newPayment: Payment = { ...payment, id: id("pay") };
  payments.push(newPayment);
  save();
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
