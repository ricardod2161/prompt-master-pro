import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bot, User, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageStatus } from "./MessageStatus";
import { AudioPlayer } from "./AudioPlayer";
import { ImagePreview } from "./ImagePreview";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
  status?: "sent" | "delivered" | "read";
  media_type?: "text" | "audio" | "image" | "document" | "video";
  media_url?: string;
  media_duration?: number;
  media_caption?: string;
  transcription?: string;
}

interface ChatBubbleProps {
  message: ChatMessage;
  showAvatar?: boolean;
}

export function ChatBubble({ message, showAvatar = true }: ChatBubbleProps) {
  const isAssistant = message.role === "assistant";
  const timestamp = format(new Date(message.created_at), "HH:mm", { locale: ptBR });
  const mediaType = message.media_type || "text";

  const renderContent = () => {
    switch (mediaType) {
      case "audio":
        return (
          <div className="min-w-[200px]">
            <AudioPlayer
              src={message.media_url || ""}
              duration={message.media_duration}
              transcription={message.transcription}
            />
          </div>
        );
      case "image":
        return (
          <ImagePreview
            src={message.media_url || ""}
            caption={message.media_caption || message.content}
          />
        );
      case "document":
        return (
          <a
            href={message.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {message.media_caption || "Documento"}
              </p>
              <p className="text-xs text-muted-foreground">
                Clique para baixar
              </p>
            </div>
          </a>
        );
      default:
        return (
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        );
    }
  };

  return (
    <div
      className={cn(
        "flex gap-2 max-w-[85%] md:max-w-[70%]",
        isAssistant ? "self-start" : "self-end flex-row-reverse"
      )}
    >
      {showAvatar && (
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            isAssistant
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isAssistant ? (
            <Bot className="h-4 w-4" />
          ) : (
            <User className="h-4 w-4" />
          )}
        </div>
      )}

      <div
        className={cn(
          "relative rounded-2xl px-4 py-2.5 shadow-sm",
          isAssistant
            ? "bg-muted rounded-tl-md"
            : "bg-primary text-primary-foreground rounded-tr-md"
        )}
      >
        {renderContent()}

        {/* Footer with timestamp and status */}
        <div
          className={cn(
            "flex items-center gap-1.5 mt-1",
            isAssistant ? "justify-start" : "justify-end"
          )}
        >
          <span
            className={cn(
              "text-[10px]",
              isAssistant ? "text-muted-foreground" : "text-primary-foreground/70"
            )}
          >
            {timestamp}
          </span>

          {/* Status icon only for assistant messages */}
          {isAssistant && message.status && (
            <MessageStatus status={message.status} />
          )}

          {/* Bot indicator */}
          {isAssistant && (
            <span
              className="text-[10px] ml-1 text-muted-foreground"
              title="Resposta do Bot"
            >
              🤖
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
