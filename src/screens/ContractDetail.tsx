import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Bot, Calendar, DollarSign, FileText, TrendingUp, User } from "lucide-react";
import { AlertBox, Badge, Card, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import type { Contract, Insight } from "@/lib/types";
import { averageContractValueByCategory, getContractById, getVendorById, spendByVendor } from "@/lib/db";
import { fetchContractInsights } from "@/server/api";
import { recommendVendors } from "@/lib/ai";
import { formatCurrency, formatDate } from "@/lib/format";

export function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    if (!id) return;
    const c = getContractById(id);
    if (c) {
      setContract(c);
      fetchContractInsights(id).then(setInsights);
    }
  }, [id]);

  const vendor = useMemo(() => (contract ? getVendorById(contract.vendorId) : undefined), [contract]);
  const categoryAvg = useMemo(
    () => (contract ? averageContractValueByCategory(contract.category) : 0),
    [contract]
  );
  const alternatives = useMemo(
    () => (contract ? recommendVendors(contract.category, contract.vendorId).slice(0, 3) : []),
    [contract]
  );
  const vendorRank = useMemo(() => {
    const ranking = spendByVendor();
    const idx = ranking.findIndex((r) => r.vendor.id === contract?.vendorId);
    return idx >= 0 ? idx + 1 : undefined;
  }, [contract]);

  if (!contract) {
    return (
      <div className="space-y-4">
        <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to dashboard
        </Link>
        <EmptyState message="Contract not found." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to="/" className="inline-flex items-center text-sm text-slate-500 hover:text-indigo-600 dark:text-slate-400">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Link>
        <Badge variant={new Date(contract.endDate) >= new Date() ? "success" : "danger"}>
          {new Date(contract.endDate) >= new Date() ? "Active" : "Expired"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              <CardTitle>{contract.title}</CardTitle>
            </div>
          </CardHeader>
          <div className="grid gap-6 sm:grid-cols-2">
            <DataRow icon={<User className="h-4 w-4" />} label="Vendor" value={vendor?.name ?? "Unknown"} />
            <DataRow icon={<DollarSign className="h-4 w-4" />} label="Contract Value" value={formatCurrency(contract.value)} />
            <DataRow icon={<Calendar className="h-4 w-4" />} label="Start Date" value={formatDate(contract.startDate)} />
            <DataRow icon={<Calendar className="h-4 w-4" />} label="End / Renewal Date" value={formatDate(contract.endDate)} />
            <DataRow icon={<TrendingUp className="h-4 w-4" />} label="Payment Terms" value={contract.paymentTerms} />
            <DataRow icon={<Badge variant="neutral">{contract.category}</Badge>} label="Category" value="" />
          </div>
          {categoryAvg > 0 && (
            <div className="mt-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <p className="text-sm text-slate-500 dark:text-slate-400">Category average contract value</p>
              <p className="text-xl font-bold">{formatCurrency(categoryAvg)}</p>
              <p className="text-xs text-slate-400">
                This contract is {contract.value > categoryAvg ? `${Math.round(((contract.value - categoryAvg) / categoryAvg) * 100)}% above` : `${Math.round(((categoryAvg - contract.value) / categoryAvg) * 100)}% below`} average
              </p>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-500" />
              <CardTitle>AI Insights</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-3">
            {insights.length ? (
              insights.map((insight) => (
                <AlertBox
                  key={insight.id}
                  variant={insight.severity === "high" ? "danger" : insight.severity === "medium" ? "warning" : "info"}
                  title={insight.label}
                >
                  {insight.description}
                </AlertBox>
              ))
            ) : (
              <EmptyState message="No insights for this contract." />
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recommended Alternative Vendors</CardTitle>
        </CardHeader>
        {alternatives.length ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {alternatives.map((alt) => (
              <div
                key={alt.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60"
              >
                <p className="font-semibold">{alt.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{alt.category}</p>
                <p className="mt-2 text-sm">Rating: {alt.rating}/5</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="No lower-cost alternatives found in this category." />
        )}
      </Card>

      {vendorRank && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {vendor?.name} ranks #{vendorRank} in total spend across all suppliers.
        </p>
      )}
    </div>
  );
}

function DataRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-slate-400">{icon}</div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className="font-medium text-slate-900 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}
