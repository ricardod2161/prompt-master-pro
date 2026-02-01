import { useDashboard } from "@/hooks/useDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  Clock,
  MessageSquare,
  UtensilsCrossed,
  Store,
  Truck,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
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
};

const statusColors: Record<string, string> = {
  pending: "bg-status-warning/20 text-status-warning",
  preparing: "bg-status-info/20 text-status-info",
  ready: "bg-status-success/20 text-status-success",
  delivered: "bg-muted text-muted-foreground",
  cancelled: "bg-status-error/20 text-status-error",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

function KpiCard({
  title,
  value,
  change,
  icon: Icon,
  loading,
  suffix = "vs ontem",
}: {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  suffix?: string;
}) {
  const isPositive = change !== undefined && change >= 0;

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1">
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3 text-status-success" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-status-error" />
            )}
            <span
              className={cn(
                "text-xs font-medium",
                isPositive ? "text-status-success" : "text-status-error"
              )}
            >
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">{suffix}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(!isOpen && "border-dashed opacity-60")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Status do Caixa
          </CardTitle>
          <Badge variant={isOpen ? "default" : "secondary"} className={isOpen ? "bg-status-success text-status-success-foreground" : ""}>
            {isOpen ? "Aberto" : "Fechado"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isOpen ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Abertura</p>
                <p className="text-sm font-medium">{formatCurrency(initialAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vendas</p>
                <p className="text-sm font-medium text-status-success">{formatCurrency(salesTotal)}</p>
              </div>
            </div>
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Saldo atual</span>
                <span className="text-lg font-bold">{formatCurrency(currentAmount)}</span>
              </div>
              {openedAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Aberto às {format(new Date(openedAt), "HH:mm")}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Nenhum caixa aberto</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
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
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Faturamento"
          value={formatCurrency(stats.totalRevenue)}
          change={stats.revenueChange}
          icon={DollarSign}
          loading={loading}
        />
        <KpiCard
          title="Pedidos"
          value={stats.totalOrders}
          change={stats.ordersChange}
          icon={ShoppingBag}
          loading={loading}
        />
        <KpiCard
          title="Ticket Médio"
          value={formatCurrency(stats.averageTicket)}
          change={stats.ticketChange}
          icon={TrendingUp}
          loading={loading}
        />
        <KpiCard
          title="Em Preparo"
          value={stats.pendingOrders}
          icon={Clock}
          loading={loading}
          suffix="pedidos ativos"
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Hourly Chart - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vendas por Hora</CardTitle>
            <CardDescription>Distribuição de pedidos ao longo do dia</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : hourlyData.some((d) => d.orders > 0) ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
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
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Nenhum pedido hoje
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cash Register Status */}
        <CashRegisterCard {...cashRegister} loading={loading} />
      </div>

      {/* Second Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Channel Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos por Canal</CardTitle>
            <CardDescription>Distribuição do dia</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[200px] w-full" />
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
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Top 5 Produtos
            </CardTitle>
            <CardDescription>Mais vendidos do dia</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((product, index) => (
                  <div
                    key={product.name}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-muted-foreground w-5">
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
                    <span className="text-sm font-medium">{formatCurrency(product.revenue)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Nenhuma venda hoje
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
            <CardDescription>Últimos 5 pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => {
                  const ChannelIcon = channelIcons[order.channel] || Store;
                  return (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
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
                        <p className="text-sm font-medium">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
