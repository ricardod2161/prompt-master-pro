import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, ShoppingCart, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface UnitWithStats {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  cnpj: string | null;
  created_at: string;
  usersCount: number;
  ordersCount: number;
  totalRevenue: number;
}

export function AdminUnitsManager() {
  const { data: units, isLoading } = useQuery({
    queryKey: ["admin-units-with-stats"],
    queryFn: async (): Promise<UnitWithStats[]> => {
      // Buscar unidades
      const { data: unitsData, error: unitsError } = await supabase
        .from("units")
        .select("*")
        .order("created_at", { ascending: false });

      if (unitsError) throw unitsError;

      // Buscar contagem de usuários por unidade
      const { data: userUnits } = await supabase
        .from("user_units")
        .select("unit_id");

      // Buscar pedidos por unidade
      const { data: orders } = await supabase
        .from("orders")
        .select("unit_id, total_price, status");

      return (unitsData || []).map((unit) => {
        const unitOrders = (orders || []).filter((o) => o.unit_id === unit.id);
        const deliveredOrders = unitOrders.filter((o) => o.status === "delivered");
        
        return {
          id: unit.id,
          name: unit.name,
          address: unit.address,
          phone: unit.phone,
          cnpj: unit.cnpj,
          created_at: unit.created_at,
          usersCount: (userUnits || []).filter((u) => u.unit_id === unit.id).length,
          ordersCount: unitOrders.length,
          totalRevenue: deliveredOrders.reduce((sum, o) => sum + (o.total_price || 0), 0),
        };
      });
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!units || units.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">Nenhuma unidade cadastrada</h3>
        <p className="text-muted-foreground">As unidades aparecerão aqui quando forem criadas.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Unidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{units.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuários Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {units.reduce((sum, u) => sum + u.usersCount, 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(units.reduce((sum, u) => sum + u.totalRevenue, 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Units Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unidade</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead className="text-center">Usuários</TableHead>
              <TableHead className="text-center">Pedidos</TableHead>
              <TableHead className="text-right">Receita</TableHead>
              <TableHead>Criação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {units.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{unit.name}</p>
                    {unit.address && (
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {unit.address}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {unit.phone && (
                      <p className="text-sm">{unit.phone}</p>
                    )}
                    {unit.cnpj && (
                      <Badge variant="outline" className="text-xs">
                        {unit.cnpj}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{unit.usersCount}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    <span>{unit.ordersCount}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{formatCurrency(unit.totalRevenue)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(unit.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
