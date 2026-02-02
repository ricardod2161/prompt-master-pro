import { 
  ShoppingBag, 
  Monitor, 
  CreditCard, 
  Package, 
  MessageSquare, 
  Brain,
  ArrowRight
} from "lucide-react";
import { Card3D } from "@/components/ui/card-3d";
import { cn } from "@/lib/utils";

const FEATURES = [
  {
    icon: ShoppingBag,
    title: "Pedidos Multicanal",
    description: "Receba pedidos do balcão, mesas, delivery e WhatsApp em um só lugar. Gestão centralizada e eficiente.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Monitor,
    title: "KDS Inteligente",
    description: "Tela da cozinha com filas organizadas, tempos de preparo e alertas sonoros para máxima eficiência.",
    color: "from-orange-500 to-red-500",
  },
  {
    icon: CreditCard,
    title: "PDV Completo",
    description: "Caixa com múltiplas formas de pagamento, controle de sangria, suprimentos e fechamento detalhado.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Package,
    title: "Estoque Automático",
    description: "Alertas de estoque baixo, rastreamento de movimentações e relatórios de consumo em tempo real.",
    color: "from-purple-500 to-violet-500",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp Integrado",
    description: "Chat em tempo real com clientes, bot automático para pedidos e notificações de status.",
    color: "from-green-400 to-green-600",
  },
  {
    icon: Brain,
    title: "IA para Análise",
    description: "Identificação automática de problemas, sugestões de correção e insights para melhorar suas operações.",
    color: "from-pink-500 to-rose-500",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Tudo que você precisa para{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              gerenciar seu restaurante
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Módulos integrados que trabalham juntos para simplificar sua operação 
            e maximizar seus resultados.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (
            <Card3D
              key={feature.title}
              variant="elevated"
              className="group p-6 relative overflow-hidden"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient Background on Hover */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500",
                `bg-gradient-to-br ${feature.color}`
              )} />

              <div className="relative z-10">
                {/* Icon */}
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                  "bg-gradient-to-br shadow-lg",
                  feature.color
                )}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {feature.description}
                </p>

                {/* Learn More Link */}
                <button className="inline-flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Saiba mais
                  <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </Card3D>
          ))}
        </div>
      </div>
    </section>
  );
}
