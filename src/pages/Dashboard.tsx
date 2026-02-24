import { useEffect } from "react";
import { trackPixelEvent } from "@/hooks/usePixelTracking";
import { useDashboard } from "@/hooks/useDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { GlassCard } from "@/components/ui/glass-card";
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
  Wallet,
  Package,
  RefreshCw,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const channelIcons: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  whatsapp: MessageSquare,
  table: UtensilsCrossed,
  counter: Store,
  delivery: Truck,
};

const channelColors: Record<string, string> = {
  whatsapp: "hsl(var(--channel-whatsapp))",
  table: "hsl(var(--channel-table))",
  counter: "hsl(var(--channel-counter))",
  delivery: "hsl(var(--channel-delivery))",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  preparing: "Preparando",
  ready: "Pronto",
  delivered: "Entregue",
  cancelled: "Cancelado",
  completed: "Finalizado",
};

const statusColors: Record<string, string> = {
  pending: "bg-status-warning/20 text-status-warning",
  preparing: "bg-status-info/20 text-status-info",
  ready: "bg-status-success/20 text-status-success",
  delivered: "bg-muted text-muted-foreground",
  cancelled: "bg-status-error/20 text-status-error",
  completed: "bg-purple-500/20 text-purple-600",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

function CashRegisterCard({
  isOpen,
  initialAmount,
  currentAmount,
  salesTotal,
  openedAt,
  loading,
}: {
  isOpen: boolean;
  initialAmount: number;
  currentAmount: number;
  salesTotal: number;
  openedAt: string | null;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <GlassCard className="h-full">
        <div className="p-6">
          <div className="h-5 w-32 rounded shimmer mb-4" />
          <div className="h-24 w-full rounded shimmer" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard 
      glow={isOpen} 
      glowColor="success" 
      className={cn("h-full", !isOpen && "opacity-60")}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-2 rounded-lg",
              isOpen ? "bg-status-success/10" : "bg-muted"
            )}>
              <Wallet className={cn(
                "h-4 w-4",
                isOpen ? "text-status-success" : "text-muted-foreground"
              )} />
            </div>
            <span className="font-semibold">Status do Caixa</span>
          </div>
          <Badge 
            variant={isOpen ? "default" : "secondary"} 
            className={isOpen ? "bg-status-success text-white animate-pulse-glow" : ""}
          >
            {isOpen ? "Aberto" : "Fechado"}
          </Badge>
        </div>
        
        {isOpen ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground mb-1">Abertura</p>
                <p className="text-sm font-semibold">{formatCurrency(initialAmount)}</p>
              </div>
              <div className="p-3 rounded-lg bg-status-success/10">
                <p className="text-xs text-muted-foreground mb-1">Vendas</p>
                <p className="text-sm font-semibold text-status-success">{formatCurrency(salesTotal)}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Saldo atual</span>
                <span className="text-xl font-bold">{formatCurrency(currentAmount)}</span>
              </div>
              {openedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Aberto às {format(new Date(openedAt), "HH:mm")}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">Nenhum caixa aberto</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

export default function Dashboard() {

  useEffect(() => {
    if (!localStorage.getItem("ff_completed_registration")) {
      trackPixelEvent("CompleteRegistration", { source: "dashboard_first_access" });
      localStorage.setItem("ff_completed_registration", "1");
    }
  }, []);

  const {
    stats,
    recentOrders,
    channelData,
    hourlyData,
    topProducts,
    cashRegister,
    loading,
    refetch,
  } = useDashboard();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="animate-fade-in-up">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refetch} 
          disabled={loading}
          className="hover-lift"
        >
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Faturamento"
          value={formatCurrency(stats.totalRevenue)}
          change={stats.revenueChange}
          icon={DollarSign}
          iconColor="success"
          loading={loading}
          className="animate-fade-in-up"
          style={{ animationDelay: "0.1s" }}
        />
        <StatCard
          title="Pedidos"
          value={stats.totalOrders}
          change={stats.ordersChange}
          icon={ShoppingBag}
          iconColor="info"
          loading={loading}
          className="animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        />
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(stats.averageTicket)}
          change={stats.ticketChange}
          icon={TrendingUp}
          iconColor="primary"
          loading={loading}
          className="animate-fade-in-up"
          style={{ animationDelay: "0.3s" }}
        />
        <StatCard
          title="Em Preparo"
          value={stats.pendingOrders}
          icon={Clock}
          iconColor="warning"
          loading={loading}
          changeLabel="pedidos ativos"
          className="animate-fade-in-up"
          style={{ animationDelay: "0.4s" }}
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Hourly Chart - Takes 2 columns */}
        <GlassCard className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-1">Vendas por Hora</h3>
            <p className="text-sm text-muted-foreground mb-4">Distribuição de pedidos ao longo do dia</p>
            
            {loading ? (
              <div className="h-[250px] rounded shimmer" />
            ) : hourlyData.some((d) => d.orders > 0) ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                        boxShadow: "var(--shadow-3d-md)",
                      }}
                      formatter={(value: number, name: string) => [
                        name === "orders" ? `${value} pedidos` : formatCurrency(value),
                        name === "orders" ? "Pedidos" : "Faturamento",
                      ]}
                      labelFormatter={(label) => `Horário: ${label}`}
                    />
                    <Bar
                      dataKey="orders"
                      fill="hsl(var(--primary))"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhum pedido hoje
              </div>
            )}
          </div>
        </GlassCard>

        {/* Cash Register Status */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
          <CashRegisterCard {...cashRegister} loading={loading} />
        </div>
      </div>

      {/* Second Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Channel Distribution */}
        <GlassCard className="animate-fade-in-up" style={{ animationDelay: "0.7s" }}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-1">Pedidos por Canal</h3>
            <p className="text-sm text-muted-foreground mb-4">Distribuição do dia</p>
            
            {loading ? (
              <div className="h-[200px] rounded shimmer" />
            ) : channelData.length > 0 ? (
              <>
                <div className="h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={channelData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
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
                <div className="flex flex-wrap gap-3 justify-center">
                  {channelData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs">
                        {item.name}: {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Nenhum pedido hoje
              </div>
            )}
          </div>
        </GlassCard>

        {/* Top Products */}
        <GlassCard className="animate-fade-in-up" style={{ animationDelay: "0.8s" }}>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-semibold">Top 5 Produtos</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Mais vendidos do dia</p>
            
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-10 rounded shimmer" />
                ))}
              </div>
            ) : topProducts.length > 0 ? (
              <div className="space-y-2">
                {topProducts.map((product, index) => (
                  <div
                    key={product.name}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-primary w-5">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium truncate max-w-[140px]">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.quantity} vendidos
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">{formatCurrency(product.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Nenhuma venda hoje
              </div>
            )}
          </div>
        </GlassCard>

        {/* Recent Orders */}
        <GlassCard className="animate-fade-in-up" style={{ animationDelay: "0.9s" }}>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-1">Pedidos Recentes</h3>
            <p className="text-sm text-muted-foreground mb-4">Últimos 5 pedidos</p>
            
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-14 rounded shimmer" />
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-2">
                {recentOrders.map((order) => {
                  const ChannelIcon = channelIcons[order.channel] || Store;
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${channelColors[order.channel]}20`,
                          }}
                        >
                          <ChannelIcon
                            className="w-4 h-4"
                            style={{
                              color: channelColors[order.channel],
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">#{order.order_number}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {order.customer_name || "Cliente"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">
                          {formatCurrency(Number(order.total_price))}
                        </p>
                        <Badge
                          variant="secondary"
                          className={cn("text-xs", statusColors[order.status])}
                        >
                          {statusLabels[order.status]}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Nenhum pedido hoje
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
