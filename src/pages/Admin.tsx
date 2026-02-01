import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsDeveloper } from "@/hooks/useIsDeveloper";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminUsersList } from "@/components/admin/AdminUsersList";
import { AdminUnitsManager } from "@/components/admin/AdminUnitsManager";
import { LayoutDashboard, Users, Building2, ScrollText, Loader2, ShieldAlert } from "lucide-react";

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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Access denied for non-developers
  if (!isDeveloper) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <ShieldAlert className="w-16 h-16 text-destructive" />
        <h1 className="text-2xl font-bold">Acesso Negado</h1>
        <p className="text-muted-foreground">
          Esta página é restrita ao desenvolvedor do sistema.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
        >
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-red-500/10">
          <ShieldAlert className="h-6 w-6 text-red-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Painel do Desenvolvedor</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, unidades e monitore o sistema
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="dashboard" className="gap-2">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
          <TabsTrigger value="units" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Unidades</span>
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <ScrollText className="h-4 w-4" />
            <span className="hidden sm:inline">Logs</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <AdminDashboard />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <AdminUsersList />
        </TabsContent>

        <TabsContent value="units" className="space-y-4">
          <AdminUnitsManager />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="text-center py-12 text-muted-foreground">
            <ScrollText className="mx-auto h-12 w-12 opacity-50" />
            <h3 className="mt-4 text-lg font-medium">Logs em breve</h3>
            <p className="text-sm">Sistema de logs será implementado na próxima fase.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
