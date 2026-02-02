import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Play, Star, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
        
        {/* Floating Blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse delay-500" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-6 animate-fade-in">
            <Badge variant="outline" className="px-4 py-2 text-sm border-primary/30 bg-primary/5">
              <Sparkles className="w-4 h-4 mr-2 text-primary" />
              Sistema #1 para Restaurantes no Brasil
            </Badge>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight mb-6 animate-fade-in">
            <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Transforme seu Restaurante com{" "}
            </span>
            <span className="bg-gradient-to-r from-primary via-primary to-primary/70 bg-clip-text text-transparent">
              Tecnologia Inteligente
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 animate-fade-in leading-relaxed">
            Sistema completo de gestão que integra pedidos, cozinha, estoque e delivery 
            em uma única plataforma poderosa. Simplifique suas operações e aumente seus lucros.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in">
            <Link to="/login">
              <Button size="lg" className="group h-12 px-8 text-base">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="h-12 px-8 text-base group">
              <Play className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              Ver Demonstração
            </Button>
          </div>

          {/* Social Proof */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground animate-fade-in">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-primary text-primary" />
              ))}
              <span className="ml-2">4.9/5 de avaliação</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <span>+500 restaurantes ativos</span>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <span>Suporte em português</span>
          </div>

          {/* Dashboard Preview */}
          <div className="relative mt-16 animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="relative mx-auto max-w-4xl">
              {/* Browser Frame */}
              <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-2xl">
                {/* Browser Header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1 rounded-md bg-background/50 text-xs text-muted-foreground">
                      restaurantos.app/dashboard
                    </div>
                  </div>
                </div>
                {/* Dashboard Mockup */}
                <div className="aspect-[16/9] bg-gradient-to-br from-card via-card to-primary/5 p-6">
                  <div className="grid grid-cols-4 gap-4 h-full">
                    {/* Stats Cards */}
                    <div className="col-span-4 grid grid-cols-4 gap-4">
                      {["Pedidos Hoje", "Faturamento", "Ticket Médio", "Mesas Ativas"].map((stat, i) => (
                        <div key={stat} className="rounded-lg bg-background/50 border border-border/30 p-4">
                          <div className="text-xs text-muted-foreground mb-1">{stat}</div>
                          <div className="text-lg font-bold">
                            {i === 0 ? "127" : i === 1 ? "R$ 4.850" : i === 2 ? "R$ 38" : "12/20"}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Chart Placeholder */}
                    <div className="col-span-3 rounded-lg bg-background/50 border border-border/30 p-4">
                      <div className="text-sm font-medium mb-4">Vendas da Semana</div>
                      <div className="flex items-end gap-2 h-32">
                        {[40, 65, 55, 80, 95, 70, 85].map((height, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-primary/60 rounded-t transition-all hover:bg-primary"
                            style={{ height: `${height}%` }}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Orders List */}
                    <div className="col-span-1 rounded-lg bg-background/50 border border-border/30 p-4">
                      <div className="text-sm font-medium mb-4">Pedidos</div>
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((_, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                            <div className="text-xs text-muted-foreground">Mesa {i + 1}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
