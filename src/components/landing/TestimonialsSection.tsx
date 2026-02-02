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
  },
  {
    id: 2,
    name: "Ana Rodrigues",
    role: "Gerente",
    restaurant: "Burger House",
    avatar: "AR",
    rating: 5,
    text: "A integração com WhatsApp foi um divisor de águas. Nossos clientes adoram fazer pedidos pelo celular e nós conseguimos atender muito mais gente sem aumentar a equipe.",
  },
  {
    id: 3,
    name: "Pedro Santos",
    role: "Chef Executivo",
    restaurant: "Sushi Premium",
    avatar: "PS",
    rating: 5,
    text: "O KDS é fantástico! Finalmente consigo ver todos os pedidos organizados por tempo e prioridade. A cozinha ficou muito mais eficiente e os pratos saem no tempo certo.",
  },
  {
    id: 4,
    name: "Mariana Costa",
    role: "Proprietária",
    restaurant: "Café & Bistrô",
    avatar: "MC",
    rating: 5,
    text: "O controle de estoque me salvou de vários prejuízos. Os alertas automáticos me avisam antes de acabar qualquer ingrediente. Nunca mais perdi uma venda por falta de produto.",
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
      </div>
    </section>
  );
}
