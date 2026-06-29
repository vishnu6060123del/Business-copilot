import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { getRequirements, getVendorById, updateRequirement } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Requirement } from "@/lib/types";

export function VendorClientLog() {
  const { user } = useAuth();
  const vendor = useMemo(() => getVendorById(user?.vendorId || "")!, [user]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);

  useEffect(() => {
    setRequirements(getRequirements().filter((r) => r.category === vendor.category));
  }, [vendor]);

  const toggleStatus = (req: Requirement) => {
    const next = req.status === "open" ? "closed" : "open";
    updateRequirement(req.id, { status: next });
    setRequirements(getRequirements().filter((r) => r.category === vendor.category));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Client Log</h2>
      {requirements.length ? (
        <div className="grid gap-4">
          {requirements.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{r.title}</h3>
                  <p className="text-sm text-slate-500">{r.clientName} • {formatDate(r.date)}</p>
                  <p className="mt-2 text-sm">{r.description}</p>
                  {r.budget && <p className="mt-1 text-sm font-medium">Budget: {formatCurrency(r.budget)}</p>}
                </div>
                <div className="text-right">
                  <Badge variant={r.status === "open" ? "success" : "neutral"}>{r.status}</Badge>
                  <div className="mt-2">
                    <Button size="sm" variant="outline" onClick={() => toggleStatus(r)}>
                      {r.status === "open" ? "Mark Closed" : "Reopen"}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-slate-500">No matching client requirements for {vendor.category}.</Card>
      )}
    </div>
  );
}
