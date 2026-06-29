import { useEffect, useState } from "react";
import { Badge, Button, Card, Input } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { addProduct, deleteProduct, getProductsByVendor } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import type { Product } from "@/lib/types";

export function VendorProducts() {
  const { user } = useAuth();
  const vendorId = user?.vendorId || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({ category: "" });

  useEffect(() => {
    setProducts(getProductsByVendor(vendorId));
  }, [vendorId]);

  const handleAdd = () => {
    if (!form.name || !form.price) return;
    addProduct({
      vendorId,
      name: form.name,
      description: form.description || "",
      price: Number(form.price),
      unit: form.unit || "each",
      category: form.category || "General",
    });
    setProducts(getProductsByVendor(vendorId));
    setForm({ category: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Products & Services</h2>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? "Cancel" : "Add Product"}</Button>
      </div>

      {showForm && (
        <Card className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Price</label>
            <Input type="number" value={form.price || ""} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Unit</label>
            <Input value={form.unit || ""} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="each, hour, ton" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <Input value={form.category || ""} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Description</label>
            <Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={handleAdd}>Save Product</Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <Card key={p.id}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold">{p.name}</h3>
                <p className="text-sm text-slate-500">{p.description}</p>
              </div>
              <button onClick={() => { deleteProduct(p.id); setProducts(getProductsByVendor(vendorId)); }} className="text-rose-500 hover:text-rose-700">
                ✕
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <Badge variant="info">{p.category}</Badge>
              <p className="font-bold">{formatCurrency(p.price)} <span className="text-xs font-normal text-slate-500">/ {p.unit}</span></p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
