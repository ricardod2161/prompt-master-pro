import { DollarSign, CreditCard, Banknote, Wallet, Receipt, Truck, ShoppingBag, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingCard } from "./SettingCard";
import { cn } from "@/lib/utils";

interface PaymentMethods {
  cash: boolean;
  credit: boolean;
  debit: boolean;
  pix: boolean;
  voucher: boolean;
}

interface FinancialSettings {
  service_fee_percentage: number;
  delivery_fee: number;
  min_delivery_order: number;
  payment_methods: PaymentMethods;
}

interface FinancialTabProps {
  settings: FinancialSettings;
  onSettingsChange: (settings: FinancialSettings) => void;
  onSave: () => void;
  isSaving: boolean;
}

const PAYMENT_METHODS = [
  { key: "cash" as const, label: "Dinheiro", icon: Banknote },
  { key: "credit" as const, label: "Crédito", icon: CreditCard },
  { key: "debit" as const, label: "Débito", icon: CreditCard },
  { key: "pix" as const, label: "PIX", icon: Wallet },
  { key: "voucher" as const, label: "Voucher", icon: Receipt },
];

export function FinancialTab({ settings, onSettingsChange, onSave, isSaving }: FinancialTabProps) {
  const handlePaymentMethodChange = (key: keyof PaymentMethods, checked: boolean) => {
    onSettingsChange({
      ...settings,
      payment_methods: { ...settings.payment_methods, [key]: checked },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Fees */}
      <SettingCard
        icon={DollarSign}
        title="Taxas"
        description="Configure taxas de serviço e entrega"
        variant="glass"
      >
        <div className="grid gap-5 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="service-fee" className="flex items-center gap-2 text-sm font-medium">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              Taxa de Serviço (%)
            </Label>
            <div className="relative">
              <Input
                id="service-fee"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={settings.service_fee_percentage}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    service_fee_percentage: parseFloat(e.target.value) || 0,
                  })
                }
                className="h-11 pr-8 bg-background/50 border-border/50 focus:border-primary/50"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="delivery-fee" className="flex items-center gap-2 text-sm font-medium">
              <Truck className="h-4 w-4 text-muted-foreground" />
              Taxa de Entrega (R$)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                id="delivery-fee"
                type="number"
                min={0}
                step={0.5}
                value={settings.delivery_fee}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    delivery_fee: parseFloat(e.target.value) || 0,
                  })
                }
                className="h-11 pl-10 bg-background/50 border-border/50 focus:border-primary/50"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="min-order" className="flex items-center gap-2 text-sm font-medium">
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              Pedido Mínimo (R$)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input
                id="min-order"
                type="number"
                min={0}
                step={1}
                value={settings.min_delivery_order}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    min_delivery_order: parseFloat(e.target.value) || 0,
                  })
                }
                className="h-11 pl-10 bg-background/50 border-border/50 focus:border-primary/50"
              />
            </div>
          </div>
        </div>
      </SettingCard>

      {/* Payment Methods */}
      <SettingCard
        icon={CreditCard}
        title="Métodos de Pagamento"
        description="Ative ou desative formas de pagamento aceitas"
        variant="elevated"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PAYMENT_METHODS.map(({ key, label, icon: Icon }) => (
            <div
              key={key}
              className={cn(
                "flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
                "hover:border-primary/30 hover:shadow-sm",
                settings.payment_methods[key]
                  ? "bg-gradient-to-r from-primary/5 to-transparent border-primary/20"
                  : "bg-card/50 border-border/50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg transition-colors",
                  settings.payment_methods[key]
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="font-medium">{label}</span>
              </div>
              <Switch
                checked={settings.payment_methods[key]}
                onCheckedChange={(checked) => handlePaymentMethodChange(key, checked)}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border/50">
          <Button 
            onClick={onSave} 
            disabled={isSaving} 
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25"
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Configurações Financeiras
          </Button>
        </div>
      </SettingCard>
    </div>
  );
}
