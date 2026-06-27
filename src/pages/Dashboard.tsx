import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowUpRight,
  DollarSign,
  FileText,
  TrendingDown,
  Users,
} from "lucide-react";
import {
  AlertBox,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
} from "@/components/ui";
import type { Alert, DashboardSummary } from "@/server/api";
import { getDashboardSummary } from "@/server/api";
import { formatCurrency } from "@/lib/format";
import { Link } from "react-router-dom";

export function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    getDashboardSummary().then(setSummary);
  }, []);

  const overpaymentTotal = useMemo(() => {
    if (!summary) return 0;
    return summary.alerts.filter((a) => a.title.includes("High-cost")).length;
  }, [summary]);

  if (!summary) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Spend"
          value={formatCurrency(summary.totalSpend)}
          icon={<DollarSign className="h-5 w-5" />}
          trend="+4.2% vs last year"
        />
        <KpiCard
          label="Active Contracts"
          value={summary.activeContracts.toString()}
          icon={<FileText className="h-5 w-5" />}
          trend="3 pending renewal"
        />
        <KpiCard
          label="Suppliers"
          value={summary.topSuppliers.length.toString()}
          icon={<Users className="h-5 w-5" />}
          trend="2 new this quarter"
        />
        <KpiCard
          label="Overpayment Alerts"
          value={overpaymentTotal.toString()}
          icon={<TrendingDown className="h-5 w-5" />}
          trend="Action recommended"
          trendBad
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Spend Trend</CardTitle>
            <Badge variant="info">Trailing 12 months</Badge>
          </CardHeader>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summary.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis
                  dataKey="month"
                  tickFormatter={(v: string) => {
                    const [y, m] = v.split("-");
                    return `${m}/${y.slice(2)}`;
                  }}
                  stroke="#94a3b8"
                  fontSize={12}
                />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "Spend"]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#4f46e5" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
          </CardHeader>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.categorySpend} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} stroke="#94a3b8" fontSize={12} />
                <YAxis type="category" dataKey="category" width={100} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Spend"]} />
                <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                  {summary.categorySpend.map((_, i) => (
                    <Cell key={`cell-${i}`} fill={["#4f46e5", "#0ea5e9", "#8b5cf6", "#f59e0b", "#10b981", "#ef4444"][i % 6]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top Suppliers by Spend</CardTitle>
          </CardHeader>
          {summary.topSuppliers.length ? (
            <Table>
              <Thead>
                <tr>
                  <Th>Supplier</Th>
                  <Th>Category</Th>
                  <Th>Rating</Th>
                  <Th className="text-right">Total Spend</Th>
                  <Th className="text-right">Share</Th>
                </tr>
              </Thead>
              <Tbody>
                {summary.topSuppliers.map((row) => {
                  const share = summary.totalSpend ? (row.amount / summary.totalSpend) * 100 : 0;
                  return (
                    <tr key={row.vendor.id}>
                      <Td className="font-medium">{row.vendor.name}</Td>
                      <Td>
                        <Badge variant="neutral">{row.vendor.category}</Badge>
                      </Td>
                      <Td>{row.vendor.rating}/5</Td>
                      <Td className="text-right font-semibold">{formatCurrency(row.amount)}</Td>
                      <Td className="text-right">{share.toFixed(1)}%</Td>
                    </tr>
                  );
                })}
              </Tbody>
            </Table>
          ) : (
            <EmptyState message="No spend data available." />
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              AI Alerts
            </CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {summary.alerts.slice(0, 8).map((alert) => (
              <AlertRow key={alert.id} alert={alert} />
            ))}
            {!summary.alerts.length && <EmptyState message="No active alerts. Great job!" />}
          </div>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  trend,
  trendBad,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  trendBad?: boolean;
}) {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        <p className={`mt-1 text-xs ${trendBad ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
          {trend}
        </p>
      </div>
      <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
        {icon}
      </div>
    </Card>
  );
}

function AlertRow({ alert }: { alert: Alert }) {
  const variant = alert.type === "danger" ? "danger" : alert.type === "warning" ? "warning" : "info";
  return (
    <AlertBox variant={variant} title={alert.title}>
      <div className="flex items-start justify-between gap-3">
        <p>{alert.message}</p>
        {alert.vendorId && (
          <Link to={`/client/vendors/${alert.vendorId}`}>
            <Button variant="ghost" size="sm" className="shrink-0">
              View <ArrowUpRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        )}
      </div>
    </AlertBox>
  );
}
