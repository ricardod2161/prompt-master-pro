import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUnit } from "@/contexts/UnitContext";
import { supabase } from "@/integrations/supabase/client";

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  pendingOrders: number;
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

export interface DashboardData {
  stats: DashboardStats;
  recentOrders: RecentOrder[];
  channelData: ChannelData[];
  hourlyData: HourlyData[];
  topProducts: TopProduct[];
  cashRegister: CashRegisterStatus;
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

function getDateRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

const defaultDashboard: DashboardData = {
  stats: {
    totalRevenue: 0,
    totalOrders: 0,
    averageTicket: 0,
    pendingOrders: 0,
    revenueChange: 0,
    ordersChange: 0,
    ticketChange: 0,
  },
  recentOrders: [],
  channelData: [],
  hourlyData: [],
  topProducts: [],
  cashRegister: {
    isOpen: false,
    initialAmount: 0,
    currentAmount: 0,
    salesTotal: 0,
    openedAt: null,
  },
};

async function fetchDashboard(unitId: string): Promise<DashboardData> {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const todayRange = getDateRange(today);
  const yesterdayRange = getDateRange(yesterday);

  const [todayResult, yesterdayResult, cashResult] = await Promise.all([
    supabase
      .from("orders")
      .select("*, order_items(product_name, quantity, total_price)")
      .eq("unit_id", unitId)
      .gte("created_at", todayRange.start)
      .lte("created_at", todayRange.end)
      .order("created_at", { ascending: false }),

    supabase
      .from("orders")
      .select("id, total_price, status")
      .eq("unit_id", unitId)
      .gte("created_at", yesterdayRange.start)
      .lte("created_at", yesterdayRange.end)
      .neq("status", "cancelled"),

    supabase
      .from("cash_registers")
      .select("*, cash_movements(*)")
      .eq("unit_id", unitId)
      .is("closed_at", null)
      .maybeSingle(),
  ]);

  if (todayResult.error) throw todayResult.error;
  if (yesterdayResult.error) throw yesterdayResult.error;

  const todayOrders = todayResult.data || [];
  const yesterdayOrders = yesterdayResult.data || [];

  // Stats
  const validOrders = todayOrders.filter((o) => o.status !== "cancelled");
  const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const totalOrders = validOrders.length;
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const pendingOrders = todayOrders.filter(
    (o) => o.status === "pending" || o.status === "preparing"
  ).length;

  const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + Number(o.total_price), 0);
  const yesterdayOrdersCount = yesterdayOrders.length;
  const yesterdayTicket = yesterdayOrdersCount > 0 ? yesterdayRevenue / yesterdayOrdersCount : 0;

  // Channel distribution
  const channelCounts: Record<string, number> = {};
  validOrders.forEach((order) => {
    channelCounts[order.channel] = (channelCounts[order.channel] || 0) + 1;
  });
  const channelData = Object.entries(channelCounts).map(([channel, count]) => ({
    name: channelLabels[channel] || channel,
    value: count,
    color: channelColors[channel] || "#888",
  }));

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
  const hourlyData = Object.entries(hourlyMap)
    .map(([hour, data]) => ({ hour, orders: data.orders, revenue: data.revenue }))
    .filter((_, i) => i >= 6 && i <= 23);

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
  const topProducts = Object.entries(productMap)
    .map(([name, data]) => ({ name, quantity: data.quantity, revenue: data.revenue }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Cash register
  let cashRegister: CashRegisterStatus = defaultDashboard.cashRegister;
  const cashData = cashResult.data;
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

    cashRegister = {
      isOpen: true,
      initialAmount: Number(cashData.initial_amount),
      currentAmount: Number(cashData.initial_amount) + salesTotal + deposits - withdrawals,
      salesTotal,
      openedAt: cashData.opened_at,
    };
  }

  return {
    stats: {
      totalRevenue,
      totalOrders,
      averageTicket,
      pendingOrders,
      revenueChange: calculateChange(totalRevenue, yesterdayRevenue),
      ordersChange: calculateChange(totalOrders, yesterdayOrdersCount),
      ticketChange: calculateChange(averageTicket, yesterdayTicket),
    },
    recentOrders: todayOrders.slice(0, 5) as RecentOrder[],
    channelData,
    hourlyData,
    topProducts,
    cashRegister,
  };
}

export function useDashboard() {
  const { selectedUnit } = useUnit();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['dashboard', selectedUnit?.id],
    queryFn: () => fetchDashboard(selectedUnit!.id),
    enabled: !!selectedUnit?.id,
    staleTime: 30_000, // 30 seconds
  });

  // Single consolidated realtime channel for both orders and cash_registers
  useEffect(() => {
    if (!selectedUnit?.id) return;

    const channel = supabase
      .channel(`dashboard-realtime-${selectedUnit.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `unit_id=eq.${selectedUnit.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard', selectedUnit.id] });
      })
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "cash_registers",
        filter: `unit_id=eq.${selectedUnit.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard', selectedUnit.id] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUnit?.id, queryClient]);

  const data = query.data ?? defaultDashboard;

  return {
    stats: data.stats,
    recentOrders: data.recentOrders,
    channelData: data.channelData,
    hourlyData: data.hourlyData,
    topProducts: data.topProducts,
    cashRegister: data.cashRegister,
    loading: query.isLoading,
    refetch: query.refetch,
  };
}
