import { useEffect, useState } from "react";
import { useUnit } from "@/contexts/UnitContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Clock,
  MessageSquare,
  UtensilsCrossed,
  Store,
  Truck,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  pendingOrders: number;
}

interface RecentOrder {
  id: string;
  order_number: number;
  status: string;
  channel: string;
  total_price: number;
  created_at: string;
  customer_name: string | null;
}

const channelColors = {
  whatsapp: "hsl(var(--channel-whatsapp))",
  table: "hsl(var(--channel-table))",
  counter: "hsl(var(--channel-counter))",
  delivery: "hsl(var(--channel-delivery))",
};

const channelLabels = {
  whatsapp: "WhatsApp",
  table: "Mesa",
  counter: "Balcão",
  delivery: "Delivery",
};

const channelIcons = {
  whatsapp: MessageSquare,
  table: UtensilsCrossed,
  counter: Store,
  delivery: Truck,
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  preparing: "Preparando",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

const statusColors: Record<string, string> = {
  pending: "bg-status-warning/20 text-status-warning",
  preparing: "bg-status-info/20 text-status-info",
  ready: "bg-status-success/20 text-status-success",
  delivered: "bg-muted text-muted-foreground",
  cancelled: "bg-status-error/20 text-status-error",
};

export default function Dashboard() {
  const { selectedUnit } = useUnit();
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    averageTicket: 0,
    pendingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [channelData, setChannelData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (selectedUnit) {
      fetchDashboardData();
    }
  }, [selectedUnit]);

  const fetchDashboardData = async () => {
    if (!selectedUnit) return;

    setLoading(true);

    try {
      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      // Fetch orders for today
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("unit_id", selectedUnit.id)
        .gte("created_at", startOfDay)
        .lte("created_at", endOfDay)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (orders) {
        // Calculate stats
        const totalRevenue = orders
          .filter((o) => o.status !== "cancelled")
          .reduce((sum, o) => sum + Number(o.total_price), 0);

        const totalOrders = orders.filter((o) => o.status !== "cancelled").length;
        const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const pendingOrders = orders.filter(
          (o) => o.status === "pending" || o.status === "preparing"
        ).length;

        setStats({ totalRevenue, totalOrders, averageTicket, pendingOrders });

        // Recent orders
        setRecentOrders(orders.slice(0, 5));

        // Channel distribution
        const channelCounts: Record<string, number> = {};
        orders.forEach((order) => {
          if (order.status !== "cancelled") {
            channelCounts[order.channel] = (channelCounts[order.channel] || 0) + 1;
          }
        });

        const channelChartData = Object.entries(channelCounts).map(([channel, count]) => ({
          name: channelLabels[channel as keyof typeof channelLabels] || channel,
          value: count,
          color: channelColors[channel as keyof typeof channelColors] || "#888",
        }));

        setChannelData(channelChartData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do dia - {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.averageTicket)}</div>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Preparo</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Pedidos ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Channel Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos por Canal</CardTitle>
            <CardDescription>Distribuição dos pedidos do dia</CardDescription>
          </CardHeader>
          <CardContent>
            {channelData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channelData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhum pedido hoje
              </div>
            )}
            {channelData.length > 0 && (
              <div className="flex flex-wrap gap-4 justify-center mt-4">
                {channelData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">
                      {item.name}: {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
            <CardDescription>Últimos pedidos do dia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => {
                  const ChannelIcon = channelIcons[order.channel as keyof typeof channelIcons] || Store;
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `${channelColors[order.channel as keyof typeof channelColors]}20`,
                          }}
                        >
                          <ChannelIcon
                            className="w-5 h-5"
                            style={{
                              color: channelColors[order.channel as keyof typeof channelColors],
                            }}
                          />
                        </div>
                        <div>
                          <p className="font-medium">Pedido #{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customer_name || "Cliente"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(Number(order.total_price))}</p>
                        <Badge variant="secondary" className={statusColors[order.status]}>
                          {statusLabels[order.status]}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pedido hoje
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
