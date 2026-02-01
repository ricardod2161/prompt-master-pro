import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { UnitProvider } from "@/contexts/UnitContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { useTheme } from "@/hooks/useTheme";
import { useEffect } from "react";

// Pages
import Login from "./pages/Login";
import SelectUnit from "./pages/SelectUnit";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import CustomerOrder from "./pages/CustomerOrder";
import POS from "./pages/POS";
import KDS from "./pages/KDS";
import Orders from "./pages/Orders";
import Cashier from "./pages/Cashier";
import Tables from "./pages/Tables";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Delivery from "./pages/Delivery";
import WhatsAppSettings from "./pages/WhatsAppSettings";
import WhatsAppChat from "./pages/WhatsAppChat";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to apply theme colors globally
function ThemeColorApplier() {
  // This hook automatically applies colors when settings load
  useTheme();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <AuthProvider>
          <UnitProvider>
            <ThemeColorApplier />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Login />} />
                <Route path="/select-unit" element={<SelectUnit />} />
                <Route path="/order/:tableId" element={<CustomerOrder />} />
                <Route path="/subscription-success" element={<SubscriptionSuccess />} />

                {/* Protected routes with layout */}
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/menu" element={<Menu />} />
                  <Route path="/pos" element={<POS />} />
                  <Route path="/kds" element={<KDS />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/cashier" element={<Cashier />} />
                  <Route path="/tables" element={<Tables />} />
                  <Route path="/inventory" element={<Inventory />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/delivery" element={<Delivery />} />
                  <Route path="/whatsapp/settings" element={<WhatsAppSettings />} />
                  <Route path="/whatsapp/chat" element={<WhatsAppChat />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/admin" element={<Admin />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </UnitProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
