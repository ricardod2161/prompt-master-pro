import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import type { PromptFormData } from "./types";

interface BusinessTemplatesProps {
  businessType: string;
  onApply: (data: Partial<PromptFormData>) => void;
}

const TEMPLATES: Record<string, Partial<PromptFormData>> = {
  pizzaria: {
    businessDescription: "Pizzaria artesanal com massa feita na hora, ingredientes frescos e sabores tradicionais e especiais. Atendemos delivery e balcão com foco na qualidade.",
    botName: "PizzaBot",
    voiceTone: "descontraido",
    emojiLevel: "moderado",
    specialRules: "Pedido mínimo de R$ 30 para delivery. Pizzas meio a meio disponíveis. Bordas recheadas sob consulta. Tempo de entrega: 40-60 minutos.",
  },
  hamburgueria: {
    businessDescription: "Hamburgueria artesanal com blend exclusivo, pães artesanais e ingredientes premium. Combos especiais e opções para todos os gostos.",
    botName: "BurgerBot",
    voiceTone: "divertido",
    emojiLevel: "bastante",
    specialRules: "Ponto da carne: mal passado, ao ponto ou bem passado. Combos incluem batata frita e refrigerante. Adicionais cobrados à parte.",
  },
  churrascaria: {
    businessDescription: "Churrascaria tradicional com cardápio do dia completo, incluindo acompanhamentos variados como feijoada, feijão mexido, arroz de leite, arroz refogado, baião, macarrão, farofa de farinha, maionese, vinagrete, batata doce, salada verde e fruta. Proteínas assadas na brasa: boi, porco, frango, linguiça e filé de peixe frito. Servimos marmitas e pratos feitos com foco em comida caseira de qualidade. Atendemos no salão, delivery e retirada no balcão.",
    botName: "ChurrasBot",
    voiceTone: "profissional",
    emojiLevel: "moderado",
    specialRules: "Cardápio do dia muda diariamente. Proteínas sujeitas à disponibilidade. Marmitas com acompanhamentos fixos do dia, cliente escolhe a proteína. Pedido mínimo para delivery sob consulta.",
  },
  restaurante: {
    businessDescription: "Restaurante com cardápio variado, pratos executivos no almoço e menu especial aos finais de semana. Cozinha brasileira com toque autoral.",
    botName: "GarçomBot",
    voiceTone: "profissional",
    emojiLevel: "moderado",
    specialRules: "Prato executivo disponível apenas no almoço (11h-15h). Sobremesa do dia sob consulta. Reservas aceitas com 24h de antecedência.",
  },
  lanchonete: {
    businessDescription: "Lanchonete com lanches rápidos, salgados, sucos naturais e refeições práticas. Atendimento rápido no balcão e delivery.",
    botName: "LancheBot",
    voiceTone: "descontraido",
    emojiLevel: "moderado",
    specialRules: "Combos promocionais no almoço. Salgados frescos a cada hora. Sucos feitos na hora.",
  },
  padaria: {
    businessDescription: "Padaria artesanal com pães frescos diariamente, confeitaria fina, café especial e salgados assados. Encomendas para eventos.",
    botName: "PãoBot",
    voiceTone: "profissional",
    emojiLevel: "moderado",
    specialRules: "Encomendas com 48h de antecedência. Pães especiais disponíveis até 10h. Bolos sob encomenda com mínimo de 24h.",
  },
  doceria: {
    businessDescription: "Doceria artesanal com doces finos, bolos decorados, brigadeiros gourmet e sobremesas exclusivas. Encomendas para festas e eventos.",
    botName: "DoceBot",
    voiceTone: "divertido",
    emojiLevel: "bastante",
    specialRules: "Encomendas com 72h de antecedência para bolos decorados. Mínimo de 50 unidades para brigadeiros gourmet. Degustação mediante agendamento.",
  },
  cafeteria: {
    businessDescription: "Cafeteria especializada com grãos selecionados, métodos artesanais de preparo, acompanhamentos e ambiente acolhedor.",
    botName: "CaféBot",
    voiceTone: "profissional",
    emojiLevel: "moderado",
    specialRules: "Café coado na hora. Leites vegetais disponíveis (+R$2). Wi-Fi gratuito para clientes. Happy hour a partir das 17h.",
  },
  japonesa: {
    businessDescription: "Restaurante japonês com sushi, sashimi, temakis e pratos quentes da culinária oriental. Peixes frescos selecionados diariamente.",
    botName: "SushiBot",
    voiceTone: "profissional",
    emojiLevel: "moderado",
    specialRules: "Combos especiais para 2 pessoas. Rodízio disponível de terça a domingo. Peixe do dia sob consulta. Wasabi e gengibre inclusos.",
  },
  acaiteria: {
    businessDescription: "Açaiteria com açaí premium da Amazônia, bowls personalizados, smoothies e complementos variados. Opções fit e proteicas.",
    botName: "AçaíBot",
    voiceTone: "divertido",
    emojiLevel: "bastante",
    specialRules: "Tamanhos: 300ml, 500ml, 700ml e 1L. Complementos adicionais cobrados por unidade. Opção de açaí zero açúcar disponível.",
  },
};

export function BusinessTemplates({ businessType, onApply }: BusinessTemplatesProps) {
  const template = TEMPLATES[businessType];

  if (!template) return null;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => onApply(template)}
      className="gap-1.5"
    >
      <FileText className="h-3.5 w-3.5" />
      Usar Template
    </Button>
  );
}
