import { useEffect, useState } from "react";
import { Button, Card, EmptyState, Input, Select, Table, Tbody, Td, Th, Thead } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { addPayment, getPaymentsByVendor } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Payment } from "@/lib/types";
import { PaymentGatewayModal } from "@/components/PaymentGatewayModal";

export function VendorPayments() {
  const { user } = useAuth();
  const vendorId = user?.vendorId || "";
  const [payments, setPayments] = useState<Payment[]>([]);
  
  // Manual record form state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Payment>>({ method: "Credit Card" });

  // Gateway form state
  const [showGatewayForm, setShowGatewayForm] = useState(false);
  const [gatewayAmount, setGatewayAmount] = useState("");
  const [gatewayDescription, setGatewayDescription] = useState("");
  const [openGatewayModal, setOpenGatewayModal] = useState(false);
  const [gatewayError, setGatewayError] = useState("");

  useEffect(() => {
    setPayments(getPaymentsByVendor(vendorId));
  }, [vendorId]);

  const handleAdd = () => {
    if (!form.amount || !form.date) return;
    addPayment({
      vendorId,
      amount: Number(form.amount),
      date: form.date,
      method: form.method || "Credit Card",
      description: form.description || "Payment",
    });
    setPayments(getPaymentsByVendor(vendorId));
    setForm({ method: "Credit Card" });
    setShowForm(false);
  };

  const handleOpenGatewayModal = () => {
    const amt = Number(gatewayAmount);
    if (!gatewayAmount || isNaN(amt) || amt <= 0) {
      setGatewayError("Please enter a valid amount greater than $0.");
      return;
    }
    setGatewayError("");
    setOpenGatewayModal(true);
  };

  const handleGatewaySuccess = () => {
    addPayment({
      vendorId,
      amount: Number(gatewayAmount),
      date: new Date().toISOString().split("T")[0],
      method: "Credit Card (Gateway)",
      description: gatewayDescription || "Online Payment",
    });
    setPayments(getPaymentsByVendor(vendorId));
    setGatewayAmount("");
    setGatewayDescription("");
    setShowGatewayForm(false);
    setOpenGatewayModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Payment Details</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">View payment history or process new transactions.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowGatewayForm(!showGatewayForm);
              setShowForm(false);
            }}
          >
            {showGatewayForm ? "Cancel" : "Pay via Gateway"}
          </Button>
          <Button
            onClick={() => {
              setShowForm(!showForm);
              setShowGatewayForm(false);
            }}
          >
            {showForm ? "Cancel" : "Record Payment"}
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="grid gap-4 sm:grid-cols-2 animate-scale-in">
          <div>
            <label className="mb-1 block text-sm font-medium">Amount</label>
            <Input type="number" value={form.amount || ""} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Date</label>
            <Input type="date" value={form.date || ""} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Method</label>
            <Select value={form.method || "Credit Card"} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option>Credit Card</option>
              <option>ACH</option>
              <option>Wire Transfer</option>
              <option>Check</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <Input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Button onClick={handleAdd}>Save Payment</Button>
          </div>
        </Card>
      )}

      {showGatewayForm && (
        <Card className="grid gap-4 sm:grid-cols-2 animate-scale-in max-w-xl">
          <div className="sm:col-span-2">
            <h3 className="text-lg font-semibold">Pay Online via Gateway</h3>
            <p className="text-xs text-slate-500 mt-0.5">Use the simulated payment gateway to process a card payment.</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Amount ($)</label>
            <Input
              type="number"
              placeholder="e.g. 500"
              value={gatewayAmount}
              onChange={(e) => setGatewayAmount(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <Input
              type="text"
              placeholder="e.g. Q3 Office Supplies"
              value={gatewayDescription}
              onChange={(e) => setGatewayDescription(e.target.value)}
            />
          </div>
          {gatewayError && (
            <div className="sm:col-span-2 text-sm font-medium text-rose-500 dark:text-rose-400">
              ⚠️ {gatewayError}
            </div>
          )}
          <div className="sm:col-span-2 pt-2">
            <Button onClick={handleOpenGatewayModal}>Continue to Checkout</Button>
          </div>
        </Card>
      )}

      <Card>
        <Table>
          <Thead>
            <tr>
              <Th>Date</Th>
              <Th>Description</Th>
              <Th>Method</Th>
              <Th className="text-right">Amount</Th>
            </tr>
          </Thead>
          <Tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <Td>{formatDate(p.date)}</Td>
                <Td>{p.description}</Td>
                <Td>
                  <span className={p.method.includes("Gateway") ? "font-medium text-indigo-600 dark:text-indigo-400" : ""}>
                    {p.method}
                  </span>
                </Td>
                <Td className="text-right font-semibold">{formatCurrency(p.amount)}</Td>
              </tr>
            ))}
          </Tbody>
        </Table>
        {!payments.length && <EmptyState message="No payment records." />}
      </Card>

      {openGatewayModal && (
        <PaymentGatewayModal
          open={openGatewayModal}
          onClose={() => setOpenGatewayModal(false)}
          amount={Number(gatewayAmount)}
          description={gatewayDescription || "Online Payment"}
          onSuccess={handleGatewaySuccess}
          title="Online Payment Gateway"
        />
      )}
    </div>
  );
}

