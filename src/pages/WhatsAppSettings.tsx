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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageSquare,
  Settings,
  Bot,
  Phone,
  User,
  Clock,
  RefreshCw,
  Save,
  TestTube,
  Loader2,
  Copy,
  Check,
  Link,
  MessageCircle,
  Users,
  Activity,
  Zap,
  ExternalLink,
  AlertCircle,
  Lock,
  Unlock,
  Shield,
  Eye,
  EyeOff,
  Volume2,
  Play,
  Square,
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
import { AIPromptGenerator } from "@/components/settings/AIPromptGenerator";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const WEBHOOK_URL = "https://qxqxahgfqjctvsjddfbh.supabase.co/functions/v1/whatsapp-webhook";

export default function WhatsAppSettings() {
  const { selectedUnit } = useUnit();
  const { toast } = useToast();
  const { data: settings, isLoading } = useWhatsAppSettings();
  const { data: conversations, isLoading: loadingConversations, refetch: refetchConversations } = useWhatsAppConversations();
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
  const [copied, setCopied] = useState(false);

  // TTS state
  const [ttsMode, setTtsMode] = useState("auto");
  const [ttsVoiceId, setTtsVoiceId] = useState("FGY2WhTYpPnrIDTdsKH5");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);

  const handleVoicePreview = async () => {
    // Stop current preview if playing
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
      setPreviewAudio(null);
      setIsPreviewPlaying(false);
      return;
    }

    setIsPreviewLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts-preview`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ voiceId: ttsVoiceId }),
        }
      );

      if (!response.ok) throw new Error("Falha ao gerar preview");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);

      audio.onended = () => {
        setIsPreviewPlaying(false);
        setPreviewAudio(null);
        URL.revokeObjectURL(url);
      };

      audio.onerror = () => {
        setIsPreviewPlaying(false);
        setPreviewAudio(null);
        URL.revokeObjectURL(url);
      };

      setPreviewAudio(audio);
      setIsPreviewPlaying(true);
      await audio.play();
    } catch (error) {
      console.error("Voice preview error:", error);
      toast({
        variant: "destructive",
        title: "Erro no preview",
        description: "Não foi possível reproduzir a amostra da voz. Tente novamente.",
      });
      setIsPreviewPlaying(false);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Password protection state
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  
  // Password configuration state
  const [enablePasswordProtection, setEnablePasswordProtection] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const hasPasswordProtection = !!settings?.settings_password;

  // Load settings into form
  useEffect(() => {
    if (settings) {
      setApiUrl(settings.api_url || "");
      setApiToken(settings.api_token || "");
      setInstanceName(settings.instance_name || "");
      setBotEnabled(settings.bot_enabled || false);
      setWelcomeMessage(settings.welcome_message || "");
      setSystemPrompt(settings.system_prompt || "");
      setTtsMode(settings.tts_mode || "auto");
      setTtsVoiceId(settings.tts_voice_id || "FGY2WhTYpPnrIDTdsKH5");
      setEnablePasswordProtection(!!settings.settings_password);
    }
  }, [settings]);

  const handleUnlock = () => {
    if (passwordInput === settings?.settings_password) {
      setIsUnlocked(true);
      setPasswordError("");
      setPasswordInput("");
    } else {
      setPasswordError("Senha incorreta");
    }
  };

  const handleSavePasswordSettings = () => {
    if (enablePasswordProtection) {
      if (!newPassword) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Digite uma senha para ativar a proteção.",
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "As senhas não coincidem.",
        });
        return;
      }
      if (newPassword.length < 4) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "A senha deve ter pelo menos 4 caracteres.",
        });
        return;
      }
    }

    const passwordValue = enablePasswordProtection ? newPassword : null;

    if (settings?.id) {
      updateSettings.mutate(
        { id: settings.id, settings_password: passwordValue },
        {
          onSuccess: () => {
            setNewPassword("");
            setConfirmPassword("");
          },
        }
      );
    } else {
      createSettings.mutate(
        { settings_password: passwordValue },
        {
          onSuccess: () => {
            setNewPassword("");
            setConfirmPassword("");
          },
        }
      );
    }
  };

  const handleCopyWebhook = async () => {
    await navigator.clipboard.writeText(WEBHOOK_URL);
    setCopied(true);
    toast({
      title: "URL copiada!",
      description: "Cole na configuração de webhook da Evolution API.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

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
      tts_mode: ttsMode,
      tts_voice_id: ttsVoiceId,
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


  const isConnected = settings?.api_url && settings?.api_token && settings?.instance_name;
  const totalConversations = conversations?.length || 0;
  const activeConversations = conversations?.filter(c => c.is_bot_active)?.length || 0;

  if (!selectedUnit) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
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
      <div className="p-4 md:p-6 space-y-6">
        <LoadingSkeleton />
      </div>
    );
  }

  // Lock screen for password protected settings
  if (hasPasswordProtection && !isUnlocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Configurações Protegidas</CardTitle>
            <CardDescription>
              Esta página está protegida por senha. Digite a senha para acessar as configurações.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password-input">Senha</Label>
              <div className="relative">
                <Input
                  id="password-input"
                  type={showPasswordInput ? "text" : "password"}
                  placeholder="Digite a senha"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                  className={passwordError ? "border-destructive" : ""}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPasswordInput(!showPasswordInput)}
                >
                  {showPasswordInput ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
            </div>
            <Button onClick={handleUnlock} className="w-full bg-green-600 hover:bg-green-700">
              <Unlock className="h-4 w-4 mr-2" />
              Desbloquear
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-green-600 to-green-500 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
          <CardContent className="p-6 md:p-8 relative">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">WhatsApp Business</h1>
                  <p className="text-green-100 mt-1">Atendimento automatizado com IA</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className={`px-4 py-2 text-sm font-medium ${
                    isConnected 
                      ? "bg-white/20 text-white border-white/30 hover:bg-white/30" 
                      : "bg-red-500/20 text-white border-red-300/30"
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isConnected ? "bg-white animate-pulse" : "bg-red-300"}`} />
                  {isConnected ? "Conectado" : "Não conectado"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalConversations}</p>
                  <p className="text-sm text-muted-foreground">Conversas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Bot className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeConversations}</p>
                  <p className="text-sm text-muted-foreground">Bot Ativo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{botEnabled ? "ON" : "OFF"}</p>
                  <p className="text-sm text-muted-foreground">Bot Global</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{isConnected ? "OK" : "—"}</p>
                  <p className="text-sm text-muted-foreground">API Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="api" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1 bg-muted/50">
            <TabsTrigger value="api" className="flex items-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
            <TabsTrigger value="bot" className="flex items-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Bot</span>
            </TabsTrigger>
            <TabsTrigger value="conversations" className="flex items-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Conversas</span>
            </TabsTrigger>
            <TabsTrigger value="webhook" className="flex items-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Link className="h-4 w-4" />
              <span className="hidden sm:inline">Webhook</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Segurança</span>
            </TabsTrigger>
          </TabsList>

          {/* API Configuration Tab */}
          <TabsContent value="api" className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Configuração da Evolution API</CardTitle>
                    <CardDescription>
                      Configure a conexão com sua instância da Evolution API
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="api-url" className="text-sm font-medium">
                      URL da API
                    </Label>
                    <Input
                      id="api-url"
                      placeholder="https://api.evolution.com"
                      value={apiUrl}
                      onChange={(e) => setApiUrl(e.target.value)}
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      URL base da sua instância Evolution API
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instance-name" className="text-sm font-medium">
                      Nome da Instância
                    </Label>
                    <Input
                      id="instance-name"
                      placeholder="minha-instancia"
                      value={instanceName}
                      onChange={(e) => setInstanceName(e.target.value)}
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      Nome da instância configurada na Evolution API
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="api-token" className="text-sm font-medium">
                    Token de Autenticação
                  </Label>
                  <Input
                    id="api-token"
                    type="password"
                    placeholder="••••••••••••••••••••••••"
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Token de autenticação (apikey) da Evolution API
                  </p>
                </div>

                <Separator />

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleTestConnection}
                    variant="outline"
                    disabled={!apiUrl || !apiToken || !instanceName || testConnection.isPending}
                    className="h-11"
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
                    className="h-11 bg-green-600 hover:bg-green-700"
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
            <Card className="border shadow-sm bg-muted/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  Como configurar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { step: "1", text: "Instale a Evolution API em seu servidor ou use um serviço hospedado" },
                    { step: "2", text: "Crie uma instância e conecte seu WhatsApp via QR Code" },
                    { step: "3", text: "Copie a URL base, nome da instância e token de autenticação" },
                    { step: "4", text: "Cole as informações acima e teste a conexão" },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-3">
                      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
                        {item.step}
                      </span>
                      <p className="text-sm text-muted-foreground">{item.text}</p>
                    </div>
                  ))}
                </div>
                <Separator />
                <a
                  href="https://doc.evolution-api.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-4 w-4" />
                  Documentação da Evolution API
                </a>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bot Configuration Tab */}
          <TabsContent value="bot" className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Bot className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle>Configuração do Bot</CardTitle>
                    <CardDescription>
                      Configure o bot de atendimento automático
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-xl border-2 p-5 transition-colors hover:bg-muted/30">
                  <div className="space-y-1">
                    <Label htmlFor="bot-enabled" className="text-base font-medium">
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
                    className="data-[state=checked]:bg-green-600"
                  />
                </div>

                <Separator />

                <div className="space-y-3">
                  <Label htmlFor="welcome-message" className="text-sm font-medium">
                    Mensagem de Boas-vindas
                  </Label>
                  <Textarea
                    id="welcome-message"
                    placeholder="Olá! Bem-vindo ao nosso atendimento. Como posso ajudar?"
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Mensagem enviada automaticamente no primeiro contato do cliente
                  </p>
                </div>

                {/* AI Prompt Generator */}
                {selectedUnit && (
                  <AIPromptGenerator
                    unitName={selectedUnit.name}
                    unitId={selectedUnit.id}
                    externalPrompt={systemPrompt}
                    onPromptChange={setSystemPrompt}
                  />
                )}

                <Separator />

                {/* Audio Response Settings */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Volume2 className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium">Respostas em Áudio</h3>
                      <p className="text-sm text-muted-foreground">Configure quando e como o bot responde com áudio</p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Modo de Áudio</Label>
                      <Select value={ttsMode} onValueChange={setTtsMode}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">🎙️ Auto — só quando cliente envia áudio</SelectItem>
                          <SelectItem value="always">🔊 Sempre — respostas simples em áudio</SelectItem>
                          <SelectItem value="disabled">📝 Desativado — sempre texto</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {ttsMode === "auto" && "O bot responde em áudio apenas quando o cliente enviar uma mensagem de voz"}
                        {ttsMode === "always" && "O bot sempre responde com áudio (exceto cardápios e resumos)"}
                        {ttsMode === "disabled" && "O bot nunca responde com áudio, apenas texto"}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Voz do Bot</Label>
                      <div className="flex gap-2">
                        <Select value={ttsVoiceId} onValueChange={setTtsVoiceId}>
                          <SelectTrigger className="h-11 flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FGY2WhTYpPnrIDTdsKH5">👩 Laura — feminina, PT-BR (padrão)</SelectItem>
                            <SelectItem value="EXAVITQu4vr4xnSDxMaL">👩 Sarah — feminina, versátil</SelectItem>
                            <SelectItem value="Xb7hH8MSUJpSbSDYk0k2">👩 Alice — feminina, confiante</SelectItem>
                            <SelectItem value="TX3LPaxmHKxFdv7VOQHJ">👨 Liam — masculina, articulada</SelectItem>
                            <SelectItem value="onwK4e9ZLuTAKqWW03F9">👨 Daniel — masculina, profunda</SelectItem>
                            <SelectItem value="IKne3meq5aSn9XLyUdCD">👨 Charlie — masculina, casual</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 shrink-0"
                          disabled={isPreviewLoading || isPreviewPlaying}
                          onClick={handleVoicePreview}
                        >
                          {isPreviewLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isPreviewPlaying ? (
                            <Square className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Voz usada para converter as respostas em áudio via ElevenLabs. Clique ▶ para ouvir.
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleSaveBotSettings}
                  disabled={createSettings.isPending || updateSettings.isPending}
                  className="h-11 bg-green-600 hover:bg-green-700"
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
            <Card className="border shadow-sm bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Dicas para o Prompt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { title: "Seja específico", desc: "Descreva claramente o papel do bot e os limites do atendimento" },
                    { title: "Inclua contexto", desc: "Mencione o tipo de estabelecimento, horários e serviços oferecidos" },
                    { title: "Defina tom", desc: "Indique se o atendimento deve ser formal ou informal" },
                    { title: "Limite escopo", desc: "Especifique quando o bot deve transferir para atendimento humano" },
                  ].map((tip) => (
                    <div key={tip.title} className="space-y-1">
                      <p className="text-sm font-medium">{tip.title}</p>
                      <p className="text-xs text-muted-foreground">{tip.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Conversations Tab */}
          <TabsContent value="conversations" className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <Users className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <CardTitle>Conversas</CardTitle>
                      <CardDescription>
                        Gerencie as conversas ativas do WhatsApp
                      </CardDescription>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => refetchConversations()}
                    className="self-start sm:self-auto"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingConversations ? (
                  <LoadingSkeleton />
                ) : !conversations || conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="p-4 bg-muted rounded-full mb-4">
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Nenhuma conversa</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      As conversas aparecerão aqui quando clientes entrarem em contato pelo WhatsApp.
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                              <User className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {conversation.customer_name || "Cliente"}
                              </p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{conversation.phone}</span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate max-w-[300px] mt-1">
                                {conversation.last_message || "—"}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 sm:gap-6">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span className="whitespace-nowrap">
                                {conversation.last_message_at
                                  ? formatDistanceToNow(new Date(conversation.last_message_at), {
                                      addSuffix: true,
                                      locale: ptBR,
                                    })
                                  : "—"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Bot</span>
                              <Switch
                                checked={conversation.is_bot_active || false}
                                onCheckedChange={(checked) =>
                                  toggleBot.mutate({
                                    conversationId: conversation.id,
                                    isBotActive: checked,
                                  })
                                }
                                className="data-[state=checked]:bg-green-600"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhook Tab */}
          <TabsContent value="webhook" className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Link className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle>URL do Webhook</CardTitle>
                    <CardDescription>
                      Configure este webhook na Evolution API para receber mensagens
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Webhook URL</Label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 p-4 bg-muted/50 rounded-xl border-2 border-dashed font-mono text-sm break-all">
                      {WEBHOOK_URL}
                    </div>
                    <Button
                      onClick={handleCopyWebhook}
                      variant="outline"
                      className="h-auto sm:h-[60px] px-6 shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2 text-green-500" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Como configurar na Evolution API:</h4>
                  <div className="space-y-3">
                    {[
                      "Acesse o painel da Evolution API",
                      "Vá em Configurações da Instância → Webhook",
                      "Cole a URL acima no campo de Webhook",
                      'Ative os eventos "messages.upsert"',
                      "Salve as configurações",
                    ].map((step, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-sm text-muted-foreground">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Importante
                      </p>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        O webhook deve estar configurado corretamente para que as mensagens sejam 
                        recebidas e processadas pelo bot. Certifique-se de que a URL está acessível 
                        externamente.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-lg">
                    <Shield className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <CardTitle>Proteção por Senha</CardTitle>
                    <CardDescription>
                      Proteja as configurações do WhatsApp com uma senha de acesso
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-xl border-2 p-5 transition-colors hover:bg-muted/30">
                  <div className="space-y-1">
                    <Label htmlFor="enable-password" className="text-base font-medium">
                      Ativar Proteção por Senha
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Quando ativado, será necessário digitar uma senha para acessar esta página
                    </p>
                  </div>
                  <Switch
                    id="enable-password"
                    checked={enablePasswordProtection}
                    onCheckedChange={(checked) => {
                      setEnablePasswordProtection(checked);
                      if (!checked) {
                        setNewPassword("");
                        setConfirmPassword("");
                      }
                    }}
                    className="data-[state=checked]:bg-orange-600"
                  />
                </div>

                {enablePasswordProtection && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password" className="text-sm font-medium">
                          {hasPasswordProtection ? "Nova Senha" : "Senha"}
                        </Label>
                        <div className="relative">
                          <Input
                            id="new-password"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Digite a senha"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Mínimo de 4 caracteres
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-sm font-medium">
                          Confirmar Senha
                        </Label>
                        <div className="relative">
                          <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Confirme a senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <Button
                  onClick={handleSavePasswordSettings}
                  disabled={createSettings.isPending || updateSettings.isPending}
                  className="h-11 bg-orange-600 hover:bg-orange-700"
                >
                  {(createSettings.isPending || updateSettings.isPending) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar Configurações de Segurança
                </Button>
              </CardContent>
            </Card>

            {/* Security Info */}
            <Card className="border shadow-sm bg-muted/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500" />
                  Informações sobre a proteção
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { title: "Proteção por sessão", desc: "A senha é solicitada cada vez que você acessa esta página" },
                    { title: "Sem recuperação", desc: "Se esquecer a senha, você precisará acessar o banco de dados para removê-la" },
                    { title: "Compartilhamento", desc: "Compartilhe a senha apenas com pessoas autorizadas a configurar o WhatsApp" },
                    { title: "Alteração", desc: "Você pode alterar ou remover a senha a qualquer momento nesta aba" },
                  ].map((item) => (
                    <div key={item.title} className="space-y-1">
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
