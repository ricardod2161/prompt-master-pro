import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackPixelEvent } from "@/hooks/usePixelTracking";

const WHATSAPP_NUMBER = "5598982549505";
const DEFAULT_MESSAGE = "Olá! Gostaria de saber mais sobre o RestaurantOS para meu restaurante.";

export function FloatingWhatsApp() {
  const [isOpen, setIsOpen] = useState(false);

  const handleWhatsAppClick = () => {
    trackPixelEvent("Contact", { content_name: "whatsapp_floating", content_category: "landing_page" });
    const encodedMessage = encodeURIComponent(DEFAULT_MESSAGE);
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`,
      "_blank"
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Popup Message */}
      <div
        className={cn(
          "bg-card border border-border rounded-2xl p-4 shadow-lg max-w-[280px] transition-all duration-300 origin-bottom-right",
          isOpen
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2 pointer-events-none"
        )}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">RestaurantOS</p>
            <p className="text-xs text-muted-foreground">Responde em minutos</p>
          </div>
        </div>

        <p className="text-sm text-foreground/90 mb-4">
          Olá! 👋 Como posso ajudar seu restaurante hoje? Tire suas dúvidas sobre o sistema.
        </p>

        <Button
          onClick={handleWhatsAppClick}
          className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white"
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Iniciar Conversa
        </Button>
      </div>

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110",
          "animate-pulse hover:animate-none"
        )}
        aria-label="Abrir WhatsApp"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>
    </div>
  );
}
