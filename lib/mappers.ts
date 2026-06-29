// Converts raw Aurora DSQL rows (snake_case, NUMERIC-as-string, DATE-as-Date)
// into the camelCase shapes the frontend expects.

function num(v: unknown): number {
  if (v === null || v === undefined) return 0
  return typeof v === "string" ? Number.parseFloat(v) : (v as number)
}

function dateStr(v: unknown): string {
  if (!v) return ""
  if (v instanceof Date) return v.toISOString().split("T")[0]
  // Already a string like "2024-01-01" or full ISO.
  return String(v).split("T")[0]
}

export function mapVendor(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    name: r.name as string,
    rating: num(r.rating),
    category: r.category as string,
  }
}

export function mapContract(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    vendorId: r.vendor_id as string,
    value: num(r.value),
    startDate: dateStr(r.start_date),
    endDate: dateStr(r.end_date),
    paymentTerms: (r.payment_terms as string) ?? "",
    category: r.category as string,
    title: (r.title as string) ?? undefined,
  }
}

export function mapSpend(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    vendorId: r.vendor_id as string,
    amount: num(r.amount),
    date: dateStr(r.date),
    category: r.category as string,
  }
}

export function mapProduct(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    vendorId: r.vendor_id as string,
    name: r.name as string,
    description: (r.description as string) ?? "",
    price: num(r.price),
    unit: (r.unit as string) ?? "each",
    category: r.category as string,
  }
}

export function mapRequirement(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    clientName: r.client_name as string,
    title: r.title as string,
    description: (r.description as string) ?? "",
    category: r.category as string,
    budget: r.budget === null || r.budget === undefined ? undefined : num(r.budget),
    date: dateStr(r.date),
    status: r.status as "open" | "closed",
  }
}

export function mapSubscription(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    vendorId: r.vendor_id as string,
    plan: r.plan as "Starter" | "Growth" | "Enterprise",
    price: num(r.price),
    renewDate: dateStr(r.renew_date),
    status: r.status as "active" | "inactive",
  }
}

export function mapPayment(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    vendorId: r.vendor_id as string,
    amount: num(r.amount),
    date: dateStr(r.date),
    method: (r.method as string) ?? "",
    description: (r.description as string) ?? "",
  }
}

export function genId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}
