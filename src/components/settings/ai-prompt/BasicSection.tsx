import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BUSINESS_TYPES, type PromptFormData } from "./types";

interface BasicSectionProps {
  data: PromptFormData;
  onChange: (updates: Partial<PromptFormData>) => void;
}

export function BasicSection({ data, onChange }: BasicSectionProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="restaurant-name" className="text-sm font-medium">
            Nome do Restaurante *
          </Label>
          <Input
            id="restaurant-name"
            placeholder="Ex: Pizzaria do João"
            value={data.restaurantName}
            onChange={(e) => onChange({ restaurantName: e.target.value })}
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Tipo de Negócio *</Label>
          <Select value={data.businessType} onValueChange={(v) => onChange({ businessType: v })}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {BUSINESS_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="business-desc" className="text-sm font-medium">
          Descrição do Negócio *
        </Label>
        <Textarea
          id="business-desc"
          placeholder="Descreva seu negócio em detalhes: especialidades, diferenciais, público-alvo, história..."
          value={data.businessDescription}
          onChange={(e) => onChange({ businessDescription: e.target.value })}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Quanto mais detalhes, melhor o prompt gerado pela IA.
        </p>
      </div>
    </div>
  );
}
