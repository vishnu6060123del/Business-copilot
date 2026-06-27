import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Package, Receipt, TrendingUp, Users } from "lucide-react";
import { Badge, Card, CardHeader, CardTitle, EmptyState, Kpi } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { getPaymentsByVendor, getProductsByVendor, getRequirements, getSubscriptionByVendor, getVendorById, vendorRevenue } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";

export function VendorDashboard() {
  const { user } = useAuth();
  const vendor = useMemo(() => getVendorById(user?.vendorId || "")!, [user]);
  const revenue = useMemo(() => vendorRevenue(vendor.id), [vendor]);
  const products = useMemo(() => getProductsByVendor(vendor.id), [vendor]);
  const requirements = useMemo(
    () => getRequirements().filter((r) => r.category === vendor.category || r.category === "Any"),
    [vendor]
  );
  const subscription = useMemo(() => getSubscriptionByVendor(vendor.id), [vendor]);
  const payments = useMemo(() => getPaymentsByVendor(vendor.id).slice(0, 5), [vendor]);

  const monthlyRevenue = useMemo(() => {
    const map = new Map<string, number>();
    getPaymentsByVendor(vendor.id).forEach((p) => {
      const key = p.date.slice(0, 7);
      map.set(key, (map.get(key) || 0) + p.amount);
    });
    return Array.from(map.entries())
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [vendor]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Vendor Dashboard</h2>
        <p className="text-slate-500 dark:text-slate-400">Welcome back, {vendor.name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={<TrendingUp className="h-5 w-5" />} label="Total Revenue" value={formatCurrency(revenue)} />
        <Kpi icon={<Package className="h-5 w-5" />} label="Products" value={products.length.toString()} />
        <Kpi icon={<Users className="h-5 w-5" />} label="Open Requirements" value={requirements.filter((r) => r.status === "open").length.toString()} />
        <Kpi icon={<Receipt className="h-5 w-5" />} label="Plan" value={subscription?.plan ?? "—"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Payment Revenue Trend</CardTitle>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Revenue"]} />
                <Bar dataKey="amount" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
          </CardHeader>
          {subscription ? (
            <div className="space-y-2">
              <p className="text-2xl font-bold">{subscription.plan}</p>
              <p className="text-slate-500">{formatCurrency(subscription.price)}/month</p>
              <Badge variant={subscription.status === "active" ? "success" : "neutral"}>{subscription.status}</Badge>
              <p className="text-xs text-slate-400">Renews {formatDate(subscription.renewDate)}</p>
            </div>
          ) : (
            <EmptyState message="No subscription found." />
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        {payments.length ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-800/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Method</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">{formatDate(p.date)}</td>
                    <td className="px-4 py-3">{p.description}</td>
                    <td className="px-4 py-3">{p.method}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatCurrency(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="No payments yet." />
        )}
      </Card>
    </div>
  );
}
