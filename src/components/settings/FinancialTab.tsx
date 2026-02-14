import { DollarSign, CreditCard, Banknote, Wallet, Receipt, Truck, ShoppingBag, Save, Loader2, QrCode, CheckCircle2, AlertCircle, User, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingCard } from "./SettingCard";
import { cn } from "@/lib/utils";
import { detectPixKeyType, formatPixKeyForDisplay, isValidPixKey } from "@/lib/pix-generator";
import { useMemo } from "react";
import { PixConfigValidator } from "./PixConfigValidator";

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
  pix_key?: string | null;
  pix_merchant_name?: string | null;
  pix_merchant_city?: string | null;
}

interface FinancialTabProps {
  settings: FinancialSettings;
  onSettingsChange: (settings: FinancialSettings) => void;
  onSave: () => void;
  isSaving: boolean;
  unitName?: string;
  unitAddress?: string | null;
}

// Removed - merged above

const PAYMENT_METHODS = [
  { key: "cash" as const, label: "Dinheiro", icon: Banknote },
  { key: "credit" as const, label: "Crédito", icon: CreditCard },
  { key: "debit" as const, label: "Débito", icon: CreditCard },
  { key: "pix" as const, label: "PIX", icon: Wallet },
  { key: "voucher" as const, label: "Voucher", icon: Receipt },
];

export function FinancialTab({ settings, onSettingsChange, onSave, isSaving, unitName, unitAddress }: FinancialTabProps) {
  const handlePaymentMethodChange = (key: keyof PaymentMethods, checked: boolean) => {
    onSettingsChange({
      ...settings,
      payment_methods: { ...settings.payment_methods, [key]: checked },
    });
  };

  // Validate and detect Pix key type
  const pixKeyInfo = useMemo(() => {
    if (!settings.pix_key) return null;
    
    const type = detectPixKeyType(settings.pix_key);
    const isValid = isValidPixKey(settings.pix_key);
    
    const typeLabels: Record<string, string> = {
      cpf: "CPF",
      cnpj: "CNPJ",
      phone: "Telefone",
      email: "Email",
      random: "Chave Aleatória",
      invalid: "Inválido",
    };
    
    return {
      type,
      typeLabel: typeLabels[type] || "Desconhecido",
      isValid,
      formatted: isValid ? formatPixKeyForDisplay(settings.pix_key) : settings.pix_key,
    };
  }, [settings.pix_key]);

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
            Salvar Métodos de Pagamento
          </Button>
        </div>
      </SettingCard>

      <SettingCard
        icon={QrCode}
        title="Chave Pix"
        description="Configure sua chave Pix para receber pagamentos via QR Code"
        variant="glass"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pix-key" className="flex items-center gap-2 text-sm font-medium">
              <QrCode className="h-4 w-4 text-muted-foreground" />
              Chave Pix
            </Label>
            <Input
              id="pix-key"
              type="text"
              placeholder="CPF, CNPJ, email, telefone ou chave aleatória"
              value={settings.pix_key || ""}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  pix_key: e.target.value || null,
                })
              }
              className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
            />
            
            {/* Pix key validation feedback */}
            {settings.pix_key && (
              <div className={cn(
                "flex items-center gap-2 text-sm mt-2 p-3 rounded-lg",
                pixKeyInfo?.isValid 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                  : "bg-destructive/10 text-destructive"
              )}>
                {pixKeyInfo?.isValid ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Chave válida: <strong>{pixKeyInfo?.typeLabel}</strong></span>
                    <span className="text-muted-foreground">({pixKeyInfo?.formatted})</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <span>Formato de chave Pix inválido</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Pix Merchant Name */}
          <div className="space-y-2">
            <Label htmlFor="pix-merchant-name" className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-muted-foreground" />
              Nome do Beneficiário
            </Label>
            <Input
              id="pix-merchant-name"
              type="text"
              placeholder="Nome como registrado no Pix (ex: JOAO DA SILVA)"
              value={settings.pix_merchant_name || ""}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  pix_merchant_name: e.target.value.toUpperCase() || null,
                })
              }
              className="h-11 bg-background/50 border-border/50 focus:border-primary/50 uppercase"
              maxLength={25}
            />
            <p className="text-xs text-muted-foreground">
              Nome que aparece no comprovante de pagamento (máx. 25 caracteres)
            </p>
          </div>

          {/* Pix Merchant City */}
          <div className="space-y-2">
            <Label htmlFor="pix-merchant-city" className="flex items-center gap-2 text-sm font-medium">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Cidade do Beneficiário
            </Label>
            <Input
              id="pix-merchant-city"
              type="text"
              placeholder="Cidade (ex: SAO PAULO)"
              value={settings.pix_merchant_city || ""}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  pix_merchant_city: e.target.value.toUpperCase() || null,
                })
              }
              className="h-11 bg-background/50 border-border/50 focus:border-primary/50 uppercase"
              maxLength={15}
            />
            <p className="text-xs text-muted-foreground">
              Cidade registrada no Pix (obrigatório no padrão EMV)
            </p>
          </div>
          
          <p className="text-xs text-muted-foreground">
            💡 A chave Pix será usada para gerar QR Codes de pagamento nos pedidos via mesa.
            Os clientes poderão pagar diretamente pelo app do banco.
          </p>

          <div className="pt-4 border-t border-border/50">
            <Button 
              onClick={onSave} 
              disabled={isSaving || (settings.pix_key && !pixKeyInfo?.isValid)} 
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 shadow-lg shadow-emerald-500/25"
            >
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Salvar Configurações Pix
            </Button>
          </div>
        </div>
      </SettingCard>

      {/* Pix Config Validator */}
      <SettingCard
        icon={QrCode}
        title="Saúde da Configuração Pix"
        description="Verificação automática da configuração Pix para garantir funcionamento correto"
        variant="elevated"
      >
        <PixConfigValidator
          pixKey={settings.pix_key}
          merchantName={settings.pix_merchant_name}
          merchantCity={settings.pix_merchant_city}
          unitName={unitName || ""}
          unitAddress={unitAddress}
          onAutoFix={(field, value) => {
            onSettingsChange({
              ...settings,
              [field]: value,
            });
          }}
        />
      </SettingCard>
    </div>
  );
}
