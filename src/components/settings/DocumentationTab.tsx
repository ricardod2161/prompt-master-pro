import { useState, useMemo } from "react";
import {
  BookOpen,
  Rocket,
  ShoppingCart,
  ChefHat,
  CreditCard,
  LayoutGrid,
  Truck,
  Package,
  MessageCircle,
  Settings,
  Bell,
  Brain,
  Download,
  HelpCircle,
  Search,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Accordion } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DocSection } from "./DocSection";
import { CodeBlock } from "./CodeBlock";

export function DocumentationTab() {
  const [searchQuery, setSearchQuery] = useState("");

  const sections = useMemo(() => [
    {
      value: "intro",
      icon: BookOpen,
      title: "Introdução ao Sistema",
      description: "Conheça o GastroHub e suas funcionalidades",
      badge: "Básico",
      keywords: ["introdução", "gastrohub", "sistema", "funcionalidades", "sobre"],
    },
    {
      value: "quickstart",
      icon: Rocket,
      title: "Guia de Início Rápido",
      description: "Primeiros passos para começar a usar",
      badge: "Básico",
      keywords: ["início", "começar", "primeiro", "acesso", "conta", "unidade", "logo"],
    },
    {
      value: "orders",
      icon: ShoppingCart,
      title: "Gestão de Pedidos",
      description: "Canais, status e acompanhamento",
      badge: "Essencial",
      keywords: ["pedidos", "balcão", "mesa", "delivery", "whatsapp", "status", "canal"],
    },
    {
      value: "kds",
      icon: ChefHat,
      title: "KDS - Tela da Cozinha",
      description: "Sistema de exibição para a cozinha",
      badge: "Operacional",
      keywords: ["kds", "cozinha", "preparo", "fila", "alerta", "sonoro"],
    },
    {
      value: "pos",
      icon: CreditCard,
      title: "Caixa (PDV)",
      description: "Pagamentos, sangria e relatórios",
      badge: "Financeiro",
      keywords: ["caixa", "pdv", "pagamento", "sangria", "suprimento", "relatório"],
    },
    {
      value: "tables",
      icon: LayoutGrid,
      title: "Gestão de Mesas",
      description: "Mapa visual e QR Codes",
      badge: "Operacional",
      keywords: ["mesa", "mapa", "qr", "code", "status", "ocupada", "livre"],
    },
    {
      value: "delivery",
      icon: Truck,
      title: "Delivery",
      description: "Entregadores e despacho",
      badge: "Operacional",
      keywords: ["delivery", "entrega", "entregador", "despacho", "taxa"],
    },
    {
      value: "inventory",
      icon: Package,
      title: "Estoque",
      description: "Controle de itens e alertas",
      badge: "Gestão",
      keywords: ["estoque", "item", "movimentação", "alerta", "baixo", "entrada", "saída"],
    },
    {
      value: "whatsapp",
      icon: MessageCircle,
      title: "Integração WhatsApp",
      description: "Chat em tempo real e bot",
      badge: "Avançado",
      keywords: ["whatsapp", "evolution", "api", "chat", "bot", "mensagem"],
    },
    {
      value: "settings",
      icon: Settings,
      title: "Configurações do Sistema",
      description: "Personalize sua unidade",
      badge: "Gestão",
      keywords: ["configuração", "unidade", "operacional", "financeiro", "horário", "aparência"],
    },
    {
      value: "notifications",
      icon: Bell,
      title: "Sistema de Notificações",
      description: "Alertas automáticos",
      badge: "Sistema",
      keywords: ["notificação", "alerta", "automático", "central", "aviso"],
    },
    {
      value: "ai",
      icon: Brain,
      title: "Análise com IA",
      description: "Inteligência artificial para logs",
      badge: "Avançado",
      keywords: ["ia", "inteligência", "artificial", "análise", "log", "problema"],
    },
    {
      value: "install",
      icon: Download,
      title: "Instalação e Deploy",
      description: "Como instalar e publicar",
      badge: "Técnico",
      keywords: ["instalação", "deploy", "publicar", "domínio", "lovable", "npm", "bun"],
    },
    {
      value: "faq",
      icon: HelpCircle,
      title: "FAQ e Suporte",
      description: "Perguntas frequentes",
      badge: "Ajuda",
      keywords: ["faq", "pergunta", "suporte", "erro", "problema", "ajuda"],
    },
  ], []);

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const query = searchQuery.toLowerCase();
    return sections.filter(
      (section) =>
        section.title.toLowerCase().includes(query) ||
        section.description.toLowerCase().includes(query) ||
        section.keywords.some((kw) => kw.includes(query))
    );
  }, [searchQuery, sections]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl">Documentação & Ajuda</CardTitle>
              <CardDescription>
                Guias completos de uso do sistema GastroHub
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar na documentação..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <div className="grid gap-3 md:grid-cols-3">
        <Alert className="border-blue-500/30 bg-blue-500/5">
          <Lightbulb className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-600">Dica</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            Use a busca para encontrar rapidamente o que precisa
          </AlertDescription>
        </Alert>
        <Alert className="border-green-500/30 bg-green-500/5">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-600">Atualizado</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            Documentação sempre sincronizada com o sistema
          </AlertDescription>
        </Alert>
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-600">Importante</AlertTitle>
          <AlertDescription className="text-sm text-muted-foreground">
            Leia as seções essenciais antes de operar
          </AlertDescription>
        </Alert>
      </div>

      {/* Documentation Sections */}
      {filteredSections.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground">
              Tente usar termos diferentes na busca
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-0">
          {/* Introdução */}
          {filteredSections.some((s) => s.value === "intro") && (
            <DocSection
              value="intro"
              icon={BookOpen}
              title="Introdução ao Sistema"
              description="Conheça o GastroHub e suas funcionalidades"
              badge="Básico"
            >
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  O <strong className="text-foreground">GastroHub</strong> é um sistema de gestão completo para restaurantes, 
                  desenvolvido com tecnologias modernas como React, TypeScript e banco de dados em nuvem. 
                  Ele oferece uma solução integrada para todas as operações do seu estabelecimento.
                </p>
                
                <div className="grid gap-3 sm:grid-cols-2">
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-primary" />
                        Multicanalidade
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Receba pedidos de balcão, mesa, delivery e WhatsApp em um único lugar
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ChefHat className="h-4 w-4 text-primary" />
                        KDS Integrado
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Tela dedicada para a cozinha com gerenciamento de filas em tempo real
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        Controle de Estoque
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Alertas automáticos de estoque baixo e rastreamento de movimentações
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Brain className="h-4 w-4 text-primary" />
                        IA Integrada
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Análise inteligente de logs para identificar e corrigir problemas
                    </CardContent>
                  </Card>
                </div>
              </div>
            </DocSection>
          )}

          {/* Guia de Início Rápido */}
          {filteredSections.some((s) => s.value === "quickstart") && (
            <DocSection
              value="quickstart"
              icon={Rocket}
              title="Guia de Início Rápido"
              description="Primeiros passos para começar a usar"
              badge="Básico"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Badge variant="outline" className="mt-0.5">1</Badge>
                  <div>
                    <h4 className="font-medium">Crie sua conta</h4>
                    <p className="text-sm text-muted-foreground">
                      Acesse a tela de login e clique em "Criar conta". Preencha seus dados e confirme o email.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Badge variant="outline" className="mt-0.5">2</Badge>
                  <div>
                    <h4 className="font-medium">Configure sua unidade</h4>
                    <p className="text-sm text-muted-foreground">
                      Após o login, vá em Configurações → Unidade. Preencha nome, CNPJ, endereço e telefone.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Badge variant="outline" className="mt-0.5">3</Badge>
                  <div>
                    <h4 className="font-medium">Faça upload da logo</h4>
                    <p className="text-sm text-muted-foreground">
                      Na mesma página, clique na área de upload para adicionar a logo da sua empresa.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Badge variant="outline" className="mt-0.5">4</Badge>
                  <div>
                    <h4 className="font-medium">Cadastre seus produtos</h4>
                    <p className="text-sm text-muted-foreground">
                      Vá em Cardápio e adicione categorias e produtos com preços e descrições.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <Badge variant="outline" className="mt-0.5">5</Badge>
                  <div>
                    <h4 className="font-medium">Comece a vender!</h4>
                    <p className="text-sm text-muted-foreground">
                      Abra o Caixa e comece a receber pedidos pelo PDV, mesas ou delivery.
                    </p>
                  </div>
                </div>
              </div>
            </DocSection>
          )}

          {/* Gestão de Pedidos */}
          {filteredSections.some((s) => s.value === "orders") && (
            <DocSection
              value="orders"
              icon={ShoppingCart}
              title="Gestão de Pedidos"
              description="Canais, status e acompanhamento"
              badge="Essencial"
            >
              <div className="space-y-4">
                <h4 className="font-medium">Canais de Recebimento</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <Badge className="bg-blue-500">Balcão</Badge>
                    <span className="text-sm text-muted-foreground">Atendimento direto no PDV</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <Badge className="bg-green-500">Mesa</Badge>
                    <span className="text-sm text-muted-foreground">Pedidos via QR Code</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <Badge className="bg-orange-500">Delivery</Badge>
                    <span className="text-sm text-muted-foreground">Entregas em domicílio</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <Badge className="bg-emerald-500">WhatsApp</Badge>
                    <span className="text-sm text-muted-foreground">Chat integrado</span>
                  </div>
                </div>

                <h4 className="font-medium mt-6">Fluxo de Status</h4>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
                    Pendente
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                    Preparando
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                    Pronto
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                    Entregue
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Os pedidos podem ser cancelados em qualquer etapa, se necessário.
                </p>
              </div>
            </DocSection>
          )}

          {/* KDS */}
          {filteredSections.some((s) => s.value === "kds") && (
            <DocSection
              value="kds"
              icon={ChefHat}
              title="KDS - Tela da Cozinha"
              description="Sistema de exibição para a cozinha"
              badge="Operacional"
            >
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  O Kitchen Display System (KDS) é uma interface dedicada para a equipe da cozinha, 
                  exibindo os pedidos em tempo real organizados por prioridade.
                </p>
                <div className="space-y-2">
                  <h4 className="font-medium">Funcionalidades:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Visualização em tempo real de todos os pedidos pendentes</li>
                    <li>Ordenação automática por tempo de espera</li>
                    <li>Alertas sonoros para novos pedidos</li>
                    <li>Indicador de tempo decorrido por pedido</li>
                    <li>Transição rápida de status com um clique</li>
                    <li>Destaque visual para pedidos atrasados</li>
                  </ul>
                </div>
                <Alert className="border-amber-500/30 bg-amber-500/5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <AlertDescription className="text-sm">
                    Configure o tempo de preparo padrão em Configurações → Operacional para alertas precisos.
                  </AlertDescription>
                </Alert>
              </div>
            </DocSection>
          )}

          {/* PDV */}
          {filteredSections.some((s) => s.value === "pos") && (
            <DocSection
              value="pos"
              icon={CreditCard}
              title="Caixa (PDV)"
              description="Pagamentos, sangria e relatórios"
              badge="Financeiro"
            >
              <div className="space-y-4">
                <h4 className="font-medium">Abertura de Caixa</h4>
                <p className="text-sm text-muted-foreground">
                  Antes de registrar vendas, é necessário abrir o caixa informando o valor inicial (troco).
                </p>

                <h4 className="font-medium">Formas de Pagamento</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">💵 Dinheiro</Badge>
                  <Badge variant="outline">💳 Crédito</Badge>
                  <Badge variant="outline">💳 Débito</Badge>
                  <Badge variant="outline">📱 PIX</Badge>
                  <Badge variant="outline">🎫 Voucher</Badge>
                </div>

                <h4 className="font-medium">Sangria e Suprimento</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Sangria:</strong> Retirada de dinheiro do caixa (para banco, etc.)</li>
                  <li><strong>Suprimento:</strong> Adição de dinheiro ao caixa</li>
                </ul>

                <h4 className="font-medium">Fechamento</h4>
                <p className="text-sm text-muted-foreground">
                  Ao fechar o caixa, o sistema calcula automaticamente o valor esperado com base nas vendas 
                  e movimentações, permitindo conferência com o valor real.
                </p>
              </div>
            </DocSection>
          )}

          {/* Mesas */}
          {filteredSections.some((s) => s.value === "tables") && (
            <DocSection
              value="tables"
              icon={LayoutGrid}
              title="Gestão de Mesas"
              description="Mapa visual e QR Codes"
              badge="Operacional"
            >
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Gerencie suas mesas com um mapa visual interativo e gere QR Codes únicos para cada mesa.
                </p>
                
                <h4 className="font-medium">Status das Mesas</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-green-500">Livre</Badge>
                  <Badge className="bg-red-500">Ocupada</Badge>
                  <Badge className="bg-yellow-500">Aguardando Pedido</Badge>
                </div>

                <h4 className="font-medium">QR Code</h4>
                <p className="text-sm text-muted-foreground">
                  Cada mesa possui um QR Code único que, ao ser escaneado pelo cliente, 
                  direciona para o cardápio digital com identificação automática da mesa.
                </p>
              </div>
            </DocSection>
          )}

          {/* Delivery */}
          {filteredSections.some((s) => s.value === "delivery") && (
            <DocSection
              value="delivery"
              icon={Truck}
              title="Delivery"
              description="Entregadores e despacho"
              badge="Operacional"
            >
              <div className="space-y-4">
                <h4 className="font-medium">Cadastro de Entregadores</h4>
                <p className="text-sm text-muted-foreground">
                  Cadastre seus entregadores com nome, telefone e veículo para facilitar o despacho.
                </p>

                <h4 className="font-medium">Despacho de Pedidos</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Atribua entregadores aos pedidos prontos</li>
                  <li>Acompanhe o status da entrega</li>
                  <li>Registre o horário de saída e chegada</li>
                </ul>

                <h4 className="font-medium">Taxas de Entrega</h4>
                <p className="text-sm text-muted-foreground">
                  Configure a taxa de entrega e o pedido mínimo em Configurações → Financeiro.
                </p>
              </div>
            </DocSection>
          )}

          {/* Estoque */}
          {filteredSections.some((s) => s.value === "inventory") && (
            <DocSection
              value="inventory"
              icon={Package}
              title="Estoque"
              description="Controle de itens e alertas"
              badge="Gestão"
            >
              <div className="space-y-4">
                <h4 className="font-medium">Cadastro de Itens</h4>
                <p className="text-sm text-muted-foreground">
                  Cadastre insumos com nome, unidade de medida, estoque atual, estoque mínimo e custo.
                </p>

                <h4 className="font-medium">Tipos de Movimentação</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-green-500/10">Compra (entrada)</Badge>
                  <Badge variant="outline" className="bg-red-500/10">Venda (saída)</Badge>
                  <Badge variant="outline" className="bg-blue-500/10">Ajuste</Badge>
                  <Badge variant="outline" className="bg-amber-500/10">Perda</Badge>
                  <Badge variant="outline" className="bg-purple-500/10">Transferência</Badge>
                </div>

                <Alert className="border-red-500/30 bg-red-500/5">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <AlertTitle className="text-red-600">Alerta Automático</AlertTitle>
                  <AlertDescription className="text-sm">
                    Quando o estoque atingir o mínimo configurado, uma notificação será exibida automaticamente.
                  </AlertDescription>
                </Alert>
              </div>
            </DocSection>
          )}

          {/* WhatsApp */}
          {filteredSections.some((s) => s.value === "whatsapp") && (
            <DocSection
              value="whatsapp"
              icon={MessageCircle}
              title="Integração WhatsApp"
              description="Chat em tempo real e bot"
              badge="Avançado"
            >
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Integre o WhatsApp ao sistema usando a Evolution API para atendimento e pedidos automatizados.
                </p>

                <h4 className="font-medium">Configuração</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Acesse a página de configurações do WhatsApp</li>
                  <li>Configure a URL da sua instância Evolution API</li>
                  <li>Insira o token de autenticação</li>
                  <li>Defina o nome da instância</li>
                  <li>Teste a conexão</li>
                </ol>

                <h4 className="font-medium">Funcionalidades</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Chat em tempo real com clientes</li>
                  <li>Bot automático com respostas programadas</li>
                  <li>Mensagem de boas-vindas personalizável</li>
                  <li>Histórico de conversas</li>
                </ul>
              </div>
            </DocSection>
          )}

          {/* Configurações */}
          {filteredSections.some((s) => s.value === "settings") && (
            <DocSection
              value="settings"
              icon={Settings}
              title="Configurações do Sistema"
              description="Personalize sua unidade"
              badge="Gestão"
            >
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Unidade</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Nome, CNPJ, endereço, telefone e logo
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Operacional</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Impressão automática, notificações, canais
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Financeiro</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Taxas, formas de pagamento, pedido mínimo
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Horários</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Horário de funcionamento por dia da semana
                    </CardContent>
                  </Card>
                </div>
              </div>
            </DocSection>
          )}

          {/* Notificações */}
          {filteredSections.some((s) => s.value === "notifications") && (
            <DocSection
              value="notifications"
              icon={Bell}
              title="Sistema de Notificações"
              description="Alertas automáticos"
              badge="Sistema"
            >
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  O sistema envia notificações automáticas para eventos importantes, 
                  mantendo você informado em tempo real.
                </p>

                <h4 className="font-medium">Tipos de Alertas</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Novo pedido recebido</li>
                  <li>Pedido pronto para entrega</li>
                  <li>Estoque baixo</li>
                  <li>Nova mensagem no WhatsApp</li>
                  <li>Caixa fechado</li>
                </ul>

                <p className="text-sm text-muted-foreground">
                  Acesse a Central de Notificações clicando no ícone de sino no topo da página.
                </p>
              </div>
            </DocSection>
          )}

          {/* IA */}
          {filteredSections.some((s) => s.value === "ai") && (
            <DocSection
              value="ai"
              icon={Brain}
              title="Análise com IA"
              description="Inteligência artificial para logs"
              badge="Avançado"
            >
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  O módulo de IA analisa os logs do sistema para identificar problemas, 
                  padrões de erros e sugerir correções automaticamente.
                </p>

                <h4 className="font-medium">Funcionalidades</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Análise automática de logs de erro</li>
                  <li>Identificação de padrões problemáticos</li>
                  <li>Sugestões de correção contextualizadas</li>
                  <li>Histórico de análises anteriores</li>
                </ul>

                <Alert className="border-primary/30 bg-primary/5">
                  <Brain className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">
                    Acesse Admin → Análise de Logs para usar este recurso.
                  </AlertDescription>
                </Alert>
              </div>
            </DocSection>
          )}

          {/* Instalação */}
          {filteredSections.some((s) => s.value === "install") && (
            <DocSection
              value="install"
              icon={Download}
              title="Instalação e Deploy"
              description="Como instalar e publicar"
              badge="Técnico"
            >
              <div className="space-y-4">
                <h4 className="font-medium">Pré-requisitos</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Node.js 18+ ou Bun 1.0+</li>
                  <li>Git instalado</li>
                  <li>Conta no Lovable (para deploy)</li>
                </ul>

                <h4 className="font-medium">Instalação Local</h4>
                <CodeBlock
                  title="Comandos de instalação"
                  language="bash"
                  code={`# Clone o repositório
git clone <URL_DO_REPOSITORIO>
cd gastrohub

# Instale as dependências
npm install
# ou com Bun (mais rápido)
bun install

# Inicie o servidor de desenvolvimento
npm run dev
# ou
bun dev

# Acesse no navegador
# http://localhost:5173`}
                />

                <h4 className="font-medium">Deploy via Lovable</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Faça login no Lovable</li>
                  <li>Clique em "Publicar" no canto superior direito</li>
                  <li>Aguarde o build ser concluído</li>
                  <li>Seu app estará disponível em uma URL pública</li>
                </ol>

                <h4 className="font-medium">Domínio Customizado</h4>
                <p className="text-sm text-muted-foreground">
                  Para usar um domínio próprio, acesse as configurações do projeto no Lovable 
                  e siga as instruções para configurar o DNS.
                </p>
              </div>
            </DocSection>
          )}

          {/* FAQ */}
          {filteredSections.some((s) => s.value === "faq") && (
            <DocSection
              value="faq"
              icon={HelpCircle}
              title="FAQ e Suporte"
              description="Perguntas frequentes"
              badge="Ajuda"
            >
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <h4 className="font-medium text-sm">Como altero a senha?</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Vá em Configurações → Perfil e preencha os campos de nova senha.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <h4 className="font-medium text-sm">Posso usar em múltiplos dispositivos?</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Sim! O sistema é 100% web e responsivo, funcionando em computadores, tablets e celulares.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <h4 className="font-medium text-sm">Como faço backup dos dados?</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Os dados são armazenados em nuvem com backup automático. Para exportar, use os relatórios.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30">
                    <h4 className="font-medium text-sm">O sistema funciona offline?</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Não, é necessária conexão com a internet para sincronização em tempo real.
                    </p>
                  </div>
                </div>

                <Alert className="border-primary/30 bg-primary/5">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  <AlertTitle>Precisa de mais ajuda?</AlertTitle>
                  <AlertDescription className="text-sm">
                    Entre em contato com o suporte técnico ou consulte a documentação completa no GitHub.
                  </AlertDescription>
                </Alert>
              </div>
            </DocSection>
          )}
        </Accordion>
      )}
    </div>
  );
}
