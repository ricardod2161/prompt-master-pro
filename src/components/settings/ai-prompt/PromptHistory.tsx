import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { History, RotateCcw, Loader2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PromptHistoryProps {
  unitId: string;
  onRestore: (promptText: string) => void;
}

export function PromptHistory({ unitId, onRestore }: PromptHistoryProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data: history, isLoading, refetch } = useQuery({
    queryKey: ["prompt-history", unitId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prompt_history")
        .select("*")
        .eq("unit_id", unitId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: open && !!unitId,
  });

  const handleRestore = (text: string) => {
    onRestore(text);
    setOpen(false);
    toast({ title: "Prompt restaurado!", description: "O prompt foi carregado no editor." });
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("prompt_history").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Erro ao excluir", description: error.message });
    } else {
      refetch();
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <History className="h-3.5 w-3.5" />
          Histórico
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Histórico de Prompts</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-4 pr-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !history?.length ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum prompt salvo ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.prompt_text.length} chars
                    </span>
                  </div>
                  <p className="text-sm line-clamp-3 text-muted-foreground">
                    {item.prompt_text}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestore(item.prompt_text)}
                      className="gap-1 h-7 text-xs"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restaurar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                      className="gap-1 h-7 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
