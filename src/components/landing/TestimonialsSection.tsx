import { useState, useEffect } from "react";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  {
    id: 1,
    name: "Carlos Silva",
    role: "Proprietário",
    restaurant: "Cantina Italiana",
    avatar: "CS",
    rating: 5,
    text: "O RestaurantOS transformou completamente nossa operação. Antes perdíamos pedidos e tínhamos confusão na cozinha. Agora tudo flui perfeitamente. Aumentamos nosso faturamento em 40% nos primeiros 3 meses.",
    metric: "+40% faturamento",
  },
  {
    id: 2,
    name: "Ana Rodrigues",
    role: "Gerente",
    restaurant: "Burger House",
    avatar: "AR",
    rating: 5,
    text: "A integração com WhatsApp foi um divisor de águas. Nossos clientes adoram fazer pedidos pelo celular e nós conseguimos atender muito mais gente sem aumentar a equipe.",
    metric: "+60% pedidos",
  },
  {
    id: 3,
    name: "Pedro Santos",
    role: "Chef Executivo",
    restaurant: "Sushi Premium",
    avatar: "PS",
    rating: 5,
    text: "O KDS é fantástico! Finalmente consigo ver todos os pedidos organizados por tempo e prioridade. A cozinha ficou muito mais eficiente e os pratos saem no tempo certo.",
    metric: "-30% tempo",
  },
  {
    id: 4,
    name: "Mariana Costa",
    role: "Proprietária",
    restaurant: "Café & Bistrô",
    avatar: "MC",
    rating: 5,
    text: "O controle de estoque me salvou de vários prejuízos. Os alertas automáticos me avisam antes de acabar qualquer ingrediente. Nunca mais perdi uma venda por falta de produto.",
    metric: "0 perdas",
  },
  {
    id: 5,
    name: "Roberto Oliveira",
    role: "Dono",
    restaurant: "Pizzaria Napolitana",
    avatar: "RO",
    rating: 5,
    text: "Passamos de 80 para mais de 200 pedidos por dia com o sistema. A organização que o RestaurantOS trouxe para nossa operação foi incrível. Recomendo para qualquer pizzaria!",
    metric: "+200 pedidos/dia",
  },
  {
    id: 6,
    name: "Juliana Mendes",
    role: "Empreendedora",
    restaurant: "Food Truck Gourmet",
    avatar: "JM",
    rating: 5,
    text: "O PDV móvel é perfeito para o food truck! Atendo em eventos, feiras e na rua com a mesma facilidade. O sistema funciona offline e sincroniza quando volta a conexão.",
    metric: "100% móvel",
  },
  {
    id: 7,
    name: "Fernando Lima",
    role: "Gerente Geral",
    restaurant: "Churrascaria Premium",
    avatar: "FL",
    rating: 5,
    text: "Com os relatórios do RestaurantOS identificamos os pratos mais rentáveis e otimizamos nosso cardápio. O ticket médio aumentou 25% em apenas dois meses.",
    metric: "+25% ticket médio",
  },
  {
    id: 8,
    name: "Camila Souza",
    role: "Proprietária",
    restaurant: "Padaria Artesanal",
    avatar: "CA",
    rating: 5,
    text: "Implementamos o delivery do zero em apenas duas semanas usando o RestaurantOS. Hoje representa 40% do nosso faturamento. Foi a melhor decisão que tomei para o negócio.",
    metric: "Delivery em 2 semanas",
  },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToPrev = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  const goToNext = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            O que nossos{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              clientes dizem
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Mais de 500 restaurantes confiam no RestaurantOS para suas operações diárias.
          </p>
        </div>

        {/* Testimonial Carousel */}
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            {/* Quote Icon */}
            <Quote className="absolute -top-6 -left-6 w-16 h-16 text-primary/10" />

            {/* Testimonial Card */}
            <div className="relative rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 md:p-12">
              <div className="min-h-[250px] flex flex-col justify-between">
                {/* Rating */}
                <div className="flex items-center gap-1 mb-6">
                  {[...Array(TESTIMONIALS[activeIndex].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>

                {/* Text */}
                <blockquote className="text-lg md:text-xl text-foreground/90 leading-relaxed mb-8">
                  "{TESTIMONIALS[activeIndex].text}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-bold">
                      {TESTIMONIALS[activeIndex].avatar}
                    </div>

                    <div>
                      <div className="font-semibold text-foreground">
                        {TESTIMONIALS[activeIndex].name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {TESTIMONIALS[activeIndex].role} • {TESTIMONIALS[activeIndex].restaurant}
                      </div>
                    </div>
                  </div>

                  {/* Metric Badge */}
                  <div className="hidden sm:block px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {TESTIMONIALS[activeIndex].metric}
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              {/* Dots */}
              <div className="flex items-center gap-2">
                {TESTIMONIALS.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setActiveIndex(index);
                    }}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      index === activeIndex
                        ? "w-8 bg-primary"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                  />
                ))}
              </div>

              {/* Arrows */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPrev}
                  className="rounded-full"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNext}
                  className="rounded-full"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Client Grid */}
        <div className="mt-16 max-w-4xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-6">
            Alguns dos restaurantes que confiam no RestaurantOS
          </p>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
            {TESTIMONIALS.map((testimonial) => (
              <button
                key={testimonial.id}
                onClick={() => {
                  setIsAutoPlaying(false);
                  setActiveIndex(testimonial.id - 1);
                }}
                className={cn(
                  "aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all",
                  activeIndex === testimonial.id - 1
                    ? "bg-primary text-primary-foreground scale-110 shadow-lg"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                )}
              >
                {testimonial.avatar}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
