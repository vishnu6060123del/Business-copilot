import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Store, User as UserIcon, Lock } from "lucide-react";
import { Button, Card, Select } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/lib/apiClient";
import type { User, Vendor } from "@/lib/types";

type Mode = "login" | "signup";

export function Login() {
  const navigate = useNavigate();
  const { user, login, signup } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [role, setRole] = useState<User["role"]>("client");
  const [identifierType, setIdentifierType] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect away if already authenticated.
  useEffect(() => {
    if (user) navigate(user.role === "vendor" ? "/vendor/dashboard" : "/client/dashboard", { replace: true });
  }, [user, navigate]);

  // Load vendor options for the signup dropdown (public endpoint, no auth required).
  useEffect(() => {
    if (mode === "signup" && role === "vendor" && vendors.length === 0) {
      apiGet<{ vendors: Vendor[] }>("/api/public/vendors")
        .then((res) => setVendors(res.vendors))
        .catch(() => setError("Could not load vendor list. Please try again."));
    }
  }, [mode, role, vendors.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setError(identifierType === "email" ? "Please enter your email address." : "Please enter your phone number.");
      return;
    }
    if (identifierType === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedIdentifier)) {
        setError("Please enter a valid email address.");
        return;
      }
    } else if (!/^\d{7,}$/.test(trimmedIdentifier)) {
      setError("Please enter a valid phone number (digits only).");
      return;
    }
    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await login({ identifier: trimmedIdentifier, password });
      } else {
        if (!name.trim()) {
          setError("Please enter your name / company name.");
          setSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError("Password must be at least 6 characters.");
          setSubmitting(false);
          return;
        }
        if (role === "vendor" && !vendorId) {
          setError("Please select your vendor profile.");
          setSubmitting(false);
          return;
        }
        await signup({
          identifier: trimmedIdentifier,
          identifierType,
          password,
          name: name.trim(),
          role,
          vendorId: role === "vendor" ? vendorId : undefined,
        });
      }
      // Navigation handled by the effect above once `user` updates.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-6 dark:from-slate-950 dark:to-slate-900">
      <Card className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">AI Procurement Copilot</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <div className="mb-6 inline-flex w-full overflow-hidden rounded-xl border border-slate-200 text-sm dark:border-slate-700">
          <button
            type="button"
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 px-4 py-2 transition-colors ${
              mode === "login" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 px-4 py-2 transition-colors ${
              mode === "signup" ? "bg-indigo-600 text-white" : "bg-white text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Sign Up
          </button>
        </div>

        {mode === "signup" && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            <RoleOption
              active={role === "client"}
              onClick={() => setRole("client")}
              icon={<Building2 className="h-5 w-5" />}
              label="Client"
              sub="Buy materials & services"
            />
            <RoleOption
              active={role === "vendor"}
              onClick={() => setRole("vendor")}
              icon={<Store className="h-5 w-5" />}
              label="Vendor"
              sub="Sell & manage products"
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {identifierType === "email" ? "Email address" : "Phone number"}
            </label>
            <div className="mb-2 inline-flex overflow-hidden rounded-full border border-slate-200 bg-white text-xs shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setIdentifierType("email")}
                className={`px-4 py-2 transition-colors ${
                  identifierType === "email" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setIdentifierType("phone")}
                className={`px-4 py-2 transition-colors ${
                  identifierType === "phone" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                Phone
              </button>
            </div>
            <input
              type={identifierType === "email" ? "email" : "tel"}
              inputMode={identifierType === "phone" ? "numeric" : "email"}
              value={identifier}
              onChange={(e) => setIdentifier(identifierType === "phone" ? e.target.value.replace(/\D/g, "") : e.target.value)}
              placeholder={identifierType === "email" ? "jane@company.com" : "Enter phone number"}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {role === "vendor" ? "Contact Name" : "Company / Client Name"}
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === "vendor" ? "Jane Smith" : "Apex Manufacturing"}
                  className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          )}

          {mode === "signup" && role === "vendor" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Vendor Profile</label>
              <Select value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                <option value="">Select your company</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id} className="text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                    {v.name} ({v.category})
                  </option>
                ))}
              </Select>
            </div>
          )}

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? "Please wait..." : mode === "login" ? "Sign In" : `Sign up as ${role === "vendor" ? "Vendor" : "Client"}`}
          </Button>
        </form>

        {mode === "login" && (
          <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
            Demo: demo@client.com / demo@vendor.com — password <span className="font-semibold">demo1234</span>
          </p>
        )}
      </Card>
    </div>
  );
}

function RoleOption({
  active,
  onClick,
  icon,
  label,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center rounded-xl border p-4 text-sm transition-colors ${
        active
          ? "border-indigo-600 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/40 dark:text-indigo-300"
          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
      }`}
    >
      <div className="mb-2">{icon}</div>
      <span className="font-semibold">{label}</span>
      <span className="text-xs opacity-80">{sub}</span>
    </button>
  );
}
