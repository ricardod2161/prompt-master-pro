import { Building2, UtensilsCrossed, Rocket, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    number: "01",
    icon: Building2,
    title: "Cadastre seu Restaurante",
    description: "Configure sua unidade em minutos com dados básicos. Upload de logo, endereço, horários de funcionamento e configurações iniciais.",
    features: ["Cadastro rápido", "Configuração guiada", "Suporte dedicado"],
  },
  {
    number: "02",
    icon: UtensilsCrossed,
    title: "Adicione seus Produtos",
    description: "Cadastre seu cardápio completo com categorias, preços, fotos e opcionais. Importe de planilhas ou cadastre manualmente.",
    features: ["Importação em massa", "Fotos dos produtos", "Categorização inteligente"],
  },
  {
    number: "03",
    icon: Rocket,
    title: "Comece a Vender",
    description: "Receba pedidos de múltiplos canais e gerencie tudo em tempo real. Dashboard completo com métricas e relatórios.",
    features: ["Multicanal integrado", "Tempo real", "Relatórios automáticos"],
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-primary/5" />
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Comece em{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              3 passos simples
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Implementação rápida e sem complicações. Seu restaurante operando 
            com tecnologia de ponta em minutos.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative max-w-5xl mx-auto">
          {/* Connection Line */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gradient-to-b from-primary/50 via-primary to-primary/50 hidden lg:block" />

          <div className="space-y-12 lg:space-y-0">
            {STEPS.map((step, index) => (
              <div
                key={step.number}
                className={cn(
                  "relative grid lg:grid-cols-2 gap-8 lg:gap-16 items-center",
                  index % 2 === 1 && "lg:text-right"
                )}
              >
                {/* Content */}
                <div className={cn(
                  "order-2",
                  index % 2 === 1 ? "lg:order-1" : "lg:order-2"
                )}>
                  <div className={cn(
                    "p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm",
                    "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                  )}>
                    {/* Step Number */}
                    <div className={cn(
                      "inline-flex items-center gap-2 text-xs font-bold text-primary mb-4",
                      index % 2 === 1 && "lg:flex-row-reverse"
                    )}>
                      <span className="px-2 py-1 rounded bg-primary/10">PASSO {step.number}</span>
                    </div>

                    <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Features */}
                    <div className={cn(
                      "flex flex-wrap gap-2",
                      index % 2 === 1 && "lg:justify-end"
                    )}>
                      {step.features.map((feature) => (
                        <div
                          key={feature}
                          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground"
                        >
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Icon Circle */}
                <div className={cn(
                  "order-1 flex justify-center",
                  index % 2 === 1 ? "lg:order-2" : "lg:order-1"
                )}>
                  <div className="relative">
                    {/* Glow */}
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
                    
                    {/* Circle */}
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
                      <step.icon className="w-10 h-10 text-primary-foreground" />
                    </div>

                    {/* Number Badge */}
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center text-xs font-bold">
                      {step.number}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
