import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MessageSquare,
  Settings,
  Bot,
  Wifi,
  WifiOff,
  Phone,
  User,
  Clock,
  RefreshCw,
  Save,
  TestTube,
  Loader2,
} from "lucide-react";
import { useUnit } from "@/contexts/UnitContext";
import {
  useWhatsAppSettings,
  useCreateWhatsAppSettings,
  useUpdateWhatsAppSettings,
  useWhatsAppConversations,
  useToggleBotForConversation,
  useTestConnection,
} from "@/hooks/useWhatsApp";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function WhatsAppSettings() {
  const { selectedUnit } = useUnit();
  const { data: settings, isLoading } = useWhatsAppSettings();
  const { data: conversations, isLoading: loadingConversations } = useWhatsAppConversations();
  const createSettings = useCreateWhatsAppSettings();
  const updateSettings = useUpdateWhatsAppSettings();
  const toggleBot = useToggleBotForConversation();
  const testConnection = useTestConnection();

  // Form state
  const [apiUrl, setApiUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [instanceName, setInstanceName] = useState("");
  const [botEnabled, setBotEnabled] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");

  // Load settings into form
  useEffect(() => {
    if (settings) {
      setApiUrl(settings.api_url || "");
      setApiToken(settings.api_token || "");
      setInstanceName(settings.instance_name || "");
      setBotEnabled(settings.bot_enabled || false);
      setWelcomeMessage(settings.welcome_message || "");
      setSystemPrompt(settings.system_prompt || "");
    }
  }, [settings]);

  const handleSaveApiSettings = () => {
    const data = {
      api_url: apiUrl,
      api_token: apiToken,
      instance_name: instanceName,
    };

    if (settings?.id) {
      updateSettings.mutate({ id: settings.id, ...data });
    } else {
      createSettings.mutate(data);
    }
  };

  const handleSaveBotSettings = () => {
    const data = {
      bot_enabled: botEnabled,
      welcome_message: welcomeMessage,
      system_prompt: systemPrompt,
    };

    if (settings?.id) {
      updateSettings.mutate({ id: settings.id, ...data });
    } else {
      createSettings.mutate(data);
    }
  };

  const handleTestConnection = () => {
    if (!apiUrl || !apiToken || !instanceName) return;
    testConnection.mutate({ apiUrl, apiToken, instanceName });
  };

  if (!selectedUnit) {
    return (
      <div className="p-6">
        <EmptyState
          icon={MessageSquare}
          title="Selecione uma unidade"
          description="Selecione uma unidade para configurar o WhatsApp."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-7 w-7 text-green-500" />
            WhatsApp
          </h1>
          <p className="text-muted-foreground">
            Configure a integração com WhatsApp e o bot de atendimento
          </p>
        </div>
        <Badge
          variant={settings?.api_url ? "default" : "secondary"}
          className="flex items-center gap-1"
        >
          {settings?.api_url ? (
            <>
              <Wifi className="h-3 w-3" /> Configurado
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" /> Não configurado
            </>
          )}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="api" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            API
          </TabsTrigger>
          <TabsTrigger value="bot" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Bot
          </TabsTrigger>
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Conversas
          </TabsTrigger>
        </TabsList>

        {/* API Configuration Tab */}
        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração da Evolution API</CardTitle>
              <CardDescription>
                Configure a conexão com sua instância da Evolution API para integração com WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="api-url">URL da API</Label>
                  <Input
                    id="api-url"
                    placeholder="https://api.evolution.com"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    URL base da sua instância Evolution API
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instance-name">Nome da Instância</Label>
                  <Input
                    id="instance-name"
                    placeholder="minha-instancia"
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nome da instância configurada na Evolution API
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-token">Token de Autenticação</Label>
                <Input
                  id="api-token"
                  type="password"
                  placeholder="••••••••••••••••"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Token de autenticação (apikey) da Evolution API
                </p>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  onClick={handleTestConnection}
                  variant="outline"
                  disabled={!apiUrl || !apiToken || !instanceName || testConnection.isPending}
                >
                  {testConnection.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="h-4 w-4 mr-2" />
                  )}
                  Testar Conexão
                </Button>
                <Button
                  onClick={handleSaveApiSettings}
                  disabled={createSettings.isPending || updateSettings.isPending}
                >
                  {(createSettings.isPending || updateSettings.isPending) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Como configurar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong>1.</strong> Instale a Evolution API em seu servidor ou use um serviço hospedado
              </p>
              <p>
                <strong>2.</strong> Crie uma instância e conecte seu WhatsApp via QR Code
              </p>
              <p>
                <strong>3.</strong> Copie a URL base, nome da instância e token de autenticação
              </p>
              <p>
                <strong>4.</strong> Cole as informações acima e teste a conexão
              </p>
              <p className="pt-2">
                <a
                  href="https://doc.evolution-api.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Documentação da Evolution API →
                </a>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bot Configuration Tab */}
        <TabsContent value="bot" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Bot</CardTitle>
              <CardDescription>
                Configure o bot de atendimento automático para responder clientes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="bot-enabled" className="text-base">
                    Ativar Bot de Atendimento
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Quando ativado, o bot responderá automaticamente as mensagens
                  </p>
                </div>
                <Switch
                  id="bot-enabled"
                  checked={botEnabled}
                  onCheckedChange={setBotEnabled}
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="welcome-message">Mensagem de Boas-vindas</Label>
                <Textarea
                  id="welcome-message"
                  placeholder="Olá! Bem-vindo ao nosso atendimento. Como posso ajudar?"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Mensagem enviada automaticamente no primeiro contato do cliente
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="system-prompt">Prompt do Sistema (IA)</Label>
                <Textarea
                  id="system-prompt"
                  placeholder={`Você é um assistente de atendimento de um restaurante. Seja cordial e ajude os clientes com:
- Consulta do cardápio
- Realização de pedidos
- Informações sobre horário de funcionamento
- Status de pedidos em andamento

Sempre confirme os pedidos antes de finalizar.`}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Instruções para a IA sobre como responder aos clientes. Seja específico sobre o
                  comportamento desejado.
                </p>
              </div>

              <Button
                onClick={handleSaveBotSettings}
                disabled={createSettings.isPending || updateSettings.isPending}
              >
                {(createSettings.isPending || updateSettings.isPending) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Salvar Configurações do Bot
              </Button>
            </CardContent>
          </Card>

          {/* Bot Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dicas para o Prompt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                <strong>Seja específico:</strong> Descreva claramente o papel do bot e os limites do
                atendimento
              </p>
              <p>
                <strong>Inclua contexto:</strong> Mencione o tipo de estabelecimento, horários e
                serviços oferecidos
              </p>
              <p>
                <strong>Defina tom:</strong> Indique se o atendimento deve ser formal ou informal
              </p>
              <p>
                <strong>Limite escopo:</strong> Especifique quando o bot deve transferir para
                atendimento humano
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conversations Tab */}
        <TabsContent value="conversations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Conversas</CardTitle>
                  <CardDescription>
                    Gerencie as conversas ativas do WhatsApp
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingConversations ? (
                <LoadingSkeleton />
              ) : !conversations || conversations.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="Nenhuma conversa"
                  description="As conversas aparecerão aqui quando clientes entrarem em contato pelo WhatsApp."
                />
              ) : (
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Última Mensagem</TableHead>
                        <TableHead>Atualizado</TableHead>
                        <TableHead>Bot</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {conversations.map((conversation) => (
                        <TableRow key={conversation.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {conversation.customer_name || "Desconhecido"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              {conversation.phone}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {conversation.last_message || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              {conversation.last_message_at
                                ? formatDistanceToNow(new Date(conversation.last_message_at), {
                                    addSuffix: true,
                                    locale: ptBR,
                                  })
                                : "-"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Switch
                              checked={conversation.is_bot_active || false}
                              onCheckedChange={(checked) =>
                                toggleBot.mutate({
                                  conversationId: conversation.id,
                                  isBotActive: checked,
                                })
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
