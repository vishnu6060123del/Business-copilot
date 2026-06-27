import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Check, Plus, Scale, X } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  EmptyState,
  Select,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
} from "@/components/ui";
import { compareVendors, listVendors } from "@/server/api";
import type { Vendor } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface ComparisonRow {
  vendor: Vendor;
  totalSpend: number;
  avgContractValue: number;
  paymentTerms: string[];
  transactionCount: number;
}

export function ComparePage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [rows, setRows] = useState<ComparisonRow[]>([]);

  useEffect(() => {
    listVendors().then(setVendors);
  }, []);

  useEffect(() => {
    if (selected.length >= 2) {
      compareVendors(selected).then((data) => setRows(data as ComparisonRow[]));
    } else {
      setRows([]);
    }
  }, [selected]);

  const available = useMemo(
    () => vendors.filter((v) => !selected.includes(v.id)),
    [vendors, selected]
  );

  const addVendor = (id: string) => {
    if (selected.length < 3 && id) setSelected([...selected, id]);
  };

  const removeVendor = (id: string) => setSelected(selected.filter((s) => s !== id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Scale className="h-6 w-6 text-indigo-500" /> Supplier Comparison
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Select 2–3 vendors to compare cost, terms, and performance.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selected Vendors</CardTitle>
        </CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          {selected.map((id) => {
            const v = vendors.find((x) => x.id === id);
            if (!v) return null;
            return (
              <Badge key={id} variant="info" className="flex items-center gap-2 px-3 py-2 text-sm">
                {v.name}
                <button onClick={() => removeVendor(id)} className="rounded-full hover:bg-indigo-200/50">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
          {selected.length < 3 && (
            <div className="flex items-center gap-2">
              <Select
                value=""
                onChange={(e) => addVendor(e.target.value)}
                className="w-64"
              >
                <option value="">Add vendor...</option>
                {available.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.category})
                  </option>
                ))}
              </Select>
              <Button variant="outline" size="sm" disabled={!available.length} onClick={() => {}}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>

      {rows.length >= 2 && (
        <>
          <div className="h-80">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Total Spend Comparison</CardTitle>
              </CardHeader>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ top: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="vendor.name" tick={{ fontSize: 12 }} interval={0} />
                  <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Total Spend"]} />
                  <Bar dataKey="totalSpend" fill="#4f46e5" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Comparison Table</CardTitle>
            </CardHeader>
            <Table>
              <Thead>
                <tr>
                  <Th>Metric</Th>
                  {rows.map((r) => (
                    <Th key={r.vendor.id}>{r.vendor.name}</Th>
                  ))}
                </tr>
              </Thead>
              <Tbody>
                <tr>
                  <Td className="font-medium">Category</Td>
                  {rows.map((r) => (
                    <Td key={r.vendor.id}>
                      <Badge variant="neutral">{r.vendor.category}</Badge>
                    </Td>
                  ))}
                </tr>
                <tr>
                  <Td className="font-medium">Total Spend</Td>
                  {rows.map((r) => (
                    <Td key={r.vendor.id} className="font-semibold">{formatCurrency(r.totalSpend)}</Td>
                  ))}
                </tr>
                <tr>
                  <Td className="font-medium">Avg Contract Value</Td>
                  {rows.map((r) => (
                    <Td key={r.vendor.id}>{formatCurrency(r.avgContractValue)}</Td>
                  ))}
                </tr>
                <tr>
                  <Td className="font-medium">Performance Score</Td>
                  {rows.map((r) => (
                    <Td key={r.vendor.id}>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`h-2 w-2 rounded-full ${
                              i < Math.round(r.vendor.rating) ? "bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-xs">{r.vendor.rating}/5</span>
                      </div>
                    </Td>
                  ))}
                </tr>
                <tr>
                  <Td className="font-medium">Payment Terms</Td>
                  {rows.map((r) => (
                    <Td key={r.vendor.id}>{r.paymentTerms.join(", ") || "—"}</Td>
                  ))}
                </tr>
                <tr>
                  <Td className="font-medium">Transactions</Td>
                  {rows.map((r) => (
                    <Td key={r.vendor.id}>{r.transactionCount}</Td>
                  ))}
                </tr>
                <tr>
                  <Td className="font-medium">Best Value</Td>
                  {rows.map((r) => {
                    const best = rows.reduce((min, x) => (x.avgContractValue < min.avgContractValue ? x : min), rows[0]);
                    const isBest = r.vendor.id === best.vendor.id;
                    return (
                      <Td key={r.vendor.id}>
                        {isBest ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            <Check className="h-3 w-3" /> Lowest avg
                          </span>
                        ) : (
                          "—"
                        )}
                      </Td>
                    );
                  })}
                </tr>
              </Tbody>
            </Table>
          </Card>
        </>
      )}

      {selected.length < 2 && <EmptyState message="Select at least two vendors to start comparing." />}
    </div>
  );
}
