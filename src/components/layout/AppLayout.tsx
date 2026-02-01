import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUnit } from "@/contexts/UnitContext";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { SubscriptionBadge } from "@/components/subscription/SubscriptionBadge";

// Page titles mapping
const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/pos": "PDV",
  "/kds": "KDS - Cozinha",
  "/orders": "Pedidos",
  "/menu": "Cardápio",
  "/inventory": "Estoque",
  "/tables": "Mesas",
  "/delivery": "Delivery",
  "/cashier": "Caixa",
  "/whatsapp/settings": "WhatsApp",
  "/reports": "Relatórios",
  "/settings": "Configurações",
  "/pricing": "Planos",
};

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading, subscription } = useAuth();
  const { selectedUnit, loading: unitLoading } = useUnit();

  const currentPageTitle = pageTitles[location.pathname] || "";

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    } else if (!authLoading && !unitLoading && user && !selectedUnit) {
      navigate("/select-unit");
    }
  }, [user, selectedUnit, authLoading, unitLoading, navigate]);

  if (authLoading || unitLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !selectedUnit) {
    return null;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          
          {/* Page Title */}
          {currentPageTitle && (
            <h1 className="font-semibold text-sm sm:text-base truncate">
              {currentPageTitle}
            </h1>
          )}
          
          <div className="flex-1" />
          
          {/* Subscription Badge in Header */}
          <div className="hidden sm:block">
            <SubscriptionBadge 
              tier={subscription.tier} 
              subscriptionEnd={subscription.subscriptionEnd} 
            />
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
