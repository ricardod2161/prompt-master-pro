import { TrendingUp, Users, Clock, Shield } from "lucide-react";

const STATS = [
  {
    icon: Users,
    value: "500+",
    label: "Restaurantes Ativos",
    description: "Confiam no RestaurantOS",
  },
  {
    icon: TrendingUp,
    value: "1M+",
    label: "Pedidos Processados",
    description: "Todo mês na plataforma",
  },
  {
    icon: Clock,
    value: "99.9%",
    label: "Uptime Garantido",
    description: "Disponibilidade 24/7",
  },
  {
    icon: Shield,
    value: "100%",
    label: "Dados Seguros",
    description: "Criptografia de ponta",
  },
];

export function StatsSection() {
  return (
    <section className="py-16 relative overflow-hidden border-y border-border/50">
      {/* Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-primary/5 via-background to-primary/5" />

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center group">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-4 group-hover:scale-110 transition-transform">
                <stat.icon className="w-6 h-6" />
              </div>

              {/* Value */}
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>

              {/* Label */}
              <div className="font-medium text-foreground mb-1">{stat.label}</div>

              {/* Description */}
              <div className="text-sm text-muted-foreground">{stat.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
