import { useState, useRef, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Trash2, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface BotSimulatorProps {
  prompt: string;
  disabled?: boolean;
}

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/test-bot-chat`;

export function BotSimulator({ prompt, disabled }: BotSimulatorProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming || messages.length >= 20) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    let assistantText = "";
    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages, systemPrompt: prompt }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || `Erro ${resp.status}`);

      assistantText = data.text || "";
      if (assistantText) {
        setMessages((prev) => [...prev, { role: "assistant", content: assistantText }]);
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erro no simulador", description: e.message });
      if (!assistantText) {
        setMessages((prev) => prev.slice(0, -1));
      }
    } finally {
      setIsStreaming(false);
    }
  }, [input, messages, isStreaming, prompt, toast]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" disabled={disabled} className="h-11 gap-2">
          <MessageSquare className="h-4 w-4" />
          Simular Conversa
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base">Simulador de Conversa</SheetTitle>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMessages([])}
                className="h-7 text-xs gap-1 text-muted-foreground"
              >
                <Trash2 className="h-3 w-3" />
                Limpar
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Teste como o bot vai responder usando o prompt atual. Máx. 10 mensagens.
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4" ref={scrollRef as any}>
          <div className="py-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Envie uma mensagem como se fosse um cliente para testar o bot.
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-green-600 text-white rounded-br-md"
                      : "bg-muted rounded-bl-md"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-3.5 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite uma mensagem..."
              disabled={isStreaming || messages.length >= 20}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isStreaming || messages.length >= 20}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
