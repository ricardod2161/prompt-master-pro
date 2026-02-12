import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { DAYS_OF_WEEK, PAYMENT_METHODS, type PromptFormData } from "./types";

interface OperationalSectionProps {
  data: PromptFormData;
  onChange: (updates: Partial<PromptFormData>) => void;
}

export function OperationalSection({ data, onChange }: OperationalSectionProps) {
  const toggleDay = (day: string) => {
    const days = data.operatingDays.includes(day)
      ? data.operatingDays.filter((d) => d !== day)
      : [...data.operatingDays, day];
    onChange({ operatingDays: days });
  };

  const togglePayment = (method: string) => {
    const methods = data.paymentMethods.includes(method)
      ? data.paymentMethods.filter((m) => m !== method)
      : [...data.paymentMethods, method];
    onChange({ paymentMethods: methods });
  };

  return (
    <div className="space-y-5">
      {/* Dias de funcionamento */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Dias de Funcionamento</Label>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <Badge
              key={day.value}
              variant={data.operatingDays.includes(day.value) ? "default" : "outline"}
              className="cursor-pointer select-none px-3 py-1.5 text-sm transition-colors"
              onClick={() => toggleDay(day.value)}
            >
              {day.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Horário */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Abre às</Label>
          <Input
            type="time"
            value={data.operatingHours.open}
            onChange={(e) =>
              onChange({ operatingHours: { ...data.operatingHours, open: e.target.value } })
            }
            className="h-11"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Fecha às</Label>
          <Input
            type="time"
            value={data.operatingHours.close}
            onChange={(e) =>
              onChange({ operatingHours: { ...data.operatingHours, close: e.target.value } })
            }
            className="h-11"
          />
        </div>
      </div>

      {/* Formas de pagamento */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Formas de Pagamento</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PAYMENT_METHODS.map((pm) => (
            <label
              key={pm.value}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <Checkbox
                checked={data.paymentMethods.includes(pm.value)}
                onCheckedChange={() => togglePayment(pm.value)}
              />
              {pm.label}
            </label>
          ))}
        </div>
      </div>

      {/* Chave Pix condicional */}
      {data.paymentMethods.includes("pix") && (
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Chave Pix</Label>
          <Input
            placeholder="CPF, CNPJ, e-mail ou telefone"
            value={data.pixKey}
            onChange={(e) => onChange({ pixKey: e.target.value })}
            className="h-11"
          />
        </div>
      )}

      {/* Delivery e Retirada */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Oferece Delivery?</Label>
            <Switch
              checked={data.hasDelivery}
              onCheckedChange={(v) => onChange({ hasDelivery: v })}
            />
          </div>
          {data.hasDelivery && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Taxa de entrega (R$)</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                placeholder="0 = grátis"
                value={data.deliveryFee}
                onChange={(e) => onChange({ deliveryFee: e.target.value })}
                className="h-10"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Retirada no Local?</Label>
          <Switch
            checked={data.hasPickup}
            onCheckedChange={(v) => onChange({ hasPickup: v })}
          />
        </div>
      </div>

      {/* Tempo de preparo */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Tempo Médio de Preparo</Label>
        <Input
          placeholder="Ex: 30-45 min"
          value={data.avgPrepTime}
          onChange={(e) => onChange({ avgPrepTime: e.target.value })}
          className="h-11"
        />
      </div>
    </div>
  );
}
