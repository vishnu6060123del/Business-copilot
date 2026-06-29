import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Bot, Calendar, DollarSign, Mail, Package, Scale, Star } from "lucide-react";
import { Badge, Button, Card, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { getContractsByVendor, getProductsByVendor, getVendorById, vendorRevenue } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";

export function ClientVendorDetail() {
  const { id } = useParams<{ id: string }>();
  const vendor = useMemo(() => (id ? getVendorById(id) : undefined), [id]);
  const products = useMemo(() => (vendor ? getProductsByVendor(vendor.id) : []), [vendor]);
  const contracts = useMemo(() => (vendor ? getContractsByVendor(vendor.id) : []), [vendor]);
  const revenue = useMemo(() => (vendor ? vendorRevenue(vendor.id) : 0), [vendor]);

  if (!vendor) {
    return (
      <div className="space-y-4">
        <Link to="/client/vendors" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to vendors
        </Link>
        <EmptyState message="Vendor not found." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/client/vendors" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Link>
        <div className="flex gap-2">
          <Link to="/client/compare">
            <Button variant="outline" size="sm" className="gap-1">
              <Scale className="h-4 w-4" /> Compare
            </Button>
          </Link>
          <Link to="/client/chat">
            <Button variant="outline" size="sm" className="gap-1">
              <Bot className="h-4 w-4" /> Ask AI
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">{vendor.name}</h2>
            <Badge variant="neutral" className="mt-1">{vendor.category}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
              <Star className="h-4 w-4 fill-current" /> {vendor.rating}/5
            </div>
            <Button size="sm" className="gap-1">
              <Mail className="h-4 w-4" /> Contact
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Total Spend</p>
          <p className="text-2xl font-bold">{formatCurrency(revenue)}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Active Contracts</p>
          <p className="text-2xl font-bold">{contracts.filter((c) => new Date(c.endDate) >= new Date()).length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Products</p>
          <p className="text-2xl font-bold">{products.length}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-500" /> Products & Services
            </CardTitle>
          </CardHeader>
          {products.length ? (
            <div className="space-y-3">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.description}</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(p.price)}<span className="text-xs font-normal text-slate-500">/{p.unit}</span></p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No products listed." />
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-indigo-500" /> Contracts
            </CardTitle>
          </CardHeader>
          {contracts.length ? (
            <div className="space-y-3">
              {contracts.map((c) => (
                <div key={c.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{c.title}</p>
                    <Badge variant={new Date(c.endDate) >= new Date() ? "success" : "neutral"}>{new Date(c.endDate) >= new Date() ? "Active" : "Expired"}</Badge>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Ends {formatDate(c.endDate)}</span>
                    <span>{formatCurrency(c.value)}</span>
                    <span>{c.paymentTerms}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No contracts with this vendor." />
          )}
        </Card>
      </div>
    </div>
  );
}
