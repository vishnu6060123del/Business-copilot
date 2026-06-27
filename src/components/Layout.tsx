import { useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bot,
  ClipboardList,
  CreditCard,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Scale,
  Store,
  User,
  Users,
} from "lucide-react";
import { Button, ThemeToggle } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { MobileNav } from "@/components/MobileNav";

const clientNav = [
  { path: "/client/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/client/vendors", label: "Vendor Details", icon: Store },
  { path: "/client/chat", label: "AI Chatbot", icon: Bot },
  { path: "/client/compare", label: "Vendor Comparison", icon: Scale },
  { path: "/client/requirement", label: "Material Requirement", icon: ClipboardList },
];

const vendorNav = [
  { path: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/vendor/profile", label: "Profile", icon: User },
  { path: "/vendor/products", label: "Products", icon: Package },
  { path: "/vendor/clients", label: "Client Log", icon: Users },
  { path: "/vendor/payments", label: "Payment Details", icon: CreditCard },
  { path: "/vendor/subscription", label: "Subscription", icon: Receipt },
  { path: "/vendor/history", label: "History", icon: History },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate("/login", { replace: true });
  }, [user, navigate]);

  if (!user) return null;

  const nav = user.role === "vendor" ? vendorNav : clientNav;
  const title = user.role === "vendor" ? "Vendor Portal" : "Client Portal";

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 w-64 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-16 items-center border-b border-slate-200 px-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">AI Procurement</h1>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Copilot</p>
            </div>
          </div>
        </div>
        <nav className="space-y-1 p-4">
          {nav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <p className="font-semibold text-slate-700 dark:text-slate-300">{user.name}</p>
              <p className="capitalize">{user.role}</p>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={logout} className="px-2">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1 pb-20 pl-0 md:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 md:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 sm:inline-block">
                Demo
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
        </header>
        <div className="p-4 md:p-8">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
