import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { AlertBox, Button, Card, Input, Select, Textarea } from "@/components/ui";
import { addRequirement } from "@/lib/db";

const categories = [
  "Office Supplies",
  "Technology",
  "Logistics",
  "Utilities",
  "Security",
  "Marketing",
  "Facilities",
  "Manufacturing",
  "Professional Services",
];

export function ClientRequirement() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    clientName: "",
    title: "",
    description: "",
    category: categories[0],
    budget: "",
  });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientName || !form.title || !form.description) return;
    addRequirement({
      clientName: form.clientName,
      title: form.title,
      description: form.description,
      category: form.category,
      budget: form.budget ? Number(form.budget) : undefined,
      date: new Date().toISOString().split("T")[0],
      status: "open",
    });
    setSaved(true);
    setTimeout(() => navigate("/client/vendors"), 1200);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-6 w-6 text-indigo-500" />
        <h2 className="text-2xl font-bold">Post Material Requirement</h2>
      </div>
      <p className="text-slate-500 dark:text-slate-400">
        Describe what you need. Vendors in the matching category will see it in their client log.
      </p>

      {saved && <AlertBox variant="success" title="Requirement posted">Vendors can now view and respond to your request.</AlertBox>}

      <Card>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Client / Company Name</label>
            <Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <Select value={form.category} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, category: e.target.value })}>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Title</label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Description</label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Budget (USD)</label>
            <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">Post Requirement</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
