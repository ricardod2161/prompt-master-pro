import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { UnitProvider } from "@/contexts/UnitContext";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import Login from "./pages/Login";
import SelectUnit from "./pages/SelectUnit";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import POS from "./pages/POS";
import KDS from "./pages/KDS";
import Orders from "./pages/Orders";
import Cashier from "./pages/Cashier";
import Tables from "./pages/Tables";
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Delivery from "./pages/Delivery";
import WhatsAppSettings from "./pages/WhatsAppSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <TooltipProvider>
        <AuthProvider>
          <UnitProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Login />} />
                <Route path="/select-unit" element={<SelectUnit />} />

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
                  <Route path="/settings" element={<ComingSoon title="Configurações" />} />
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

// Temporary placeholder for modules not yet implemented
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      <p className="text-muted-foreground">Este módulo será implementado na próxima fase.</p>
    </div>
  );
}

export default App;
