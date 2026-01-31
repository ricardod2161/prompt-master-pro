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
                  {/* TODO: Add more routes as modules are built */}
                  <Route path="/pos" element={<ComingSoon title="PDV" />} />
                  <Route path="/kds" element={<ComingSoon title="KDS" />} />
                  <Route path="/orders" element={<ComingSoon title="Pedidos" />} />
                  <Route path="/inventory" element={<ComingSoon title="Estoque" />} />
                  <Route path="/tables" element={<ComingSoon title="Mesas" />} />
                  <Route path="/delivery" element={<ComingSoon title="Delivery" />} />
                  <Route path="/cashier" element={<ComingSoon title="Caixa" />} />
                  <Route path="/whatsapp/settings" element={<ComingSoon title="WhatsApp" />} />
                  <Route path="/reports" element={<ComingSoon title="Relatórios" />} />
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
