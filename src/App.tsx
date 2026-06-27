import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/Layout";
import { Login } from "@/pages/Login";

import { Dashboard } from "@/pages/Dashboard";
import { ChatPage } from "@/pages/Chat";
import { ComparePage } from "@/pages/Compare";
import { ClientVendors } from "@/pages/client/Vendors";
import { ClientVendorDetail } from "@/pages/client/VendorDetail";
import { ClientRequirement } from "@/pages/client/Requirement";

import { VendorDashboard } from "@/pages/vendor/Dashboard";
import { VendorProfile } from "@/pages/vendor/Profile";
import { VendorProducts } from "@/pages/vendor/Products";
import { VendorClientLog } from "@/pages/vendor/ClientLog";
import { VendorPayments } from "@/pages/vendor/Payments";
import { VendorSubscription } from "@/pages/vendor/Subscription";
import { VendorHistory } from "@/pages/vendor/History";

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === "vendor" ? "/vendor/dashboard" : "/client/dashboard"} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<HomeRedirect />} />
        {/* Client routes */}
        <Route path="client/dashboard" element={<Dashboard />} />
        <Route path="client/vendors" element={<ClientVendors />} />
        <Route path="client/vendors/:id" element={<ClientVendorDetail />} />
        <Route path="client/chat" element={<ChatPage />} />
        <Route path="client/compare" element={<ComparePage />} />
        <Route path="client/requirement" element={<ClientRequirement />} />
        {/* Vendor routes */}
        <Route path="vendor/dashboard" element={<VendorDashboard />} />
        <Route path="vendor/profile" element={<VendorProfile />} />
        <Route path="vendor/products" element={<VendorProducts />} />
        <Route path="vendor/clients" element={<VendorClientLog />} />
        <Route path="vendor/payments" element={<VendorPayments />} />
        <Route path="vendor/subscription" element={<VendorSubscription />} />
        <Route path="vendor/history" element={<VendorHistory />} />
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
