import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Clock,
  ExternalLink as OpenChatIcon,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  User,
  Users,
} from "lucide-react";

interface Conversation {
  id: string;
  phone: string;
  customer_name?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  is_bot_active?: boolean | null;
}

interface ConversationsTabProps {
  conversations: Conversation[] | undefined;
  filteredConversations: Conversation[];
  loading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  onRefetch: () => void;
  onToggleBot: (conversationId: string, isBotActive: boolean) => void;
}

export function ConversationsTab({
  conversations,
  filteredConversations,
  loading,
  search,
  onSearchChange,
  onRefetch,
  onToggleBot,
}: ConversationsTabProps) {
  const navigate = useNavigate();

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Users className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <CardTitle>Conversas</CardTitle>
              <CardDescription>Gerencie as conversas ativas do WhatsApp</CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefetch}
            className="self-start sm:self-auto"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {conversations && conversations.length > 0 && (
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou telefone..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 h-9 bg-muted/40 border-0"
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
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
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Search className="h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">Nenhuma conversa encontrada para "{search}"</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredConversations.map((conversation) => {
                const isWaitingReply = conversation.is_bot_active === false;

                return (
                  <div
                    key={conversation.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <User className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${
                            isWaitingReply ? "bg-orange-500" : "bg-green-500"
                          }`}
                          title={isWaitingReply ? "Atendimento humano ativo" : "Bot ativo"}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">
                          {conversation.customer_name || "Cliente"}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          <span>{conversation.phone}</span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate max-w-[260px] mt-0.5">
                          {conversation.last_message || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 shrink-0" />
                        <span className="whitespace-nowrap text-xs">
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
                          onCheckedChange={(checked) => onToggleBot(conversation.id, checked)}
                          className="data-[state=checked]:bg-green-600"
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5 shrink-0"
                        onClick={() => navigate(`/whatsapp?conversation=${conversation.id}`)}
                      >
                        <OpenChatIcon className="h-3.5 w-3.5" />
                        Abrir Chat
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
