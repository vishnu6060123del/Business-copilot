import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Star } from "lucide-react";
import { Badge, Card, Input, Kpi } from "@/components/ui";
import { getVendors, spendByVendor } from "@/lib/db";
import { formatCurrency } from "@/lib/format";

export function ClientVendors() {
  const [query, setQuery] = useState("");
  const vendors = useMemo(() => getVendors(), []);
  const spend = useMemo(() => {
    const map = new Map(spendByVendor().map((s) => [s.vendor.id, s.amount]));
    return map;
  }, []);

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(query.toLowerCase()) ||
      v.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vendor Details</h2>
          <p className="text-slate-500 dark:text-slate-400">Browse, filter, and evaluate suppliers.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vendors..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi label="Total Vendors" value={vendors.length.toString()} icon={<Star className="h-5 w-5" />} />
        <Kpi label="Categories" value={new Set(vendors.map((v) => v.category)).size.toString()} icon={<Star className="h-5 w-5" />} />
        <Kpi label="Avg Rating" value={(vendors.reduce((s, v) => s + v.rating, 0) / vendors.length || 0).toFixed(1)} icon={<Star className="h-5 w-5" />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((v) => (
          <Link key={v.id} to={`/client/vendors/${v.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{v.name}</h3>
                  <Badge variant="neutral" className="mt-1">{v.category}</Badge>
                </div>
                <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  <Star className="h-3 w-3 fill-current" /> {v.rating}
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-500">Total Spend</p>
                  <p className="text-lg font-bold">{formatCurrency(spend.get(v.id) || 0)}</p>
                </div>
                <span className="text-sm text-indigo-600 dark:text-indigo-400">View profile →</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
