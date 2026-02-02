import { Link } from "react-router-dom";
import { Check, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Starter",
    description: "Para pequenos restaurantes",
    price: "99",
    features: [
      "Até 50 pedidos/dia",
      "1 usuário",
      "PDV básico",
      "Relatórios simples",
    ],
    popular: false,
  },
  {
    name: "Professional",
    description: "Para restaurantes em crescimento",
    price: "199",
    features: [
      "Pedidos ilimitados",
      "5 usuários",
      "KDS + PDV completo",
      "WhatsApp integrado",
      "Relatórios avançados",
      "Suporte prioritário",
    ],
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Para redes e franquias",
    price: "399",
    features: [
      "Tudo do Professional",
      "Usuários ilimitados",
      "Multi-unidades",
      "API personalizada",
      "Gerente de conta",
      "SLA garantido",
    ],
    popular: false,
  },
];

export function PricingPreview() {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-1">
            <Sparkles className="w-4 h-4 mr-2" />
            Teste grátis por 14 dias
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Planos que{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              cabem no seu bolso
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Escolha o plano ideal para o tamanho do seu restaurante. 
            Sem taxa de adesão, cancele quando quiser.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl border p-6 transition-all duration-300",
                plan.popular
                  ? "border-primary bg-card shadow-lg shadow-primary/10 scale-105"
                  : "border-border/50 bg-card/50 hover:border-border hover:shadow-lg"
              )}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Mais Popular
                  </Badge>
                </div>
              )}

              {/* Plan Header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              {/* Price */}
              <div className="text-center mb-6">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-sm text-muted-foreground">R$</span>
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link to="/login">
                <Button
                  className={cn(
                    "w-full",
                    plan.popular ? "bg-primary" : "bg-secondary text-secondary-foreground"
                  )}
                >
                  Começar Agora
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Link to Full Pricing */}
        <div className="text-center mt-12">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            Ver comparação completa de planos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
