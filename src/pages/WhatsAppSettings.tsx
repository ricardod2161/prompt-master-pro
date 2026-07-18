import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Mic,
  MicOff,
  BarChart3,
  Radio,
  Search,
  ExternalLink as OpenChatIcon,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useUnit } from "@/contexts/UnitContext";
import {
  useWhatsAppSettings,
  useCreateWhatsAppSettings,
  useUpdateWhatsAppSettings,
  useWhatsAppConversations,
  useToggleBotForConversation,
  useTestConnection,
  useWhatsAppTodayStats,
} from "@/hooks/useWhatsApp";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { AIPromptGenerator } from "@/components/settings/AIPromptGenerator";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  useAudioTranscriptionLogs,
  useAudioTranscriptionHistory,
  useRetryTranscription,
  computeTodayStats,
} from "@/hooks/useAudioTranscriptionLogs";
import { SubscriptionGate } from "@/components/subscription/SubscriptionGate";

// BUG FIX: use env variable instead of hardcoded project ID
const WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`;

const MAX_RETRY_COUNT = 3;

export default function WhatsAppSettings() {
  const navigate = useNavigate();
  const { selectedUnit } = useUnit();
  const { toast } = useToast();
  const { data: settings, isLoading } = useWhatsAppSettings();
  const { data: conversations, isLoading: loadingConversations, refetch: refetchConversations } = useWhatsAppConversations();
  const { data: todayStats } = useWhatsAppTodayStats(selectedUnit?.id);
  const createSettings = useCreateWhatsAppSettings();
  const updateSettings = useUpdateWhatsAppSettings();
  const toggleBot = useToggleBotForConversation();
  const testConnection = useTestConnection();

  // Audio diagnostic hooks
  const { data: audioLogs = [], isLoading: loadingAudioLogs } = useAudioTranscriptionLogs();
  const { data: audioHistory = [] } = useAudioTranscriptionHistory();
  const retryTranscription = useRetryTranscription();
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const audioTodayStats = computeTodayStats(audioLogs);

  // Conversation search filter
  const [conversationSearch, setConversationSearch] = useState("");

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
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState("");
  const [showElevenlabsKey, setShowElevenlabsKey] = useState(false);
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
          body: JSON.stringify({ voiceId: ttsVoiceId, elevenlabs_api_key: elevenlabsApiKey || undefined }),
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

  // BUG FIX: Persist unlock state in sessionStorage scoped to unit
  const getUnlockKey = useCallback(
    () => `whatsapp-unlocked-${selectedUnit?.id ?? ""}`,
    [selectedUnit?.id]
  );

  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(`whatsapp-unlocked-${selectedUnit?.id ?? ""}`) === "true";
  });

  const handleSetUnlocked = (val: boolean) => {
    setIsUnlocked(val);
    if (val) {
      sessionStorage.setItem(getUnlockKey(), "true");
    } else {
      sessionStorage.removeItem(getUnlockKey());
    }
  };

  // Re-check sessionStorage when unit changes
  useEffect(() => {
    const stored = sessionStorage.getItem(getUnlockKey()) === "true";
    setIsUnlocked(stored);
  }, [getUnlockKey]);

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
      setElevenlabsApiKey((settings as any).elevenlabs_api_key || "");
      setEnablePasswordProtection(!!settings.settings_password);
    }
  }, [settings]);

  const handleUnlock = () => {
    if (passwordInput === settings?.settings_password) {
      handleSetUnlocked(true);
      setPasswordError("");
      setPasswordInput("");
    } else {
      setPasswordError("Senha incorreta");
    }
  };

  const handleSavePasswordSettings = () => {
    if (enablePasswordProtection) {
      if (!newPassword) {
        toast({ variant: "destructive", title: "Erro", description: "Digite uma senha para ativar a proteção." });
        return;
      }
      if (newPassword !== confirmPassword) {
        toast({ variant: "destructive", title: "Erro", description: "As senhas não coincidem." });
        return;
      }
      if (newPassword.length < 4) {
        toast({ variant: "destructive", title: "Erro", description: "A senha deve ter pelo menos 4 caracteres." });
        return;
      }
    }

    const passwordValue = enablePasswordProtection ? newPassword : null;

    if (settings?.id) {
      updateSettings.mutate(
        { id: settings.id, settings_password: passwordValue },
        { onSuccess: () => { setNewPassword(""); setConfirmPassword(""); } }
      );
    } else {
      createSettings.mutate(
        { settings_password: passwordValue },
        { onSuccess: () => { setNewPassword(""); setConfirmPassword(""); } }
      );
    }
  };

  const handleCopyWebhook = async () => {
    await navigator.clipboard.writeText(WEBHOOK_URL);
    setCopied(true);
    toast({ title: "URL copiada!", description: "Cole na configuração de webhook da Evolution API." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveApiSettings = () => {
    const data = { api_url: apiUrl, api_token: apiToken, instance_name: instanceName };
    if (settings?.id) {
      updateSettings.mutate({ id: settings.id, ...data });
    } else {
      createSettings.mutate(data);
    }
  };

  const handleSaveBotSettings = () => {
    const data: any = {
      bot_enabled: botEnabled,
      welcome_message: welcomeMessage,
      system_prompt: systemPrompt,
      tts_mode: ttsMode,
      tts_voice_id: ttsVoiceId,
      elevenlabs_api_key: elevenlabsApiKey || null,
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

  // Filtered conversations for search
  const filteredConversations = conversations?.filter((c) => {
    if (!conversationSearch.trim()) return true;
    const q = conversationSearch.toLowerCase();
    return (
      c.phone.includes(conversationSearch) ||
      c.customer_name?.toLowerCase().includes(q) ||
      c.last_message?.toLowerCase().includes(q)
    );
  }) ?? [];

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
    <SubscriptionGate requiredTier="pro">
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

        {/* Stats Cards — improved with real today data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <MessageCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{todayStats?.messagesToday ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Msgs Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{todayStats?.conversationsToday ?? 0}</p>
                  <p className="text-sm text-muted-foreground">Conversas Hoje</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                  <Bot className="h-5 w-5 text-purple-600 dark:text-purple-400" />
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
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                  <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{botEnabled ? "ON" : "OFF"}</p>
                  <p className="text-sm text-muted-foreground">Bot Global</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="api" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto p-1 bg-muted/50">
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
            {/* BUG FIX: renamed tab value from "audio-diag" to "diagnostico" for semantic consistency */}
            <TabsTrigger value="diagnostico" className="flex items-center gap-2 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Radio className="h-4 w-4" />
              <span className="hidden sm:inline">Diagnóstico</span>
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
                        {/* BUG FIX: removed isPreviewPlaying from disabled so user can stop playback */}
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 shrink-0"
                          disabled={isPreviewLoading}
                          onClick={handleVoicePreview}
                          title={isPreviewPlaying ? "Parar preview" : "Ouvir amostra"}
                        >
                          {isPreviewLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : isPreviewPlaying ? (
                            <Square className="h-4 w-4 text-destructive" />
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

                  {/* ElevenLabs API Key */}
                  <div className="rounded-xl border p-4 space-y-3 bg-muted/20">
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">API Key do ElevenLabs</Label>
                      <p className="text-xs text-muted-foreground">
                        Para usar respostas em áudio, você precisa de uma conta na ElevenLabs com cartão de crédito vinculado.
                      </p>
                    </div>
                    <div className="relative">
                      <Input
                        type={showElevenlabsKey ? "text" : "password"}
                        placeholder="sk_..."
                        value={elevenlabsApiKey}
                        onChange={(e) => setElevenlabsApiKey(e.target.value)}
                        className="h-11 pr-10"
                        disabled={ttsMode === "disabled"}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowElevenlabsKey(!showElevenlabsKey)}
                      >
                        {showElevenlabsKey ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href="https://elevenlabs.io/app/sign-up"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Criar conta na ElevenLabs
                      </a>
                      <a
                        href="https://elevenlabs.io/app/settings/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Gerenciar API Keys
                      </a>
                    </div>
                    {!elevenlabsApiKey && ttsMode !== "disabled" && (
                      <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>Sem API key configurada, o áudio não funcionará. Configure sua chave acima.</span>
                      </div>
                    )}
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
            <ConversationsTab
              conversations={conversations}
              filteredConversations={filteredConversations}
              loading={loadingConversations}
              search={conversationSearch}
              onSearchChange={setConversationSearch}
              onRefetch={() => refetchConversations()}
              onToggleBot={(conversationId, isBotActive) =>
                toggleBot.mutate({ conversationId, isBotActive })
              }
            />
          </TabsContent>

          {/* Webhook Tab */}
          <TabsContent value="webhook" className="space-y-6">
            <WebhookTab webhookUrl={WEBHOOK_URL} copied={copied} onCopy={handleCopyWebhook} />
          </TabsContent>

          {/* Audio Diagnostic Tab */}
          <TabsContent value="diagnostico" className="space-y-6">
            <DiagnosticoTab
              audioLogs={audioLogs}
              audioHistory={audioHistory}
              todayStats={audioTodayStats}
              loadingAudioLogs={loadingAudioLogs}
              retryingId={retryingId}
              isRetryPending={retryTranscription.isPending}
              maxRetryCount={MAX_RETRY_COUNT}
              onRetry={async (logId) => {
                setRetryingId(logId);
                try {
                  await retryTranscription.mutateAsync(logId);
                } finally {
                  setRetryingId(null);
                }
              }}
            />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <SecurityTab
              enablePasswordProtection={enablePasswordProtection}
              onEnableChange={(checked) => {
                setEnablePasswordProtection(checked);
                if (!checked) {
                  setNewPassword("");
                  setConfirmPassword("");
                }
              }}
              hasPasswordProtection={hasPasswordProtection}
              newPassword={newPassword}
              onNewPasswordChange={setNewPassword}
              showNewPassword={showNewPassword}
              onToggleShowNewPassword={() => setShowNewPassword(!showNewPassword)}
              confirmPassword={confirmPassword}
              onConfirmPasswordChange={setConfirmPassword}
              showConfirmPassword={showConfirmPassword}
              onToggleShowConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
              onSave={handleSavePasswordSettings}
              saving={createSettings.isPending || updateSettings.isPending}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </SubscriptionGate>
  );
}
