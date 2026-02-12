import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { PromptFormData } from "./types";

interface SpecialRulesSectionProps {
  data: PromptFormData;
  onChange: (updates: Partial<PromptFormData>) => void;
}

export function SpecialRulesSection({ data, onChange }: SpecialRulesSectionProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">Regras e Observações Especiais</Label>
      <Textarea
        placeholder={`Ex:\n• Não aceitamos pedidos após 22h\n• Entrega grátis acima de R$50\n• Promoção de terça: 2 por 1 em pizzas salgadas\n• Não temos opção vegana`}
        value={data.specialRules}
        onChange={(e) => onChange({ specialRules: e.target.value })}
        rows={5}
        className="resize-none"
      />
      <p className="text-xs text-muted-foreground">
        Adicione qualquer regra específica do seu negócio que o bot deve seguir.
      </p>
    </div>
  );
}
