import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { Badge, Button, Card, CardHeader, CardTitle, EmptyState } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { getSubscriptionByVendor, getVendorById, updateSubscription } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/format";
import { PaymentGatewayModal } from "@/components/PaymentGatewayModal";

const plans = [
  { name: "Starter", price: 99, features: ["5 product listings", "Basic analytics", "Email support"] },
  { name: "Growth", price: 299, features: ["Unlimited products", "AI insights", "Priority support", "Client lead alerts"] },
  { name: "Enterprise", price: 799, features: ["Everything in Growth", "Dedicated account manager", "Custom integrations", "SSO"] },
];

export function VendorSubscription() {
  const { user } = useAuth();
  const vendor = useMemo(() => getVendorById(user?.vendorId || "")!, [user]);
  const [subscription, setSubscription] = useState(() => getSubscriptionByVendor(vendor.id));
  const [checkoutPlan, setCheckoutPlan] = useState<typeof plans[0] | null>(null);

  const selectPlan = (planName: string) => {
    const plan = plans.find((p) => p.name === planName);
    if (!plan || !subscription) return;
    setCheckoutPlan(plan);
  };

  const handleCheckoutSuccess = () => {
    if (!checkoutPlan || !subscription) return;
    updateSubscription(vendor.id, { plan: checkoutPlan.name as never, price: checkoutPlan.price });
    setSubscription(getSubscriptionByVendor(vendor.id));
    setCheckoutPlan(null);
  };

  if (!subscription) return <EmptyState message="No subscription found." />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Subscription</h2>
        <p className="text-slate-500 dark:text-slate-400">Manage your vendor plan and billing.</p>
      </div>

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

      {checkoutPlan && (
        <PaymentGatewayModal
          open={!!checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
          amount={checkoutPlan.price}
          description={`${checkoutPlan.name} Subscription Upgrade`}
          onSuccess={handleCheckoutSuccess}
          title="Upgrade Subscription Plan"
        />
      )}
    </div>
  );
}

