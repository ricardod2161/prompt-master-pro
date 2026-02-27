import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, UserCheck, UserX, Filter, Building2, Trash2, Loader2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { AccessOverrideDialog } from "./AccessOverrideDialog";

interface CustomerProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  created_at: string;
  units: { id: string; name: string }[];
}

interface AccessOverride {
  id: string;
  user_id: string;
  tier: string;
  is_active: boolean;
  expires_at: string | null;
  notes: string | null;
}

function useAdminCustomers() {
  return useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, created_at");
      if (profilesError) throw profilesError;

      const { data: userUnits, error: unitsError } = await supabase
        .from("user_units")
        .select("user_id, unit_id, units(id, name)");
      if (unitsError) throw unitsError;

      const unitsMap = new Map<string, { id: string; name: string }[]>();
      userUnits?.forEach((uu: any) => {
        const existing = unitsMap.get(uu.user_id) || [];
        if (uu.units) existing.push({ id: uu.units.id, name: uu.units.name });
        unitsMap.set(uu.user_id, existing);
      });

      return (profiles || []).map((p) => ({
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name,
        created_at: p.created_at,
        units: unitsMap.get(p.user_id) || [],
      })) as CustomerProfile[];
    },
  });
}

function useAccessOverrides() {
  return useQuery({
    queryKey: ["admin-access-overrides"],
    queryFn: async () => {
      // Query directly since developer RLS allows it
      const { data, error } = await (supabase as any)
        .from("access_overrides")
        .select("*")
        .eq("is_active", true);
      if (error) throw error;
      return (data || []) as AccessOverride[];
    },
  });
}

export function AdminCustomersList() {
  const { data: customers = [], isLoading } = useAdminCustomers();
  const { data: overrides = [] } = useAccessOverrides();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [overrideDialog, setOverrideDialog] = useState<{ open: boolean; customer: CustomerProfile | null }>({ open: false, customer: null });

  const overridesMap = useMemo(() => {
    const map = new Map<string, AccessOverride>();
    overrides.forEach((o) => map.set(o.user_id, o));
    return map;
  }, [overrides]);

  const deleteCustomerMutation = useMutation({
    mutationFn: async ({ userId, profileId }: { userId: string; profileId: string }) => {
      await supabase.from("user_roles").delete().eq("user_id", userId);
      await supabase.from("user_units").delete().eq("user_id", userId);
      await supabase.from("notifications").delete().eq("user_id", userId);
      const { error } = await supabase.from("profiles").delete().eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Cliente excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir cliente: ${error.message}`);
    },
  });

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (search) {
        const s = search.toLowerCase();
        if (
          !c.full_name?.toLowerCase().includes(s) &&
          !c.user_id.toLowerCase().includes(s) &&
          !c.units.some((u) => u.name.toLowerCase().includes(s))
        ) return false;
      }
      return true;
    });
  }, [customers, search]);

  const stats = useMemo(() => ({
    total: customers.length,
    withUnits: customers.filter((c) => c.units.length > 0).length,
    noUnits: customers.filter((c) => c.units.length === 0).length,
  }), [customers]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-10 w-full" /></CardContent></Card>
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total de Clientes", value: stats.total, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Com Unidades", value: stats.withUnits, icon: UserCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Sem Unidades", value: stats.noUnits, icon: UserX, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((s) => (
          <Card key={s.label} className="border-border/50">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn("p-3 rounded-xl", s.bg, s.color)}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar por nome ou unidade..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="bg-muted/30">
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum cliente encontrado</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((customer) => {
            const override = overridesMap.get(customer.user_id);
            const hasOverride = !!override;
            const isExpired = override?.expires_at ? new Date(override.expires_at) < new Date() : false;
            const activeOverride = hasOverride && !isExpired ? override : null;

            return (
              <Card key={customer.id} className={cn("hover:shadow-md transition-shadow border-border/50", activeOverride && "border-primary/40")}>
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-base truncate">
                          {customer.full_name || "Sem nome"}
                        </h3>
                        {activeOverride && (
                          <Badge className="text-xs gap-1 bg-primary/10 text-primary border-primary/30 border">
                            <Shield className="h-3 w-3" />
                            Override {activeOverride.tier.charAt(0).toUpperCase() + activeOverride.tier.slice(1)}
                            {activeOverride.expires_at && (
                              <span className="ml-1 opacity-70">
                                · até {format(new Date(activeOverride.expires_at), "dd/MM", { locale: ptBR })}
                              </span>
                            )}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                        {customer.user_id}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cadastro: {format(new Date(customer.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {customer.units.length > 0 ? (
                        customer.units.map((unit) => (
                          <Badge key={unit.id} variant="outline" className="text-xs gap-1">
                            <Building2 className="h-3 w-3" />
                            {unit.name}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Sem unidade
                        </Badge>
                      )}

                      {/* Manage Access Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8",
                          activeOverride
                            ? "text-primary hover:text-primary hover:bg-primary/10"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        title="Gerenciar Acesso"
                        onClick={() => setOverrideDialog({ open: true, customer })}
                      >
                        <Shield className="h-4 w-4" />
                      </Button>

                      {/* Delete Button */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Cliente</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir <strong>{customer.full_name || "este cliente"}</strong>?
                              Todas as roles, unidades e notificações associadas serão removidas. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteCustomerMutation.mutate({ userId: customer.user_id, profileId: customer.id })}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deleteCustomerMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Access Override Dialog */}
      {overrideDialog.customer && (
        <AccessOverrideDialog
          open={overrideDialog.open}
          onOpenChange={(open) => setOverrideDialog((s) => ({ ...s, open }))}
          customerId={overrideDialog.customer.user_id}
          customerName={overrideDialog.customer.full_name || "Cliente"}
          currentOverride={overridesMap.get(overrideDialog.customer.user_id) || null}
        />
      )}
    </div>
  );
}
