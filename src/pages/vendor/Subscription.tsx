import { useEffect, useMemo, useState } from "react";
import { Check, CreditCard, Smartphone } from "lucide-react";
import { Badge, Button, Card, CardHeader, CardTitle, EmptyState, Modal } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { getSubscriptionByVendor, getVendorById, updateSubscription } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";

const plans = [
  { name: "Starter", price: 99, features: ["5 product listings", "Basic analytics", "Email support"] },
  { name: "Growth", price: 299, features: ["Unlimited products", "AI insights", "Priority support", "Client lead alerts"] },
  { name: "Enterprise", price: 799, features: ["Everything in Growth", "Dedicated account manager", "Custom integrations", "SSO"] },
];

export function VendorSubscription() {
  const { user } = useAuth();
  const vendor = useMemo(() => getVendorById(user?.vendorId || "")!, [user]);
  const [subscription, setSubscription] = useState(() => getSubscriptionByVendor(vendor.id));
  const [paymentMethod, setPaymentMethod] = useState<"online" | "card" | "">(
    subscription?.paymentMethod === "cash" ? "" : subscription?.paymentMethod || ""
  );
  const [cardName, setCardName] = useState(subscription?.cardDetails?.cardholderName || "");
  const [cardNumber, setCardNumber] = useState(subscription?.cardDetails?.cardNumber || "");
  const [expiryDate, setExpiryDate] = useState(subscription?.cardDetails?.expiryDate || "");
  const [cvv, setCvv] = useState(subscription?.cardDetails?.cvv || "");
  const [paymentProvider, setPaymentProvider] = useState<"gpay" | "paytm" | "nivi" | "">("");
  const [cardError, setCardError] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentSaved, setPaymentSaved] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [paymentProgress, setPaymentProgress] = useState(0);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [paymentTimer, setPaymentTimer] = useState(150);
  const [paymentProcessingDelay, setPaymentProcessingDelay] = useState(10);

  const selectPlan = (planName: string) => {
    const plan = plans.find((p) => p.name === planName);
    if (!plan || !subscription) return;
    updateSubscription(vendor.id, { plan: plan.name as never, price: plan.price });
    setSubscription(getSubscriptionByVendor(vendor.id));
  };

  const savePaymentDetails = () => {
    setCardError("");
    if (!paymentMethod) {
      setCardError("Please select a payment method.");
      return;
    }
    if (paymentMethod === "card") {
      if (!cardName || !cardNumber || !expiryDate || !cvv) {
        setCardError("Please fill in all card details.");
        return;
      }
      if (cardNumber.length < 13 || cardNumber.length > 19) {
        setCardError("Card number must be 13-19 digits.");
        return;
      }
    }
    if (paymentMethod === "online" && !paymentProvider) {
      setCardError("Please select a payment provider.");
      return;
    }
    if (!subscription) return;
    updateSubscription(vendor.id, {
      paymentMethod,
      cardDetails: paymentMethod === "card" ? { cardholderName: cardName, cardNumber, expiryDate, cvv } : undefined,
    });
    setSubscription(getSubscriptionByVendor(vendor.id));
    setPaymentSaved(true);
    setPaymentConfirmed(false);
    setPaymentProgress(0);
    setPaymentTimer(150);
    setPaymentProcessingDelay(10);
    setIsPaymentProcessing(false);
    setIsPaymentModalOpen(true);
    setCardError("");
  };

  useEffect(() => {
    let timer: number | undefined;
    if (isPaymentModalOpen && !isPaymentProcessing && paymentProcessingDelay > 0) {
      timer = window.setInterval(() => {
        setPaymentProcessingDelay((prev) => Math.max(prev - 1, 0));
      }, 1000);
    }
    return () => window.clearInterval(timer);
  }, [isPaymentModalOpen, isPaymentProcessing, paymentProcessingDelay]);

  useEffect(() => {
    if (isPaymentModalOpen && !isPaymentProcessing && paymentProcessingDelay <= 0 && paymentSaved && !paymentConfirmed) {
      setIsPaymentProcessing(true);
      setPaymentProgress(1);
    }
  }, [paymentProcessingDelay, isPaymentModalOpen, isPaymentProcessing, paymentSaved, paymentConfirmed]);

  useEffect(() => {
    if (!isPaymentProcessing || paymentProgress >= 100) return;
    const interval = window.setInterval(() => {
      setPaymentProgress((prev) => Math.min(prev + Math.ceil(Math.random() * 18), 100));
      setPaymentTimer((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isPaymentProcessing, paymentProgress]);

  useEffect(() => {
    if (paymentProgress >= 100 || paymentTimer <= 0) {
      if (isPaymentProcessing) {
        setPaymentProgress(100);
        setIsPaymentProcessing(false);
        setPaymentConfirmed(true);
      }
    }
  }, [paymentProgress, paymentTimer, isPaymentProcessing]);

  if (!subscription) return <EmptyState message="No subscription found." />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Subscription</h2>
        <p className="text-slate-500 dark:text-slate-400">Manage your vendor plan and billing.</p>
      </div>

      <Card className="space-y-4">
        <div>
          <p className="text-sm text-slate-500">Vendor profile</p>
          <p className="text-xl font-semibold">{vendor.name}</p>
          <p className="text-sm text-slate-600 dark:text-slate-400">{vendor.category} • Rating {vendor.rating.toFixed(1)}</p>
        </div>
      </Card>

      <Card className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Current plan</p>
          <p className="text-2xl font-bold">{subscription.plan}</p>
          <p className="text-slate-500">{formatCurrency(subscription.price)}/month • Renews {formatDate(subscription.renewDate)}</p>
        </div>
        <Badge variant="success">{subscription.status}</Badge>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const active = subscription.plan === plan.name;
          return (
            <Card key={plan.name} className={`${active ? "ring-2 ring-indigo-500" : ""} flex flex-col`}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
              </CardHeader>
              <div className="mb-4">
                <span className="text-3xl font-bold">{formatCurrency(plan.price)}</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <ul className="mb-6 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>
              <Button variant={active ? "secondary" : "outline"} onClick={() => selectPlan(plan.name)} disabled={active}>
                {active ? "Current Plan" : "Select Plan"}
              </Button>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
        </CardHeader>
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            <PaymentMethodCard
              active={paymentMethod === "online"}
              onClick={() => setPaymentMethod("online")}
              icon={<Smartphone className="h-6 w-6" />}
              label="Online (GPay)"
              description="UPI payment"
            />
            <PaymentMethodCard
              active={paymentMethod === "card"}
              onClick={() => setPaymentMethod("card")}
              icon={<CreditCard className="h-6 w-6" />}
              label="Card Payment"
              description="Debit or credit card"
            />
          </div>

          {paymentMethod === "online" && (
            <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/30">
              <p className="text-sm text-slate-700 dark:text-slate-300">Choose a payment provider</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { key: "gpay", label: "GPay", symbol: "🟢" },
                  { key: "paytm", label: "Paytm", symbol: "🔵" },
                  { key: "nivi", label: "Nivi", symbol: "🟣" },
                ].map((provider) => (
                  <button
                    key={provider.key}
                    type="button"
                    onClick={() => setPaymentProvider(provider.key as "gpay" | "paytm" | "nivi")}
                    className={`rounded-2xl border p-4 text-center transition-colors ${
                      paymentProvider === provider.key
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-indigo-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                    }`}
                  >
                    <div className="mb-2 text-3xl">{provider.symbol}</div>
                    <div className="text-sm font-semibold">{provider.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {paymentMethod === "card" && (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Cardholder Name</label>
                <input
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Card Number</label>
                <input
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 19))}
                  placeholder="1234 5678 9012 3456"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Expiry (MM/YY)</label>
                  <input
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value.slice(0, 5))}
                    placeholder="12/25"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">CVV</label>
                  <input
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="123"
                    type="password"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>
          )}

          {cardError && <p className="text-sm text-rose-600 dark:text-rose-400">{cardError}</p>}

          <Button onClick={savePaymentDetails} className="w-full">
            Save Payment Details
          </Button>

          {paymentSaved && !paymentConfirmed && (
            <div className="rounded-xl border border-slate-300 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
              <p className="mb-2 font-semibold">Payment details saved.</p>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsPaymentProcessing(true);
                  setPaymentProgress(0);
                  setPaymentTimer(150);
                }}
                className="w-full"
              >
                Click to Payment
              </Button>
              {isPaymentProcessing && (
                <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-200">
                  Processing payment: {paymentProgress}%
                </div>
              )}
            </div>
          )}

          {paymentConfirmed && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
              <p className="font-semibold">Payment confirmed!</p>
              <p>Your payment is complete and your subscription is now confirmed.</p>
            </div>
          )}

          {subscription.paymentMethod && !paymentSaved && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
              ✓ Payment method saved: <span className="font-semibold capitalize">{subscription.paymentMethod}</span>
            </div>
          )}
        </div>
      </Card>

      <Modal open={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Payment Confirmation">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Your payment details were saved. The payment confirmation process will begin shortly.
          </p>
          <div className="space-y-4">
            {paymentMethod === "online" && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950">
                <div className="mx-auto mb-4 h-48 w-48 overflow-hidden rounded-2xl bg-white p-2 shadow-sm dark:bg-slate-900">
                  <svg viewBox="0 0 120 120" className="h-full w-full">
                    <rect width="120" height="120" fill="#fff" />
                    <rect x="8" y="8" width="32" height="32" fill="#000" />
                    <rect x="16" y="16" width="16" height="16" fill="#fff" />
                    <rect x="22" y="22" width="6" height="6" fill="#000" />
                    <rect x="84" y="8" width="28" height="28" fill="#000" />
                    <rect x="88" y="12" width="20" height="20" fill="#fff" />
                    <rect x="94" y="18" width="8" height="8" fill="#000" />
                    <rect x="8" y="84" width="28" height="28" fill="#000" />
                    <rect x="12" y="88" width="20" height="20" fill="#fff" />
                    <rect x="18" y="94" width="8" height="8" fill="#000" />
                    <rect x="48" y="8" width="12" height="12" fill="#000" />
                    <rect x="64" y="8" width="8" height="8" fill="#000" />
                    <rect x="88" y="48" width="12" height="12" fill="#000" />
                    <rect x="8" y="48" width="12" height="12" fill="#000" />
                    <rect x="48" y="24" width="8" height="8" fill="#000" />
                    <rect x="56" y="32" width="8" height="8" fill="#000" />
                    <rect x="72" y="24" width="8" height="8" fill="#000" />
                    <rect x="48" y="40" width="8" height="8" fill="#000" />
                    <rect x="56" y="48" width="8" height="8" fill="#000" />
                    <rect x="72" y="40" width="8" height="8" fill="#000" />
                    <rect x="24" y="60" width="8" height="8" fill="#000" />
                    <rect x="36" y="60" width="8" height="8" fill="#000" />
                    <rect x="56" y="60" width="6" height="6" fill="#000" />
                    <rect x="74" y="60" width="8" height="8" fill="#000" />
                    <rect x="90" y="60" width="8" height="8" fill="#000" />
                    <rect x="24" y="76" width="8" height="8" fill="#000" />
                    <rect x="36" y="76" width="8" height="8" fill="#000" />
                    <rect x="56" y="76" width="8" height="8" fill="#000" />
                    <rect x="74" y="76" width="8" height="8" fill="#000" />
                    <rect x="90" y="76" width="8" height="8" fill="#000" />
                    <rect x="48" y="90" width="12" height="12" fill="#000" />
                    <rect x="68" y="90" width="12" height="12" fill="#000" />
                    <rect x="84" y="84" width="8" height="8" fill="#000" />
                  </svg>
                </div>
                <p className="text-center text-sm text-slate-600 dark:text-slate-300">Scan this QR with GPay within the timer.</p>
                <p className="mt-3 text-center text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {Math.floor(paymentTimer / 60)}:{String(paymentTimer % 60).padStart(2, "0")}
                </p>
              </div>
            )}

            {paymentProcessingDelay > 0 && !isPaymentProcessing && !paymentConfirmed && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
                <p className="font-semibold">Preparing payment...</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Processing bar starts in {paymentProcessingDelay} second{paymentProcessingDelay === 1 ? "" : "s"}.</p>
              </div>
            )}
            {isPaymentProcessing && (
              <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-center text-sm text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-200">
                <div className="flex items-center justify-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Processing payment... {paymentProgress}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${paymentProgress}%` }} />
                </div>
              </div>
            )}
            {paymentConfirmed && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                <p className="font-semibold">Payment confirmed!</p>
                <p>Your payment is complete and your subscription is now confirmed.</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

function PaymentMethodCard({
  active,
  onClick,
  icon,
  label,
  description,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-4 text-left transition-colors ${
        active
          ? "border-indigo-600 bg-indigo-600 text-white"
          : "border-slate-300 bg-white text-slate-700 hover:border-indigo-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
      }`}
    >
      <div className="mb-3">{icon}</div>
      <div className="text-sm font-semibold">{label}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{description}</div>
    </button>
  );
}
