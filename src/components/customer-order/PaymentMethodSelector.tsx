import { memo, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Banknote, QrCode, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaymentMethod = "cash" | "pix" | "credit" | null;

interface PaymentOptionProps {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}

const PaymentOption = memo(function PaymentOption({
  icon,
  label,
  selected,
  onClick,
}: PaymentOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-200",
        "border-2",
        selected
          ? "border-primary bg-primary/10 text-primary scale-[1.02]"
          : "border-border/50 bg-background/50 hover:border-primary/30 hover:bg-primary/5"
      )}
    >
      <div
        className={cn(
          "h-10 w-10 rounded-full flex items-center justify-center transition-colors",
          selected ? "bg-primary/20" : "bg-muted"
        )}
      >
        {icon}
      </div>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
});

interface PaymentMethodSelectorProps {
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  changeFor: string;
  onChangeForChange: (value: string) => void;
  cartTotal: number;
}

export const PaymentMethodSelector = memo(function PaymentMethodSelector({
  paymentMethod,
  onPaymentMethodChange,
  changeFor,
  onChangeForChange,
  cartTotal,
}: PaymentMethodSelectorProps) {
  const changeAmount = useMemo(() => {
    const changeValue = parseFloat(changeFor) || 0;
    return changeValue > cartTotal ? changeValue - cartTotal : 0;
  }, [changeFor, cartTotal]);

  const formattedChange = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(changeAmount),
    [changeAmount]
  );

  const insufficientAmount = useMemo(() => {
    const changeValue = parseFloat(changeFor) || 0;
    return changeFor && changeValue > 0 && changeValue < cartTotal;
  }, [changeFor, cartTotal]);

  return (
    <div className="glass rounded-2xl p-5 space-y-4 border border-border/30">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Forma de Pagamento</p>
          <span className="text-xs text-destructive">*</span>
        </div>
        <p className="text-xs text-muted-foreground pl-6">
          Selecione como deseja pagar
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <PaymentOption
          icon={<Banknote className="h-5 w-5" />}
          label="Dinheiro"
          selected={paymentMethod === "cash"}
          onClick={() => onPaymentMethodChange("cash")}
        />
        <PaymentOption
          icon={<QrCode className="h-5 w-5" />}
          label="Pix"
          selected={paymentMethod === "pix"}
          onClick={() => onPaymentMethodChange("pix")}
        />
        <PaymentOption
          icon={<CreditCard className="h-5 w-5" />}
          label="Cartão"
          selected={paymentMethod === "credit"}
          onClick={() => onPaymentMethodChange("credit")}
        />
      </div>

      {paymentMethod === "cash" && (
        <div className="animate-fade-in space-y-3 pt-2">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
              R$
            </span>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              value={changeFor}
              onChange={(e) => onChangeForChange(e.target.value)}
              className={cn(
                "pl-10 h-12 rounded-xl bg-background/80 border-border/50 text-lg font-semibold",
                insufficientAmount && "border-destructive/50 focus-visible:ring-destructive"
              )}
            />
          </div>
          
          {insufficientAmount && (
            <p className="text-sm text-destructive animate-fade-in">
              Valor menor que o total do pedido
            </p>
          )}
          
          {changeAmount > 0 && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20 animate-fade-in">
              <span className="text-sm text-muted-foreground">Troco:</span>
              <span className="text-lg font-bold text-primary">
                {formattedChange}
              </span>
            </div>
          )}
          
          {!changeFor && (
            <p className="text-xs text-muted-foreground">
              Informe o valor que vai pagar para calcularmos o troco
            </p>
          )}
        </div>
      )}
    </div>
  );
});
