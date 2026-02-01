import { ArrowLeft, Bot, Phone, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  customerName: string | null;
  phone: string;
  isBotActive: boolean;
  isTyping?: boolean;
  isRecording?: boolean;
  onBack?: () => void;
  onToggleBot: (active: boolean) => void;
  className?: string;
}

export function ChatHeader({
  customerName,
  phone,
  isBotActive,
  isTyping,
  isRecording,
  onBack,
  onToggleBot,
  className,
}: ChatHeaderProps) {
  const displayName = customerName || phone;
  const initials = customerName
    ? customerName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : phone.slice(-2);

  const getStatusText = () => {
    if (isRecording) return "gravando áudio...";
    if (isTyping) return "digitando...";
    return isBotActive ? "Bot ativo" : "Bot desativado";
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 border-b bg-card/50 backdrop-blur-sm",
        className
      )}
    >
      {onBack && (
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden -ml-2"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}

      <Avatar className="h-10 w-10 border-2 border-primary/20">
        <AvatarFallback className="bg-primary/10 text-primary font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-base truncate">{displayName}</h2>
          {isBotActive && (
            <Badge
              variant="secondary"
              className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px] px-1.5 py-0"
            >
              <Bot className="h-2.5 w-2.5 mr-0.5" />
              Bot
            </Badge>
          )}
        </div>
        <p
          className={cn(
            "text-xs",
            isTyping || isRecording
              ? "text-green-600 animate-pulse"
              : "text-muted-foreground"
          )}
        >
          {getStatusText()}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Bot Toggle */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50">
          <Bot className="h-4 w-4 text-muted-foreground" />
          <Switch
            checked={isBotActive}
            onCheckedChange={onToggleBot}
            className="data-[state=checked]:bg-green-500"
          />
        </div>

        {/* Phone Link */}
        <a href={`tel:${phone}`}>
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Phone className="h-4 w-4" />
          </Button>
        </a>

        {/* Mobile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="sm:hidden">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onToggleBot(!isBotActive)}>
              <Bot className="h-4 w-4 mr-2" />
              {isBotActive ? "Desativar Bot" : "Ativar Bot"}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={`tel:${phone}`}>
                <Phone className="h-4 w-4 mr-2" />
                Ligar
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
