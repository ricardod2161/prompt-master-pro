import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Share2, Sparkles, Store } from "lucide-react";

const GUARANTEES = [
  "Sem cartão de crédito",
  "14 dias grátis",
  "Cancele quando quiser",
  "Suporte em português",
];

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6">
            <div className="px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <div className="flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="w-4 h-4" />
                Oferta especial por tempo limitado
              </div>
            </div>
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Pronto para{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              revolucionar
            </span>{" "}
            seu restaurante?
          </h2>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Junte-se a mais de 500 restaurantes que já transformaram suas operações 
            com o RestaurantOS. Comece gratuitamente hoje mesmo.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link to="/login">
              <Button size="lg" className="h-14 px-10 text-lg group">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <a href="https://restauranteos-11roq.myshopify.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="h-14 px-10 text-lg group">
                <Store className="mr-2 h-5 w-5" />
                Ver nossa Loja
              </Button>
            </a>
          </div>

          {/* Guarantees */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {GUARANTEES.map((guarantee) => (
              <div
                key={guarantee}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <CheckCircle2 className="w-4 h-4 text-primary" />
                {guarantee}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
