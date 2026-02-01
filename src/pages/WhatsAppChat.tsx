import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MessageSquare, Settings, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUnit } from "@/contexts/UnitContext";
import { useWhatsAppConversationsRealtime, useWhatsAppChat } from "@/hooks/useWhatsAppChat";
import { useToggleBotForConversation, useWhatsAppSettings } from "@/hooks/useWhatsApp";
import { ConversationList } from "@/components/whatsapp/ConversationList";
import { ChatView } from "@/components/whatsapp/ChatView";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { cn } from "@/lib/utils";

export default function WhatsAppChat() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedUnit } = useUnit();
  
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    searchParams.get("conversation")
  );
  const [isMobileListVisible, setIsMobileListVisible] = useState(!selectedConversationId);

  const { data: settings, isLoading: loadingSettings } = useWhatsAppSettings();
  const { 
    data: conversations, 
    isLoading: loadingConversations,
    refetch: refetchConversations 
  } = useWhatsAppConversationsRealtime();
  
  const toggleBot = useToggleBotForConversation();

  // Get selected conversation data
  const selectedConversation = conversations?.find(c => c.id === selectedConversationId);

  // Use chat hook for messages
  const {
    messages,
    isLoading: loadingMessages,
    isTyping,
    isRecording,
    sendMessage,
    isSending,
  } = useWhatsAppChat(selectedConversationId);

  // Update URL when conversation changes
  useEffect(() => {
    if (selectedConversationId) {
      setSearchParams({ conversation: selectedConversationId });
    } else {
      setSearchParams({});
    }
  }, [selectedConversationId, setSearchParams]);

  // Handle conversation selection
  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    setIsMobileListVisible(false);
  };

  // Handle back button on mobile
  const handleBack = () => {
    setIsMobileListVisible(true);
    setSelectedConversationId(null);
  };

  // Handle bot toggle
  const handleToggleBot = (active: boolean) => {
    if (!selectedConversationId) return;
    toggleBot.mutate({
      conversationId: selectedConversationId,
      isBotActive: active,
    });
  };

  // Check if WhatsApp is configured
  const isConfigured = settings?.api_url && settings?.api_token && settings?.instance_name;

  if (!selectedUnit) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <EmptyState
          icon={MessageSquare}
          title="Selecione uma unidade"
          description="Selecione uma unidade para acessar o chat do WhatsApp."
        />
      </div>
    );
  }

  if (loadingSettings || loadingConversations) {
    return (
      <div className="p-4 md:p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4">
        <Card className="max-w-md p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center">
            <MessageSquare className="h-8 w-8 text-orange-500" />
          </div>
          <h2 className="text-xl font-semibold">WhatsApp não configurado</h2>
          <p className="text-muted-foreground">
            Configure a Evolution API para começar a receber mensagens do WhatsApp.
          </p>
          <Button onClick={() => navigate("/whatsapp/settings")} className="mt-4">
            <Settings className="h-4 w-4 mr-2" />
            Configurar WhatsApp
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <MessageSquare className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <h1 className="font-semibold">WhatsApp Chat</h1>
            <p className="text-xs text-muted-foreground">
              {conversations?.length || 0} conversas
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/whatsapp/settings")}
        >
          <Settings className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Configurações</span>
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List - Desktop always visible, Mobile toggleable */}
        <div
          className={cn(
            "w-full md:w-80 lg:w-96 border-r bg-card/30 flex-shrink-0",
            "md:block",
            isMobileListVisible ? "block" : "hidden"
          )}
        >
          <ConversationList
            conversations={conversations || []}
            selectedId={selectedConversationId}
            onSelect={handleSelectConversation}
            onRefresh={() => refetchConversations()}
            isLoading={loadingConversations}
          />
        </div>

        {/* Chat View - Desktop always visible, Mobile toggleable */}
        <div
          className={cn(
            "flex-1 min-w-0",
            "md:block",
            isMobileListVisible ? "hidden" : "block"
          )}
        >
          <ChatView
            conversationId={selectedConversationId}
            customerName={selectedConversation?.customer_name || null}
            phone={selectedConversation?.phone || ""}
            messages={messages}
            isBotActive={selectedConversation?.is_bot_active ?? true}
            isTyping={isTyping}
            isRecording={isRecording}
            onBack={handleBack}
            onToggleBot={handleToggleBot}
            onSendMessage={sendMessage}
            isLoading={loadingMessages || isSending}
          />
        </div>
      </div>
    </div>
  );
}
