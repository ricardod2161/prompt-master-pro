import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    question: "Quanto tempo leva para implementar o sistema?",
    answer: "A implementação é rápida e simples. A maioria dos restaurantes está operando em menos de 24 horas. Nossa equipe oferece suporte completo durante todo o processo de configuração inicial.",
  },
  {
    question: "Preciso de equipamentos especiais?",
    answer: "Não! O RestaurantOS funciona em qualquer dispositivo com navegador web - computadores, tablets ou smartphones. Para impressão de pedidos, você pode usar qualquer impressora térmica comum.",
  },
  {
    question: "Como funciona a integração com WhatsApp?",
    answer: "Utilizamos a Evolution API para conectar seu WhatsApp Business ao sistema. Seus clientes podem fazer pedidos diretamente pelo WhatsApp e você gerencia tudo pelo painel do RestaurantOS.",
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer: "Sim! Não temos fidelidade ou multa de cancelamento. Você pode cancelar sua assinatura a qualquer momento e continua com acesso até o fim do período pago.",
  },
  {
    question: "Meus dados estão seguros?",
    answer: "Absolutamente! Utilizamos criptografia de ponta a ponta, backups automáticos diários e servidores seguros. Seus dados são protegidos com os mais altos padrões de segurança do mercado.",
  },
  {
    question: "Oferecem suporte técnico?",
    answer: "Sim! Oferecemos suporte em português via chat, email e WhatsApp. Clientes dos planos Professional e Enterprise têm acesso a suporte prioritário com tempo de resposta garantido.",
  },
];

export function FAQSection() {
  return (
    <section id="faq" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-primary/5" />
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Perguntas{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Frequentes
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Tire suas dúvidas sobre o RestaurantOS. Não encontrou sua pergunta? 
            Entre em contato conosco.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {FAQ_ITEMS.map((item, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm px-6 data-[state=open]:border-primary/30"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  <span className="font-semibold">{item.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
