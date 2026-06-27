import { useState, useEffect } from "react";
import { Modal, Button, Input } from "@/components/ui";
import { CreditCard, Lock, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface PaymentGatewayModalProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  description: string;
  onSuccess: () => void;
  title?: string;
}

export function PaymentGatewayModal({
  open,
  onClose,
  amount,
  description,
  onSuccess,
  title = "Secure Checkout",
}: PaymentGatewayModalProps) {
  // Form states
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [isFlipped, setIsFlipped] = useState(false);

  // Status states
  const [status, setStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setCardholderName("");
      setCardNumber("");
      setExpiry("");
      setCvv("");
      setIsFlipped(false);
      setStatus("idle");
      setErrorMsg("");
    }
  }, [open]);

  // Card formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, "");
    const trimmed = input.substring(0, 16);
    const parts = [];
    for (let i = 0; i < trimmed.length; i += 4) {
      parts.push(trimmed.substring(i, i + 4));
    }
    setCardNumber(parts.join(" "));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, "");
    if (input.length > 4) input = input.substring(0, 4);
    
    if (input.length > 2) {
      setExpiry(`${input.substring(0, 2)}/${input.substring(2)}`);
    } else {
      setExpiry(input);
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.replace(/\D/g, "");
    setCvv(input.substring(0, 3));
  };

  // Card brand detection
  const cleanedNum = cardNumber.replace(/\s/g, "");
  const cardType = cleanedNum.startsWith("4")
    ? "visa"
    : cleanedNum.startsWith("5")
    ? "mastercard"
    : cleanedNum.startsWith("3")
    ? "amex"
    : "generic";

  const getCardGradient = () => {
    switch (cardType) {
      case "visa":
        return "from-blue-700 via-indigo-800 to-indigo-950";
      case "mastercard":
        return "from-slate-900 via-rose-950 to-orange-950";
      case "amex":
        return "from-teal-800 via-cyan-900 to-slate-950";
      default:
        return "from-indigo-950 via-slate-900 to-purple-950";
    }
  };

  // Validation & Submission
  const validateForm = () => {
    if (!cardholderName.trim()) {
      setErrorMsg("Please enter the cardholder name.");
      return false;
    }
    if (cleanedNum.length < 16) {
      setErrorMsg("Please enter a valid 16-digit card number.");
      return false;
    }
    if (expiry.length < 5) {
      setErrorMsg("Please enter the expiration date (MM/YY).");
      return false;
    }
    const [month] = expiry.split("/");
    const m = parseInt(month, 10);
    if (isNaN(m) || m < 1 || m > 12) {
      setErrorMsg("Please enter a valid month (01-12).");
      return false;
    }
    if (cvv.length < 3) {
      setErrorMsg("Please enter a valid 3-digit CVV.");
      return false;
    }
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!validateForm()) return;

    setStatus("processing");

    // Simulate 1.5s gateway network roundtrip
    setTimeout(() => {
      setStatus("success");
      
      // Simulate another 1.2s on success state before calling parent success handler
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    }, 1500);
  };

  return (
    <Modal open={open} onClose={status === "processing" ? () => {} : onClose} title={title}>
      {status === "idle" && (
        <div className="space-y-6">
          {/* Invoice Summary */}
          <div className="rounded-xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-900/50 dark:border-slate-800 flex justify-between items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Paying For</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mt-0.5">{description}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Amount</p>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">{formatCurrency(amount)}</p>
            </div>
          </div>

          {/* Interactive Credit Card Container */}
          <div className="perspective-1000 flex justify-center py-2">
            <div
              className={`relative w-full max-w-[340px] h-48 rounded-2xl preserve-3d transition-transform duration-500 shadow-xl ${
                isFlipped ? "rotate-y-180" : ""
              }`}
            >
              {/* Card Front */}
              <div
                className={`absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br ${getCardGradient()} text-white p-6 flex flex-col justify-between backface-hidden border border-white/10`}
              >
                {/* Top Row: Chip and Logo */}
                <div className="flex justify-between items-start">
                  {/* Metal Chip */}
                  <div className="w-10 h-7 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-200 rounded-md relative overflow-hidden shadow-inner opacity-90">
                    <div className="absolute inset-x-0 top-1/2 h-[1px] bg-slate-950/20" />
                    <div className="absolute inset-y-0 left-1/2 w-[1px] bg-slate-950/20" />
                    <div className="absolute inset-3 border border-slate-950/10 rounded-sm" />
                  </div>

                  {/* Card Brand */}
                  <div className="text-right">
                    {cardType === "visa" && <span className="text-lg font-black italic tracking-wide text-blue-200">VISA</span>}
                    {cardType === "mastercard" && (
                      <div className="flex items-center gap-0.5">
                        <div className="w-5 h-5 rounded-full bg-red-500 opacity-90" />
                        <div className="w-5 h-5 rounded-full bg-amber-500 -ml-2.5 opacity-90" />
                        <span className="text-xs font-bold ml-1 text-slate-200">mastercard</span>
                      </div>
                    )}
                    {cardType === "amex" && <span className="text-sm font-bold tracking-wider text-teal-300">AMEX</span>}
                    {cardType === "generic" && <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">Copilot Pay</span>}
                  </div>
                </div>

                {/* Middle Row: Card Number */}
                <div className="text-center font-mono text-xl tracking-[0.18em] py-2 text-shadow">
                  {cardNumber || "•••• •••• •••• ••••"}
                </div>

                {/* Bottom Row: Holder and Expiry */}
                <div className="flex justify-between items-end">
                  <div className="truncate pr-4">
                    <p className="text-[9px] uppercase tracking-wider text-white/50">Cardholder</p>
                    <p className="text-xs font-semibold tracking-wide uppercase truncate max-w-[180px]">
                      {cardholderName || "CARDHOLDER NAME"}
                    </p>
                  </div>
                  <div className="text-right min-w-[50px]">
                    <p className="text-[9px] uppercase tracking-wider text-white/50">Expires</p>
                    <p className="text-xs font-semibold font-mono tracking-wider">
                      {expiry || "MM/YY"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Back */}
              <div
                className={`absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br ${getCardGradient()} text-white flex flex-col justify-between backface-hidden rotate-y-180 border border-white/10`}
              >
                {/* Magnetic Strip */}
                <div className="w-full h-10 bg-slate-950 mt-4" />

                {/* Signature Panel and CVV */}
                <div className="px-6 flex items-center gap-3">
                  <div className="flex-1 h-8 bg-slate-200/90 rounded flex items-center justify-end px-2 select-none">
                    <div className="w-full h-[6px] border-y border-dashed border-slate-400/30" />
                  </div>
                  <div className="bg-white text-slate-900 font-mono text-sm px-2 py-1 rounded shadow-inner font-semibold italic tracking-wider">
                    {cvv || "•••"}
                  </div>
                </div>

                {/* Secure Badge / Disclaimers */}
                <div className="px-6 pb-4 flex justify-between items-end text-white/40">
                  <div className="text-[8px] leading-tight max-w-[200px]">
                    This card is processed securely via 256-bit encryption. Authorized signatures only.
                  </div>
                  <div className="flex items-center gap-1 opacity-60">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-400">SECURE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secure Payment Header */}
          <div className="flex items-center gap-2 text-xs text-slate-500 justify-center">
            <Lock className="h-3 w-3 text-indigo-500" />
            <span>Secure 256-bit SSL encrypted connection</span>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Cardholder Name</label>
              <Input
                type="text"
                placeholder="Jane Doe"
                value={cardholderName}
                onChange={(e) => setCardholderName(e.target.value)}
                onFocus={() => setIsFlipped(false)}
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Card Number</label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="4111 1111 1111 1111"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  onFocus={() => setIsFlipped(false)}
                  required
                />
                <div className="absolute right-3 top-2.5 text-slate-400">
                  <CreditCard className="h-5 w-5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Expiration Date</label>
                <Input
                  type="text"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={handleExpiryChange}
                  onFocus={() => setIsFlipped(false)}
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">CVC / CVV</label>
                <Input
                  type="password"
                  placeholder="123"
                  value={cvv}
                  onChange={handleCvvChange}
                  onFocus={() => setIsFlipped(true)}
                  onBlur={() => setIsFlipped(false)}
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <div className="text-sm font-semibold text-rose-500 dark:text-rose-400 flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30">
                <span>⚠️</span> {errorMsg}
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" className="w-full justify-center flex gap-2" variant="primary">
                Pay {formatCurrency(amount)}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Processing Animation */}
      {status === "processing" && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin dark:text-indigo-400" />
          <div className="text-center">
            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100">Processing Secure Payment</h4>
            <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Verifying card details with payment gateway...</p>
          </div>
        </div>
      )}

      {/* Success View */}
      {status === "success" && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center dark:bg-emerald-950/40">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-center">
            <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100">Payment Successful!</h4>
            <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Your transaction has been authorized successfully.</p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-4">Redirecting...</p>
          </div>
        </div>
      )}
    </Modal>
  );
}
