import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bot, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageStatus } from "./MessageStatus";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Conversation {
  id: string;
  phone: string;
  customer_name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  is_bot_active: boolean | null;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onRefresh,
  isLoading,
  className,
}: ConversationListProps) {
  const [search, setSearch] = useState("");

  const filteredConversations = conversations.filter((c) => {
    const searchLower = search.toLowerCase();
    return (
      c.phone.includes(search) ||
      c.customer_name?.toLowerCase().includes(searchLower) ||
      c.last_message?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Conversas</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 w-8"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversa..."
            className="pl-9 h-9 bg-muted/50 border-0"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {search ? "Nenhuma conversa encontrada" : "Nenhuma conversa ainda"}
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const displayName = conversation.customer_name || conversation.phone;
              const initials = conversation.customer_name
                ? conversation.customer_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)
                : conversation.phone.slice(-2);

              const timeAgo = conversation.last_message_at
                ? formatDistanceToNow(new Date(conversation.last_message_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })
                : null;

              const isSelected = conversation.id === selectedId;

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelect(conversation.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors",
                    isSelected
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/50"
                  )}
                >
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarFallback
                      className={cn(
                        "font-medium",
                        isSelected
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-medium truncate">{displayName}</span>
                        {conversation.is_bot_active && (
                          <Badge
                            variant="secondary"
                            className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1 py-0 h-4"
                          >
                            <Bot className="h-2.5 w-2.5" />
                          </Badge>
                        )}
                      </div>
                      {timeAgo && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {timeAgo}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 mt-0.5">
                      <MessageStatus status="read" className="h-3 w-3 shrink-0" />
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message || "Nenhuma mensagem"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
