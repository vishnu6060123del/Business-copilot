import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileUp, Loader2, RefreshCcw, Save, Sparkles } from "lucide-react";
import {
  AlertBox,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  Input,
  Select,
} from "@/components/ui";
import { createContract, uploadContractPDF } from "@/server/api";
import { addVendor, getVendors } from "@/lib/db";
import type { Contract } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

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

interface ExtractedForm {
  vendorName?: string;
  title?: string;
  value?: number;
  startDate?: string;
  endDate?: string;
  paymentTerms?: string;
  category?: string;
  rawText: string;
}

export function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<ExtractedForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedContract, setSavedContract] = useState<Contract | null>(null);

  const handleFile = useCallback(async (selected: File | null) => {
    if (!selected) return;
    setFile(selected);
    setError(null);
    setExtracted(null);
    setSavedContract(null);
    setLoading(true);
    try {
      const result = await uploadContractPDF(selected, false);
      setExtracted({
        vendorName: result.extracted.vendorName,
        title: result.extracted.title,
        value: result.extracted.value,
        startDate: result.extracted.startDate,
        endDate: result.extracted.endDate,
        paymentTerms: result.extracted.paymentTerms,
        category: result.extracted.category,
        rawText: result.extracted.rawText,
      });
    } catch (e) {
      setError("Could not extract text from PDF. You can still enter the contract details manually.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files?.[0];
      if (f && f.type === "application/pdf") handleFile(f);
    },
    [handleFile]
  );

  const handleSave = async () => {
    if (!extracted) return;
    const vendorName = extracted.vendorName || "Unknown Vendor";
    let vendor = getVendors().find((v) => v.name.toLowerCase() === vendorName.toLowerCase());
    if (!vendor) {
      vendor = addVendor({
        name: vendorName,
        rating: 4.0,
        category: extracted.category || "Professional Services",
      });
    }
    const contract = await createContract({
      vendorId: vendor.id,
      value: extracted.value ?? 0,
      startDate: extracted.startDate || new Date().toISOString().split("T")[0],
      endDate: extracted.endDate || new Date().toISOString().split("T")[0],
      paymentTerms: extracted.paymentTerms || "Net 30",
      category: extracted.category || vendor.category,
      title: extracted.title || file?.name.replace(/\.pdf$/i, "") || "New Contract",
    });
    setSavedContract(contract);
  };

  const updateField = <K extends keyof ExtractedForm>(key: K, value: ExtractedForm[K]) => {
    setExtracted((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Upload Contract</h2>
        <p className="text-slate-500 dark:text-slate-400">Drag & drop a PDF or click to browse.</p>
      </div>

      {!extracted && !savedContract && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center transition-colors hover:border-indigo-500 hover:bg-indigo-50/30 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-400 dark:hover:bg-slate-800/50"
        >
          <input
            type="file"
            accept="application/pdf"
            className="hidden"
            id="pdf-upload"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <label htmlFor="pdf-upload" className="flex cursor-pointer flex-col items-center">
            <div className="mb-4 rounded-full bg-indigo-100 p-4 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : <FileUp className="h-8 w-8" />}
            </div>
            <p className="text-lg font-medium">
              {loading ? "Extracting contract data with AI..." : "Click or drag PDF here"}
            </p>
            <p className="mt-1 text-sm text-slate-500">Supports single PDF contracts up to 10 MB</p>
          </label>
        </div>
      )}

      {error && <AlertBox variant="warning" title="Extraction notice">{error}</AlertBox>}

      {extracted && !savedContract && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <CardTitle>AI-Extracted Fields</CardTitle>
            </div>
            <Badge variant="info">Review & edit before saving</Badge>
          </CardHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vendor Name">
              <Input
                value={extracted.vendorName || ""}
                onChange={(e) => updateField("vendorName", e.target.value)}
                placeholder="e.g. Acme Office Supplies"
              />
            </Field>
            <Field label="Contract Title">
              <Input
                value={extracted.title || ""}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. Annual Service Agreement"
              />
            </Field>
            <Field label="Contract Value">
              <Input
                type="number"
                value={extracted.value ?? ""}
                onChange={(e) => updateField("value", Number(e.target.value))}
                placeholder="0"
              />
            </Field>
            <Field label="Category">
              <Select
                value={extracted.category || ""}
                onChange={(e) => updateField("category", e.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Start Date">
              <Input
                type="date"
                value={extracted.startDate || ""}
                onChange={(e) => updateField("startDate", e.target.value)}
              />
            </Field>
            <Field label="End / Renewal Date">
              <Input
                type="date"
                value={extracted.endDate || ""}
                onChange={(e) => updateField("endDate", e.target.value)}
              />
            </Field>
            <Field label="Payment Terms" className="sm:col-span-2">
              <Input
                value={extracted.paymentTerms || ""}
                onChange={(e) => updateField("paymentTerms", e.target.value)}
                placeholder="e.g. Net 30"
              />
            </Field>
          </div>
          <div className="mt-6 flex gap-3">
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" /> Save Contract
            </Button>
            <Button variant="outline" onClick={() => { setFile(null); setExtracted(null); setError(null); }} className="gap-2">
              <RefreshCcw className="h-4 w-4" /> Reset
            </Button>
          </div>
        </Card>
      )}

      {savedContract && (
        <AlertBox variant="success" title="Contract saved">
          <p className="mb-3">
            Saved <strong>{savedContract.title}</strong> valued at {formatCurrency(savedContract.value)}. AI insights are
            ready.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => navigate(`/contracts/${savedContract.id}`)}>View AI Insights</Button>
            <Button variant="outline" onClick={() => { setFile(null); setExtracted(null); setSavedContract(null); }}>
              Upload Another
            </Button>
          </div>
        </AlertBox>
      )}
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
      {children}
    </div>
  );
}
