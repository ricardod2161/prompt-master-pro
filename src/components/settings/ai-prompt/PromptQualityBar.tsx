import { useMemo } from "react";
import { Progress } from "@/components/ui/progress";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptQualityBarProps {
  prompt: string;
}

const QUALITY_CHECKS = [
  { id: "greeting", label: "Saudação / Boas-vindas", regex: /boas[- ]?vindas|saudaç|bem[- ]?vindo|olá|oi/i },
  { id: "flow", label: "Fluxo de atendimento", regex: /etapa|passo|fluxo|roteiro|1\.|2\.|3\./i },
  { id: "payment", label: "Formas de pagamento", regex: /pagamento|pix|cart[aã]o|dinheiro|cr[eé]dito|d[eé]bito/i },
  { id: "formatting", label: "Regras de formatação", regex: /negrito|\*.*\*|formata[çc][aã]o|emoji|whatsapp/i },
  { id: "limits", label: "Limites e proibições", regex: /nunca|proibi|n[aã]o (deve|pode|invente)|limite|veda/i },
  { id: "escalation", label: "Escalação humana", regex: /humano|atendente|transfer|escala[çc][aã]o|equipe/i },
  { id: "tools", label: "Tool calling / funções", regex: /func_|tool|fun[çc][oõ]es|ferramenta|card[aá]pio.*sistema/i },
];

export function PromptQualityBar({ prompt }: PromptQualityBarProps) {
  const results = useMemo(() => {
    if (!prompt.trim()) return [];
    return QUALITY_CHECKS.map((check) => ({
      ...check,
      passed: check.regex.test(prompt),
    }));
  }, [prompt]);

  if (!prompt.trim()) return null;

  const score = results.filter((r) => r.passed).length;
  const percentage = Math.round((score / QUALITY_CHECKS.length) * 100);

  const color = percentage >= 80 ? "text-green-500" : percentage >= 50 ? "text-yellow-500" : "text-red-500";
  const barColor = percentage >= 80 ? "bg-green-500" : percentage >= 50 ? "bg-yellow-500" : "bg-red-500";
  const label = percentage >= 80 ? "Excelente" : percentage >= 50 ? "Bom" : "Incompleto";

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Qualidade do Prompt</span>
        <span className={cn("text-sm font-bold", color)}>
          {score}/{QUALITY_CHECKS.length} — {label}
        </span>
      </div>
      <Progress value={percentage} className="h-2 [&>div]:transition-all [&>div]:duration-500" style={{ ["--progress-color" as string]: barColor }}>
        <div className={cn("h-full rounded-full", barColor)} style={{ width: `${percentage}%` }} />
      </Progress>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {results.map((r) => (
          <div key={r.id} className="flex items-center gap-2 text-xs">
            {r.passed ? (
              <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 text-red-400 shrink-0" />
            )}
            <span className={r.passed ? "text-foreground" : "text-muted-foreground"}>{r.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
