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
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

// Pages
import Landing from "./pages/Landing";
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
import OrderTracking from "./pages/OrderTracking";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Install from "./pages/Install";
import MarketingStudio from "./pages/MarketingStudio";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const status = (error as any)?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 2;
      },
      staleTime: 30 * 1000,
    },
  },
});

// Component to apply theme colors globally
function ThemeColorApplier() {
  useTheme();
  return null;
}

const App = () => (
  <ErrorBoundary>
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
                  <Route path="/" element={<ErrorBoundary><Landing /></ErrorBoundary>} />
                  <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
                  <Route path="/select-unit" element={<ErrorBoundary><SelectUnit /></ErrorBoundary>} />
                  <Route path="/order/:tableId" element={<ErrorBoundary><CustomerOrder /></ErrorBoundary>} />
                  <Route path="/track/:token" element={<ErrorBoundary><OrderTracking /></ErrorBoundary>} />
                  <Route path="/subscription-success" element={<ErrorBoundary><SubscriptionSuccess /></ErrorBoundary>} />
                  <Route path="/privacy" element={<ErrorBoundary><Privacy /></ErrorBoundary>} />
                  <Route path="/terms" element={<ErrorBoundary><Terms /></ErrorBoundary>} />
                  <Route path="/install" element={<ErrorBoundary><Install /></ErrorBoundary>} />
                  <Route path="/reset-password" element={<ErrorBoundary><ResetPassword /></ErrorBoundary>} />

                  {/* Protected routes with layout */}
                  <Route element={<ErrorBoundary><AppLayout /></ErrorBoundary>}>
                    <Route path="/dashboard" element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
                    <Route path="/menu" element={<ErrorBoundary><Menu /></ErrorBoundary>} />
                    <Route path="/pos" element={<ErrorBoundary><POS /></ErrorBoundary>} />
                    <Route path="/kds" element={<ErrorBoundary><KDS /></ErrorBoundary>} />
                    <Route path="/orders" element={<ErrorBoundary><Orders /></ErrorBoundary>} />
                    <Route path="/cashier" element={<ErrorBoundary><Cashier /></ErrorBoundary>} />
                    <Route path="/tables" element={<ErrorBoundary><Tables /></ErrorBoundary>} />
                    <Route path="/inventory" element={<ErrorBoundary><Inventory /></ErrorBoundary>} />
                    <Route path="/reports" element={<ErrorBoundary><Reports /></ErrorBoundary>} />
                    <Route path="/delivery" element={<ErrorBoundary><Delivery /></ErrorBoundary>} />
                    <Route path="/whatsapp/settings" element={<ErrorBoundary><WhatsAppSettings /></ErrorBoundary>} />
                    <Route path="/whatsapp/chat" element={<ErrorBoundary><WhatsAppChat /></ErrorBoundary>} />
                    <Route path="/settings" element={<ErrorBoundary><Settings /></ErrorBoundary>} />
                    <Route path="/marketing" element={<ErrorBoundary><MarketingStudio /></ErrorBoundary>} />
                    <Route path="/pricing" element={<ErrorBoundary><Pricing /></ErrorBoundary>} />
                    <Route path="/admin" element={<ErrorBoundary><Admin /></ErrorBoundary>} />
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
  </ErrorBoundary>
);

export default App;
