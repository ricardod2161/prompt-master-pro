import { useState, useMemo } from "react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Users, Calendar, QrCode } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrders } from "@/hooks/useOrders";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { PixTransactionsDashboard } from "@/components/reports/PixTransactionsDashboard";
import { SubscriptionGate } from "@/components/subscription/SubscriptionGate";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

type DateRange = "today" | "week" | "month" | "custom";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("sales");
  const [dateRange, setDateRange] = useState<DateRange>("today");
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined);
  const { data: orders, isLoading } = useOrders();

  const dateFilter = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) };
      case "week":
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case "month":
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
      case "custom":
        return customDate
          ? { start: startOfDay(customDate), end: endOfDay(customDate) }
          : { start: startOfDay(now), end: endOfDay(now) };
      default:
        return { start: startOfDay(now), end: endOfDay(now) };
    }
  }, [dateRange, customDate]);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((order) => {
      const orderDate = new Date(order.created_at);
      return orderDate >= dateFilter.start && orderDate <= dateFilter.end;
    });
  }, [orders, dateFilter]);

  const stats = useMemo(() => {
    const completedOrders = filteredOrders.filter(
      (o) => o.status !== "cancelled"
    );
    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_price, 0);
    const totalOrders = completedOrders.length;
    const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // By channel
    const byChannel = completedOrders.reduce((acc, order) => {
      acc[order.channel] = (acc[order.channel] || 0) + order.total_price;
      return acc;
    }, {} as Record<string, number>);

    const channelData = Object.entries(byChannel).map(([name, value]) => ({
      name: name === "counter" ? "Balcão" : name === "table" ? "Mesa" : name === "delivery" ? "Delivery" : "WhatsApp",
      value,
    }));

    // Top products
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    completedOrders.forEach((order) => {
      order.order_items?.forEach((item) => {
        if (!productSales[item.product_name]) {
          productSales[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 };
        }
        productSales[item.product_name].quantity += item.quantity;
        productSales[item.product_name].revenue += item.total_price;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // By hour (for today)
    const byHour: Record<number, number> = {};
    if (dateRange === "today") {
      for (let i = 0; i < 24; i++) byHour[i] = 0;
      completedOrders.forEach((order) => {
        const hour = new Date(order.created_at).getHours();
        byHour[hour] += order.total_price;
      });
    }

    const hourlyData = Object.entries(byHour).map(([hour, value]) => ({
      hour: `${hour}h`,
      value,
    }));

    return {
      totalRevenue,
      totalOrders,
      averageTicket,
      channelData,
      topProducts,
      hourlyData,
    };
  }, [filteredOrders, dateRange]);

  if (isLoading) {
    return <LoadingSkeleton variant="card" count={6} />;
  }

  return (
    <SubscriptionGate requiredTier="pro">
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise de vendas e desempenho
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sales">📊 Vendas</TabsTrigger>
          <TabsTrigger value="pix" className="gap-1">
            <QrCode className="h-3.5 w-3.5" />
            Pix
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="mt-4 space-y-6">
          {/* Date filters */}
          <div className="flex flex-wrap gap-2">
          <Button
            variant={dateRange === "today" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("today")}
          >
            Hoje
          </Button>
          <Button
            variant={dateRange === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("week")}
          >
            7 dias
          </Button>
          <Button
            variant={dateRange === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setDateRange("month")}
          >
            30 dias
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={dateRange === "custom" ? "default" : "outline"}
                size="sm"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {dateRange === "custom" && customDate
                  ? format(customDate, "dd/MM")
                  : "Data"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent
                mode="single"
                selected={customDate}
                onSelect={(date) => {
                  setCustomDate(date);
                  setDateRange("custom");
                }}
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
         </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.totalRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.averageTicket.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredOrders.filter((o) => o.status === "cancelled").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales by Channel */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.channelData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={stats.channelData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {stats.channelData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem dados para o período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hourly Sales */}
        {dateRange === "today" && (
          <Card>
            <CardHeader>
              <CardTitle>Vendas por Hora</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.hourlyData.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  Sem vendas registradas
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Top Products */}
        <Card className={dateRange !== "today" ? "lg:col-span-2" : ""}>
          <CardHeader>
            <CardTitle>Top 10 Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topProducts.length > 0 ? (
              <div className="space-y-3">
                {stats.topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center gap-3">
                    <span className="w-6 text-center font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.quantity} vendidos
                      </p>
                    </div>
                    <span className="font-semibold">
                      R$ {product.revenue.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Sem produtos vendidos no período
              </div>
            )}
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        <TabsContent value="pix" className="mt-4">
          <PixTransactionsDashboard />
        </TabsContent>
      </Tabs>
    </div>
    </SubscriptionGate>
  );
}
