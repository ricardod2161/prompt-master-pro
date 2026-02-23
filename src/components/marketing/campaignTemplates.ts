export interface CampaignTemplate {
  title: string;
  description: string;
  promptHint: string;
}

export const campaignTemplates: Record<string, CampaignTemplate[]> = {
  promotion: [
    {
      title: "Festival de Sabores - Até 40% OFF",
      description: "Pratos selecionados do nosso cardápio com descontos imperdíveis. Válido apenas esta semana!",
      promptHint: "emphasis on discount badges, percentage off labels, food variety display, urgency visual cues",
    },
    {
      title: "Combo Família - R$89,90 para 4 pessoas",
      description: "Reúna a família! Combo completo com entrada, prato principal, sobremesa e bebidas.",
      promptHint: "family gathering, abundant food table, warm cozy atmosphere, combo deal presentation",
    },
    {
      title: "Happy Hour - 2 por 1 em Drinks",
      description: "De segunda a sexta, das 17h às 20h. Traga um amigo e aproveite drinks em dobro!",
      promptHint: "cocktail glasses, bar atmosphere, neon lights, happy hour vibe, 2-for-1 visual",
    },
  ],
  daily_menu: [
    {
      title: "Prato do Chef - Risoto de Camarão",
      description: "Criação exclusiva do nosso chef com ingredientes frescos selecionados do dia.",
      promptHint: "chef's special plating, gourmet presentation, single hero dish, steam rising",
    },
    {
      title: "Almoço Executivo - A partir de R$24,90",
      description: "Opções variadas todos os dias: salada, prato principal, sobremesa e suco natural.",
      promptHint: "business lunch tray, multiple dishes, clean organized presentation, professional",
    },
    {
      title: "Novidade no Cardápio - Experimente Hoje",
      description: "Acabou de chegar! Novo prato criado especialmente para surpreender seu paladar.",
      promptHint: "new dish reveal, spotlight effect, curiosity-inducing, sparkle effects, fresh ingredients",
    },
  ],
  inauguration: [
    {
      title: "Grande Inauguração - Venha Celebrar!",
      description: "É com muita alegria que abrimos as portas! Venha conhecer nosso espaço e ganhe um brinde especial.",
      promptHint: "grand opening ribbon cutting, balloons, festive atmosphere, new restaurant facade",
    },
    {
      title: "Novo Endereço - Mesmo Sabor de Sempre",
      description: "Mudamos para um espaço maior e mais confortável. Venha nos visitar no novo endereço!",
      promptHint: "new location reveal, modern restaurant interior, welcoming entrance, renovation",
    },
  ],
  delivery: [
    {
      title: "Peça pelo App - Frete Grátis Hoje!",
      description: "Promoção relâmpago! Todos os pedidos pelo app com entrega gratuita. Aproveite!",
      promptHint: "smartphone with food app, delivery bag, free shipping badge, convenience",
    },
    {
      title: "Delivery Relâmpago - 30min ou Grátis",
      description: "Garantia de entrega rápida. Se passar de 30 minutos, o pedido sai por nossa conta!",
      promptHint: "fast delivery motorcycle, clock timer, speed lines, guarantee badge, urgency",
    },
    {
      title: "Monte Seu Combo Delivery",
      description: "Escolha entrada + prato + bebida por um preço especial. Exclusivo para delivery!",
      promptHint: "food packaging boxes, combo deal, multiple food items, delivery exclusive badge",
    },
  ],
  event: [
    {
      title: "Noite Italiana - Sexta Especial",
      description: "Menu completo com massas artesanais, vinhos selecionados e sobremesas tradicionais italianas.",
      promptHint: "Italian themed dinner, pasta, wine, candles, rustic Italian decor, themed night",
    },
    {
      title: "Live Music + Jantar - Sábado",
      description: "Música ao vivo com jantar especial. Reserve sua mesa e viva uma noite inesquecível!",
      promptHint: "live music stage, acoustic guitar, dinner setting, intimate atmosphere, spotlight",
    },
    {
      title: "Rodízio Especial de Fim de Semana",
      description: "Variedade ilimitada dos nossos melhores pratos. Venha com a família e amigos!",
      promptHint: "all-you-can-eat buffet, variety of dishes, abundance, festive dining hall",
    },
  ],
  holiday: [
    {
      title: "Dia das Mães - Menu Especial",
      description: "Celebre com quem mais ama! Menu degustação preparado com carinho para este dia especial.",
      promptHint: "Mother's Day celebration, flowers, elegant table setting, heart-shaped decorations",
    },
    {
      title: "Natal em Família - Reserve Sua Mesa",
      description: "Ceia de Natal completa com peru, chester, rabanada e muito mais. Vagas limitadas!",
      promptHint: "Christmas dinner, holiday decorations, festive table, Christmas tree, warm lighting",
    },
    {
      title: "Réveillon Gastronômico",
      description: "Receba o Ano Novo com um jantar exclusivo. Brinde com champagne e fogos de artifício!",
      promptHint: "New Year's Eve celebration, champagne glasses, confetti, midnight dinner, fireworks",
    },
  ],
  system: [
    {
      title: "Dashboard Inteligente - Gerencie Tudo",
      description: "Painel completo com gráficos de vendas, controle de pedidos e métricas em tempo real. Tecnologia que simplifica seu restaurante.",
      promptHint: "modern SaaS dashboard UI with sales charts, KPI cards, dark theme, clean minimalist design, restaurant management software screenshot mockup",
    },
    {
      title: "Sistema de Pedidos - Moderno e Rápido",
      description: "Gerencie pedidos de mesa, delivery e balcão em uma única tela. Interface intuitiva que agiliza seu atendimento.",
      promptHint: "order management interface, kanban board with order cards, status columns, tablet and mobile views, restaurant POS system",
    },
    {
      title: "Cardápio Digital - Experiência Premium",
      description: "Cardápio digital interativo com fotos profissionais, categorias organizadas e pedido direto pelo celular do cliente.",
      promptHint: "digital menu on smartphone screen, food photography grid, category tabs, add-to-cart button, QR code scanning",
    },
    {
      title: "Gestão Completa para Restaurantes",
      description: "Do pedido à cozinha, do caixa ao relatório. Sistema integrado que transforma a operação do seu restaurante.",
      promptHint: "multiple device mockup showing restaurant system, laptop dashboard, tablet kitchen display, phone menu, integrated ecosystem",
    },
  ],
};
