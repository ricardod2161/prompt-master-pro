import { useEffect, useState, useCallback } from "react";
import { useUnit } from "@/contexts/UnitContext";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  pendingOrders: number;
  // Comparação com ontem
  revenueChange: number;
  ordersChange: number;
  ticketChange: number;
}

export interface RecentOrder {
  id: string;
  order_number: number;
  status: string;
  channel: string;
  total_price: number;
  created_at: string;
  customer_name: string | null;
}

export interface ChannelData {
  name: string;
  value: number;
  color: string;
}

export interface HourlyData {
  hour: string;
  orders: number;
  revenue: number;
}

export interface TopProduct {
  name: string;
  quantity: number;
  revenue: number;
}

export interface CashRegisterStatus {
  isOpen: boolean;
  initialAmount: number;
  currentAmount: number;
  salesTotal: number;
  openedAt: string | null;
}

const channelColors: Record<string, string> = {
  whatsapp: "hsl(var(--channel-whatsapp))",
  table: "hsl(var(--channel-table))",
  counter: "hsl(var(--channel-counter))",
  delivery: "hsl(var(--channel-delivery))",
};

const channelLabels: Record<string, string> = {
  whatsapp: "WhatsApp",
  table: "Mesa",
  counter: "Balcão",
  delivery: "Delivery",
};

export function useDashboard() {
  const { selectedUnit } = useUnit();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    averageTicket: 0,
    pendingOrders: 0,
    revenueChange: 0,
    ordersChange: 0,
    ticketChange: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [channelData, setChannelData] = useState<ChannelData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [cashRegister, setCashRegister] = useState<CashRegisterStatus>({
    isOpen: false,
    initialAmount: 0,
    currentAmount: 0,
    salesTotal: 0,
    openedAt: null,
  });
  const [loading, setLoading] = useState(true);

  const getDateRange = (date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const fetchDashboardData = useCallback(async () => {
    if (!selectedUnit) return;

    setLoading(true);

    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayRange = getDateRange(today);
      const yesterdayRange = getDateRange(yesterday);

      // Fetch today's orders
      const { data: todayOrders, error: todayError } = await supabase
        .from("orders")
        .select("*, order_items(product_name, quantity, total_price)")
        .eq("unit_id", selectedUnit.id)
        .gte("created_at", todayRange.start)
        .lte("created_at", todayRange.end)
        .order("created_at", { ascending: false });

      if (todayError) throw todayError;

      // Fetch yesterday's orders for comparison
      const { data: yesterdayOrders, error: yesterdayError } = await supabase
        .from("orders")
        .select("*")
        .eq("unit_id", selectedUnit.id)
        .gte("created_at", yesterdayRange.start)
        .lte("created_at", yesterdayRange.end)
        .neq("status", "cancelled");

      if (yesterdayError) throw yesterdayError;

      // Fetch open cash register
      const { data: cashData } = await supabase
        .from("cash_registers")
        .select("*, cash_movements(*)")
        .eq("unit_id", selectedUnit.id)
        .is("closed_at", null)
        .maybeSingle();

      // Process today's data
      const validOrders = todayOrders?.filter((o) => o.status !== "cancelled" && o.status !== "completed") || [];
      const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
      const totalOrders = validOrders.length;
      const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const pendingOrders = todayOrders?.filter(
        (o) => o.status === "pending" || o.status === "preparing"
      ).length || 0;

      // Process yesterday's data
      const yesterdayRevenue = yesterdayOrders?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0;
      const yesterdayOrdersCount = yesterdayOrders?.length || 0;
      const yesterdayTicket = yesterdayOrdersCount > 0 ? yesterdayRevenue / yesterdayOrdersCount : 0;

      // Calculate changes
      const revenueChange = calculateChange(totalRevenue, yesterdayRevenue);
      const ordersChange = calculateChange(totalOrders, yesterdayOrdersCount);
      const ticketChange = calculateChange(averageTicket, yesterdayTicket);

      setStats({
        totalRevenue,
        totalOrders,
        averageTicket,
        pendingOrders,
        revenueChange,
        ordersChange,
        ticketChange,
      });

      // Recent orders
      setRecentOrders((todayOrders || []).slice(0, 5) as RecentOrder[]);

      // Channel distribution
      const channelCounts: Record<string, number> = {};
      validOrders.forEach((order) => {
        channelCounts[order.channel] = (channelCounts[order.channel] || 0) + 1;
      });

      const channelChartData = Object.entries(channelCounts).map(([channel, count]) => ({
        name: channelLabels[channel] || channel,
        value: count,
        color: channelColors[channel] || "#888",
      }));
      setChannelData(channelChartData);

      // Hourly distribution
      const hourlyMap: Record<string, { orders: number; revenue: number }> = {};
      for (let i = 0; i < 24; i++) {
        const hour = i.toString().padStart(2, "0") + ":00";
        hourlyMap[hour] = { orders: 0, revenue: 0 };
      }

      validOrders.forEach((order) => {
        const hour = new Date(order.created_at).getHours().toString().padStart(2, "0") + ":00";
        if (hourlyMap[hour]) {
          hourlyMap[hour].orders += 1;
          hourlyMap[hour].revenue += Number(order.total_price);
        }
      });

      const hourlyChartData = Object.entries(hourlyMap)
        .map(([hour, data]) => ({
          hour,
          orders: data.orders,
          revenue: data.revenue,
        }))
        .filter((_, i) => i >= 6 && i <= 23); // 06:00 - 23:00
      setHourlyData(hourlyChartData);

      // Top products
      const productMap: Record<string, { quantity: number; revenue: number }> = {};
      validOrders.forEach((order) => {
        order.order_items?.forEach((item: { product_name: string; quantity: number; total_price: number }) => {
          if (!productMap[item.product_name]) {
            productMap[item.product_name] = { quantity: 0, revenue: 0 };
          }
          productMap[item.product_name].quantity += item.quantity;
          productMap[item.product_name].revenue += Number(item.total_price);
        });
      });

      const topProductsData = Object.entries(productMap)
        .map(([name, data]) => ({
          name,
          quantity: data.quantity,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);
      setTopProducts(topProductsData);

      // Cash register status
      if (cashData) {
        const salesTotal = cashData.cash_movements
          ?.filter((m: { type: string }) => m.type === "sale")
          .reduce((sum: number, m: { amount: number }) => sum + Number(m.amount), 0) || 0;

        const withdrawals = cashData.cash_movements
          ?.filter((m: { type: string }) => m.type === "withdrawal")
          .reduce((sum: number, m: { amount: number }) => sum + Number(m.amount), 0) || 0;

        const deposits = cashData.cash_movements
          ?.filter((m: { type: string }) => m.type === "deposit")
          .reduce((sum: number, m: { amount: number }) => sum + Number(m.amount), 0) || 0;

        setCashRegister({
          isOpen: true,
          initialAmount: Number(cashData.initial_amount),
          currentAmount: Number(cashData.initial_amount) + salesTotal + deposits - withdrawals,
          salesTotal,
          openedAt: cashData.opened_at,
        });
      } else {
        setCashRegister({
          isOpen: false,
          initialAmount: 0,
          currentAmount: 0,
          salesTotal: 0,
          openedAt: null,
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedUnit]);

  // Initial fetch
  useEffect(() => {
    if (selectedUnit) {
      fetchDashboardData();
    }
  }, [selectedUnit, fetchDashboardData]);

  // Realtime subscription for orders
  useEffect(() => {
    if (!selectedUnit) return;

    const channel = supabase
      .channel("dashboard-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `unit_id=eq.${selectedUnit.id}`,
        },
        () => {
          // Refetch data when orders change
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUnit, fetchDashboardData]);

  // Realtime subscription for cash register
  useEffect(() => {
    if (!selectedUnit) return;

    const channel = supabase
      .channel("dashboard-cash")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cash_registers",
          filter: `unit_id=eq.${selectedUnit.id}`,
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUnit, fetchDashboardData]);

  return {
    stats,
    recentOrders,
    channelData,
    hourlyData,
    topProducts,
    cashRegister,
    loading,
    refetch: fetchDashboardData,
  };
}
