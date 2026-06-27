import { useEffect, useState } from "react";
import { Button, Card, EmptyState, Input } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { getVendorById, updateVendor } from "@/lib/db";
import type { Vendor } from "@/lib/types";

export function VendorProfile() {
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user?.vendorId) setVendor(getVendorById(user.vendorId) || null);
  }, [user]);

  if (!vendor) return <EmptyState message="Vendor profile not found." />;

  const handleSave = () => {
    updateVendor(vendor.id, { name: vendor.name, category: vendor.category, rating: vendor.rating });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold">Vendor Profile</h2>
      <Card className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Company Name</label>
          <Input value={vendor.name} onChange={(e) => setVendor({ ...vendor, name: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <Input value={vendor.category} onChange={(e) => setVendor({ ...vendor, category: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Rating</label>
          <Input
            type="number"
            min={0}
            max={5}
            step={0.1}
            value={vendor.rating}
            onChange={(e) => setVendor({ ...vendor, rating: Number(e.target.value) })}
          />
        </div>
        <Button onClick={handleSave}>{saved ? "Saved!" : "Save Profile"}</Button>
      </Card>
    </div>
  );
}
