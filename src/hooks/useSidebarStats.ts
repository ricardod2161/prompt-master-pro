import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnit } from "@/contexts/UnitContext";

interface SidebarStats {
  pendingOrders: number;
  preparingOrders: number;
  lowStockItems: number;
  unreadMessages: number;
  openTables: number;
}

export function useSidebarStats() {
  const { selectedUnit } = useUnit();

  return useQuery({
    queryKey: ["sidebar-stats", selectedUnit?.id],
    queryFn: async (): Promise<SidebarStats> => {
      if (!selectedUnit?.id) {
        return {
          pendingOrders: 0,
          preparingOrders: 0,
          lowStockItems: 0,
          unreadMessages: 0,
          openTables: 0,
        };
      }

      // Pedidos pendentes
      const { count: pendingCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("unit_id", selectedUnit.id)
        .eq("status", "pending");

      // Pedidos em preparo
      const { count: preparingCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("unit_id", selectedUnit.id)
        .eq("status", "preparing");

      // Itens com estoque baixo
      const { data: lowStock } = await supabase
        .from("inventory_items")
        .select("id, current_stock, min_stock")
        .eq("unit_id", selectedUnit.id);

      const lowStockCount = (lowStock || []).filter(
        (item) => item.current_stock <= (item.min_stock || 0)
      ).length;

      // Mesas ocupadas
      const { count: openTablesCount } = await supabase
        .from("tables")
        .select("*", { count: "exact", head: true })
        .eq("unit_id", selectedUnit.id)
        .eq("status", "occupied");

      return {
        pendingOrders: pendingCount || 0,
        preparingOrders: preparingCount || 0,
        lowStockItems: lowStockCount,
        unreadMessages: 0,
        openTables: openTablesCount || 0,
      };
    },
    enabled: !!selectedUnit?.id,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    staleTime: 15000,
  });
}
