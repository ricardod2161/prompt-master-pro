import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUnit } from "@/contexts/UnitContext";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

export function AppLayout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { selectedUnit, loading: unitLoading } = useUnit();

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
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex-1" />
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
