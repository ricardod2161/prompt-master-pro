import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Eye, EyeOff, Cpu } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PromptPreviewCardProps {
  prompt: string;
  customPrompt: string;
  onCustomPromptChange: (value: string) => void;
}

export function PromptPreviewCard({ prompt, customPrompt, onCustomPromptChange }: PromptPreviewCardProps) {
  const [expanded, setExpanded] = useState(false);
  const displayPrompt = customPrompt || prompt;

  const handleCopy = () => {
    navigator.clipboard.writeText(displayPrompt);
    toast.success("Prompt copiado!");
  };

  return (
    <Card className="border-dashed border-primary/30 bg-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            Prompt da IA
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[10px]">Gemini 3 Pro</Badge>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
              {expanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {expanded ? (
          <Textarea
            value={customPrompt || prompt}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            rows={8}
            className="text-xs font-mono bg-background/50"
            placeholder="Edite o prompt aqui..."
          />
        ) : (
          <p className="text-xs text-muted-foreground line-clamp-3 font-mono">
            {displayPrompt}
          </p>
        )}
        {customPrompt && (
          <Button variant="link" size="sm" className="text-xs p-0 h-auto mt-1" onClick={() => onCustomPromptChange("")}>
            Restaurar prompt original
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
