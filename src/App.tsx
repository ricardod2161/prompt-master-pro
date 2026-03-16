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
import { useEffect, lazy, Suspense } from "react";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { Skeleton } from "@/components/ui/skeleton";

// ── Lazy page imports (route-based code splitting) ──────────────────────────
const Landing            = lazy(() => import("./pages/Landing"));
const Login              = lazy(() => import("./pages/Login"));
const SelectUnit         = lazy(() => import("./pages/SelectUnit"));
const Dashboard          = lazy(() => import("./pages/Dashboard"));
const Menu               = lazy(() => import("./pages/Menu"));
const CustomerOrder      = lazy(() => import("./pages/CustomerOrder"));
const POS                = lazy(() => import("./pages/POS"));
const KDS                = lazy(() => import("./pages/KDS"));
const Orders             = lazy(() => import("./pages/Orders"));
const Cashier            = lazy(() => import("./pages/Cashier"));
const Tables             = lazy(() => import("./pages/Tables"));
const Inventory          = lazy(() => import("./pages/Inventory"));
const Reports            = lazy(() => import("./pages/Reports"));
const Delivery           = lazy(() => import("./pages/Delivery"));
const WhatsAppSettings   = lazy(() => import("./pages/WhatsAppSettings"));
const WhatsAppChat       = lazy(() => import("./pages/WhatsAppChat"));
const Settings           = lazy(() => import("./pages/Settings"));
const Pricing            = lazy(() => import("./pages/Pricing"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const Admin              = lazy(() => import("./pages/Admin"));
const OrderTracking      = lazy(() => import("./pages/OrderTracking"));
const NotFound           = lazy(() => import("./pages/NotFound"));
const Privacy            = lazy(() => import("./pages/Privacy"));
const Terms              = lazy(() => import("./pages/Terms"));
const Install            = lazy(() => import("./pages/Install"));
const MarketingStudio    = lazy(() => import("./pages/MarketingStudio"));
const ResetPassword      = lazy(() => import("./pages/ResetPassword"));

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

// Full-page loading fallback
function PageLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
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
                <Suspense fallback={<PageLoader />}>
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
                </Suspense>
              </BrowserRouter>
            </UnitProvider>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
