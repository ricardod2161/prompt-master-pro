import { useRef, useEffect } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatBubble, ChatMessage } from "./ChatBubble";
import { ChatHeader } from "./ChatHeader";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

interface ChatViewProps {
  conversationId: string | null;
  customerName: string | null;
  phone: string;
  messages: ChatMessage[];
  isBotActive: boolean;
  isTyping?: boolean;
  isRecording?: boolean;
  onBack?: () => void;
  onToggleBot: (active: boolean) => void;
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function ChatView({
  conversationId,
  customerName,
  phone,
  messages,
  isBotActive,
  isTyping,
  isRecording,
  onBack,
  onToggleBot,
  onSendMessage,
  isLoading,
  className,
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  if (!conversationId) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <EmptyState
          icon={MessageSquare}
          title="Selecione uma conversa"
          description="Escolha uma conversa na lista para visualizar as mensagens"
        />
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
  let currentGroup: { date: string; messages: ChatMessage[] } | null = null;

  messages.forEach((message) => {
    const messageDate = parseISO(message.created_at);
    let dateLabel: string;

    if (isToday(messageDate)) {
      dateLabel = "Hoje";
    } else if (isYesterday(messageDate)) {
      dateLabel = "Ontem";
    } else {
      dateLabel = format(messageDate, "dd 'de' MMMM", { locale: ptBR });
    }

    if (!currentGroup || currentGroup.date !== dateLabel) {
      currentGroup = { date: dateLabel, messages: [] };
      groupedMessages.push(currentGroup);
    }

    currentGroup.messages.push(message);
  });

  return (
    <div className={cn("flex flex-col h-full bg-background", className)}>
      <ChatHeader
        customerName={customerName}
        phone={phone}
        isBotActive={isBotActive}
        isTyping={isTyping}
        isRecording={isRecording}
        onBack={onBack}
        onToggleBot={onToggleBot}
      />

      {/* Messages Area with Chat Pattern Background */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        
        <ScrollArea className="h-full" ref={scrollRef as any}>
          <div className="p-4 space-y-4 min-h-full flex flex-col">
            {groupedMessages.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                {/* Date Divider */}
                <div className="flex items-center justify-center py-2">
                  <span className="text-xs text-muted-foreground bg-muted/80 px-3 py-1 rounded-full">
                    {group.date}
                  </span>
                </div>

                {/* Messages */}
                <div className="flex flex-col gap-2">
                  {group.messages.map((message, messageIndex) => (
                    <ChatBubble
                      key={message.id}
                      message={message}
                      showAvatar={
                        messageIndex === 0 ||
                        group.messages[messageIndex - 1]?.role !== message.role
                      }
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {(isTyping || isRecording) && (
              <div className="self-start">
                <TypingIndicator isRecording={isRecording} />
              </div>
            )}

            {/* Empty State */}
            {messages.length === 0 && !isLoading && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhuma mensagem ainda</p>
                  <p className="text-xs mt-1">As mensagens aparecerão aqui</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <ChatInput
        onSend={onSendMessage}
        disabled={isLoading}
        placeholder={isBotActive ? "Bot ativo - resposta automática" : "Digite uma mensagem..."}
      />
    </div>
  );
}
