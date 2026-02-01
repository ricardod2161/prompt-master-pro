import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdminStats {
  totalUsers: number;
  totalUnits: number;
  totalOrders: number;
  totalRevenue: number;
  subscriptionsByTier: {
    starter: number;
    pro: number;
    enterprise: number;
  };
  recentOrders: number;
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async (): Promise<AdminStats> => {
      // Total de usuários (profiles)
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Total de unidades
      const { count: unitsCount } = await supabase
        .from("units")
        .select("*", { count: "exact", head: true });

      // Total de pedidos
      const { count: ordersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      // Receita total
      const { data: revenueData } = await supabase
        .from("orders")
        .select("total_price")
        .eq("status", "delivered");
      
      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0;

      // Pedidos das últimas 24h
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count: recentOrdersCount } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", yesterday.toISOString());

      return {
        totalUsers: usersCount || 0,
        totalUnits: unitsCount || 0,
        totalOrders: ordersCount || 0,
        totalRevenue,
        subscriptionsByTier: {
          starter: 0,
          pro: 0,
          enterprise: 0,
        },
        recentOrders: recentOrdersCount || 0,
      };
    },
    staleTime: 60 * 1000, // 1 minute
  });
}
