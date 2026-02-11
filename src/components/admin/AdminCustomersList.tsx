import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, Clock, UserX, Filter, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CustomerProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  created_at: string;
  email?: string;
  units: { id: string; name: string }[];
  subscription?: {
    subscribed: boolean;
    tier: string | null;
    status: string | null;
    isTrialing: boolean;
  };
}

function useAdminCustomers() {
  return useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, created_at");

      if (profilesError) throw profilesError;

      // Get all user_units with unit names
      const { data: userUnits, error: unitsError } = await supabase
        .from("user_units")
        .select("user_id, unit_id, units(id, name)");

      if (unitsError) throw unitsError;

      // Build map of user_id -> units
      const unitsMap = new Map<string, { id: string; name: string }[]>();
      userUnits?.forEach((uu: any) => {
        const existing = unitsMap.get(uu.user_id) || [];
        if (uu.units) {
          existing.push({ id: uu.units.id, name: uu.units.name });
        }
        unitsMap.set(uu.user_id, existing);
      });

      // Merge
      const customers: CustomerProfile[] = (profiles || []).map((p) => ({
        id: p.id,
        user_id: p.user_id,
        full_name: p.full_name,
        created_at: p.created_at,
        units: unitsMap.get(p.user_id) || [],
      }));

      return customers;
    },
  });
}

const statusConfig = {
  active: { label: "Ativo", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  trialing: { label: "Trial", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  none: { label: "Sem Plano", color: "bg-muted text-muted-foreground border-border" },
};

export function AdminCustomersList() {
  const { data: customers = [], isLoading } = useAdminCustomers();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // For now, subscription data is not fetched per-user (would require calling edge fn per user).
  // We show profiles + units. Subscription check would need a batch endpoint.

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (search) {
        const s = search.toLowerCase();
        if (
          !c.full_name?.toLowerCase().includes(s) &&
          !c.user_id.toLowerCase().includes(s) &&
          !c.units.some((u) => u.name.toLowerCase().includes(s))
        ) {
          return false;
        }
      }
      return true;
    });
  }, [customers, search]);

  const stats = useMemo(() => {
    return {
      total: customers.length,
      withUnits: customers.filter((c) => c.units.length > 0).length,
      noUnits: customers.filter((c) => c.units.length === 0).length,
    };
  }, [customers]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
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
          filtered.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow border-border/50">
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base truncate">
                        {customer.full_name || "Sem nome"}
                      </h3>
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
                        <Badge
                          key={unit.id}
                          variant="outline"
                          className="text-xs gap-1"
                        >
                          <Building2 className="h-3 w-3" />
                          {unit.name}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        Sem unidade
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
