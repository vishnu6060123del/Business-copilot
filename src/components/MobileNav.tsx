import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Bot,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Package,
  Receipt,
  Scale,
  Store,
  Users,
} from "lucide-react";

const clientNav = [
  { path: "/client/dashboard", label: "Home", icon: LayoutDashboard },
  { path: "/client/vendors", label: "Vendors", icon: Store },
  { path: "/client/chat", label: "Chat", icon: Bot },
  { path: "/client/compare", label: "Compare", icon: Scale },
  { path: "/client/requirement", label: "Request", icon: ClipboardList },
];

const vendorNav = [
  { path: "/vendor/dashboard", label: "Home", icon: LayoutDashboard },
  { path: "/vendor/products", label: "Products", icon: Package },
  { path: "/vendor/clients", label: "Clients", icon: Users },
  { path: "/vendor/payments", label: "Pay", icon: CreditCard },
  { path: "/vendor/subscription", label: "Plan", icon: Receipt },
];

export function MobileNav() {
  const { user } = useAuth();
  if (!user) return null;

  const nav = user.role === "vendor" ? vendorNav : clientNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200 bg-white px-1 py-1 dark:border-slate-800 dark:bg-slate-900 md:hidden">
      {nav.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center py-1 text-xs ${
              isActive
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-500 dark:text-slate-400"
            }`
          }
        >
          <item.icon className="h-5 w-5" />
          <span className="mt-0.5 text-[10px]">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
