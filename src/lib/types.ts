export interface Vendor {
  id: string;
  name: string;
  rating: number;
  category: string;
}

export interface Contract {
  id: string;
  vendorId: string;
  value: number;
  startDate: string; // ISO date
  endDate: string;
  paymentTerms: string;
  category: string;
  title?: string;
}

export interface Spend {
  id: string;
  vendorId: string;
  amount: number;
  date: string; // ISO date
  category: string;
}

export interface Alert {
  id: string;
  type: "warning" | "danger" | "success" | "info";
  title: string;
  message: string;
  contractId?: string;
  vendorId?: string;
}

export interface Insight {
  id: string;
  contractId: string;
  label: string;
  severity: "low" | "medium" | "high";
  description: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  category: string;
}

export interface Requirement {
  id: string;
  clientName: string;
  title: string;
  description: string;
  category: string;
  budget?: number;
  date: string;
  status: "open" | "closed";
}

export interface Subscription {
  id: string;
  vendorId: string;
  plan: "Starter" | "Growth" | "Enterprise";
  price: number;
  renewDate: string;
  status: "active" | "inactive";
}

export interface Payment {
  id: string;
  vendorId: string;
  amount: number;
  date: string;
  method: string;
  description: string;
}

export interface User {
  role: "vendor" | "client";
  name: string;
  vendorId?: string;
}
