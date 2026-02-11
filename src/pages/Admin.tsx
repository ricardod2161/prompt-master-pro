import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsDeveloper } from "@/hooks/useIsDeveloper";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminUsersList } from "@/components/admin/AdminUsersList";
import { AdminUnitsManager } from "@/components/admin/AdminUnitsManager";
import { AdminActivityLogs } from "@/components/admin/AdminActivityLogs";
import { Card } from "@/components/ui/card";
import { AdminCustomersList } from "@/components/admin/AdminCustomersList";
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  ScrollText, 
  Loader2, 
  ShieldAlert,
  Sparkles,
  Crown,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isDeveloper, loading: devLoading } = useIsDeveloper();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  // Loading state
  if (authLoading || devLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-yellow-500 animate-pulse" />
          </div>
          <p className="text-muted-foreground animate-pulse">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Access denied for non-developers
  if (!isDeveloper) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-6 p-4">
        <div className="relative">
          <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
          <Card className="relative p-8 border-red-500/30 bg-gradient-to-br from-background to-red-950/10">
            <ShieldAlert className="w-20 h-20 text-red-500 mx-auto" />
          </Card>
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Acesso Restrito</h1>
          <p className="text-muted-foreground max-w-md">
            Esta área é exclusiva para o desenvolvedor do sistema. 
            Se você acredita que deveria ter acesso, entre em contato com o suporte.
          </p>
        </div>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all hover:scale-105 font-medium"
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-6 animate-fade-in">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-500/10 via-orange-500/5 to-yellow-500/10 border border-red-500/20 p-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-500/20 to-transparent blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-500/20 to-transparent blur-3xl" />
        
        <div className="relative flex items-start gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/30">
            <ShieldAlert className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                Super Admin Panel
              </h1>
              <Crown className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-muted-foreground mt-1">
              Painel exclusivo de desenvolvedor • Visão completa do sistema
            </p>
          </div>
        </div>
      </div>

      {/* Tabs with premium styling */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid h-auto p-1 bg-muted/50 backdrop-blur">
          {[
            { value: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
            { value: "customers", icon: UserCheck, label: "Clientes" },
            { value: "users", icon: Users, label: "Usuários" },
            { value: "units", icon: Building2, label: "Unidades" },
            { value: "logs", icon: ScrollText, label: "Logs" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm",
                "transition-all py-2.5 px-4"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4 animate-fade-in">
          <AdminDashboard />
        </TabsContent>

        <TabsContent value="customers" className="space-y-4 animate-fade-in">
          <AdminCustomersList />
        </TabsContent>

        <TabsContent value="users" className="space-y-4 animate-fade-in">
          <AdminUsersList />
        </TabsContent>

        <TabsContent value="units" className="space-y-4 animate-fade-in">
          <AdminUnitsManager />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4 animate-fade-in">
          <AdminActivityLogs />
        </TabsContent>
      </Tabs>
    </div>
  );
}
