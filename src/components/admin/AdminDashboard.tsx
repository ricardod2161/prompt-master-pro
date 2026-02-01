import { useAdminStats } from "@/hooks/useAdminStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Building2, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function AdminDashboard() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const cards = [
    {
      title: "Total de Usuários",
      value: stats?.totalUsers || 0,
      icon: Users,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient: "from-blue-500/10 to-cyan-500/10",
      iconBg: "bg-blue-500",
      trend: { value: 12, up: true },
    },
    {
      title: "Unidades Ativas",
      value: stats?.totalUnits || 0,
      icon: Building2,
      gradient: "from-green-500 to-emerald-500",
      bgGradient: "from-green-500/10 to-emerald-500/10",
      iconBg: "bg-green-500",
      trend: { value: 5, up: true },
    },
    {
      title: "Total de Pedidos",
      value: stats?.totalOrders || 0,
      icon: ShoppingCart,
      gradient: "from-orange-500 to-amber-500",
      bgGradient: "from-orange-500/10 to-amber-500/10",
      iconBg: "bg-orange-500",
      trend: { value: 23, up: true },
    },
    {
      title: "Receita Total",
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      gradient: "from-emerald-500 to-green-600",
      bgGradient: "from-emerald-500/10 to-green-600/10",
      iconBg: "bg-emerald-500",
      trend: { value: 8, up: true },
      isFormatted: true,
    },
    {
      title: "Pedidos (24h)",
      value: stats?.recentOrders || 0,
      icon: Clock,
      gradient: "from-purple-500 to-violet-500",
      bgGradient: "from-purple-500/10 to-violet-500/10",
      iconBg: "bg-purple-500",
      trend: { value: 3, up: false },
    },
    {
      title: "MRR Estimado",
      value: formatCurrency(
        (stats?.subscriptionsByTier.starter || 0) * 99.9 +
        (stats?.subscriptionsByTier.pro || 0) * 199.9 +
        (stats?.subscriptionsByTier.enterprise || 0) * 399.9
      ),
      icon: TrendingUp,
      gradient: "from-cyan-500 to-blue-500",
      bgGradient: "from-cyan-500/10 to-blue-500/10",
      iconBg: "bg-cyan-500",
      trend: { value: 15, up: true },
      isFormatted: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, index) => (
          <Card 
            key={card.title} 
            className={cn(
              "relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1",
              "animate-fade-in"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Background gradient */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-50",
              card.bgGradient
            )} />
            
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={cn(
                "p-2.5 rounded-xl shadow-lg",
                card.iconBg
              )}>
                <card.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-end justify-between">
                <p className={cn(
                  "text-2xl sm:text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                  card.gradient
                )}>
                  {card.isFormatted ? card.value : card.value.toLocaleString("pt-BR")}
                </p>
                
                {/* Trend indicator */}
                <div className={cn(
                  "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                  card.trend.up 
                    ? "bg-green-500/10 text-green-500" 
                    : "bg-red-500/10 text-red-500"
                )}>
                  {card.trend.up ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {card.trend.value}%
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription Breakdown - Premium Card */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/10 to-transparent blur-3xl" />
        
        <CardHeader className="relative">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">Distribuição de Assinaturas</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { 
                name: "Starter", 
                count: stats?.subscriptionsByTier.starter || 0,
                price: "R$ 99,90",
                gradient: "from-blue-500 to-cyan-500",
                bgGradient: "from-blue-500/10 to-cyan-500/10",
              },
              { 
                name: "Pro", 
                count: stats?.subscriptionsByTier.pro || 0,
                price: "R$ 199,90",
                gradient: "from-purple-500 to-pink-500",
                bgGradient: "from-purple-500/10 to-pink-500/10",
              },
              { 
                name: "Enterprise", 
                count: stats?.subscriptionsByTier.enterprise || 0,
                price: "R$ 399,90",
                gradient: "from-amber-500 to-orange-500",
                bgGradient: "from-amber-500/10 to-orange-500/10",
              },
            ].map((tier, i) => (
              <div 
                key={tier.name}
                className={cn(
                  "relative p-5 rounded-xl border overflow-hidden group hover:shadow-lg transition-all",
                  "animate-fade-in"
                )}
                style={{ animationDelay: `${(i + 6) * 50}ms` }}
              >
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-br opacity-50",
                  tier.bgGradient
                )} />
                <div className="relative text-center">
                  <p className={cn(
                    "text-4xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                    tier.gradient
                  )}>
                    {tier.count}
                  </p>
                  <p className="text-sm font-medium mt-1">{tier.name}</p>
                  <p className="text-xs text-muted-foreground">{tier.price}/mês</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Total MRR */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Receita Recorrente Mensal</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(
                    (stats?.subscriptionsByTier.starter || 0) * 99.9 +
                    (stats?.subscriptionsByTier.pro || 0) * 199.9 +
                    (stats?.subscriptionsByTier.enterprise || 0) * 399.9
                  )}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary/50" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
