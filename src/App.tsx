import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/Layout";
import { Login } from "@/screens/Login";

import { Dashboard } from "@/screens/Dashboard";
import { ChatPage } from "@/screens/Chat";
import { ComparePage } from "@/screens/Compare";
import { UploadPage } from "@/screens/Upload";
import { ContractDetail } from "@/screens/ContractDetail";
import { ClientVendors } from "@/screens/client/Vendors";
import { ClientVendorDetail } from "@/screens/client/VendorDetail";
import { ClientRequirement } from "@/screens/client/Requirement";

import { VendorDashboard } from "@/screens/vendor/Dashboard";
import { VendorProfile } from "@/screens/vendor/Profile";
import { VendorProducts } from "@/screens/vendor/Products";
import { VendorClientLog } from "@/screens/vendor/ClientLog";
import { VendorPayments } from "@/screens/vendor/Payments";
import { VendorSubscription } from "@/screens/vendor/Subscription";
import { VendorHistory } from "@/screens/vendor/History";

function FullScreenLoader({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "vendor" ? "/vendor/dashboard" : "/client/dashboard"} replace />;
}

// Gate the authenticated app shell: require a session and a hydrated data cache.
function ProtectedApp() {
  const { user, loading, dataReady } = useAuth();
  if (loading) return <FullScreenLoader label="Loading your workspace..." />;
  if (!user) return <Navigate to="/login" replace />;
  if (!dataReady) return <FullScreenLoader label="Syncing data from database..." />;
  return <Layout />;
}

function ClientOnly({ children }: { children: React.ReactElement }) {
  const { user } = useAuth();
  if (user && user.role !== "client") return <Navigate to="/vendor/dashboard" replace />;
  return children;
}

function VendorOnly({ children }: { children: React.ReactElement }) {
  const { user } = useAuth();
  if (user && user.role !== "vendor") return <Navigate to="/client/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedApp />}>
        <Route index element={<HomeRedirect />} />
        {/* Client routes */}
        <Route path="client/dashboard" element={<ClientOnly><Dashboard /></ClientOnly>} />
        <Route path="client/vendors" element={<ClientOnly><ClientVendors /></ClientOnly>} />
        <Route path="client/vendors/:id" element={<ClientOnly><ClientVendorDetail /></ClientOnly>} />
        <Route path="client/chat" element={<ClientOnly><ChatPage /></ClientOnly>} />
        <Route path="client/compare" element={<ClientOnly><ComparePage /></ClientOnly>} />
        <Route path="client/requirement" element={<ClientOnly><ClientRequirement /></ClientOnly>} />
        <Route path="client/upload" element={<ClientOnly><UploadPage /></ClientOnly>} />
        <Route path="contracts/:id" element={<ContractDetail />} />
        {/* Vendor routes */}
        <Route path="vendor/dashboard" element={<VendorOnly><VendorDashboard /></VendorOnly>} />
        <Route path="vendor/profile" element={<VendorOnly><VendorProfile /></VendorOnly>} />
        <Route path="vendor/products" element={<VendorOnly><VendorProducts /></VendorOnly>} />
        <Route path="vendor/clients" element={<VendorOnly><VendorClientLog /></VendorOnly>} />
        <Route path="vendor/payments" element={<VendorOnly><VendorPayments /></VendorOnly>} />
        <Route path="vendor/subscription" element={<VendorOnly><VendorSubscription /></VendorOnly>} />
        <Route path="vendor/history" element={<VendorOnly><VendorHistory /></VendorOnly>} />
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
