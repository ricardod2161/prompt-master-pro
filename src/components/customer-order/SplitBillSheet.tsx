import { useState, useMemo, memo, useCallback, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Users,
  Receipt,
  DollarSign,
  Phone,
  CheckCircle2,
  Loader2,
  PartyPopper,
  Minus,
  Plus,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";
import { useSplitBill, type SplitMethod } from "@/hooks/useSplitBill";
import { PixPaymentCard } from "./PixPaymentCard";

type OrderWithItems = Tables<"orders"> & {
  order_items: Tables<"order_items">[];
};

interface SplitBillSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: OrderWithItems[];
  billTotal: number;
  tableId: string;
  unitId: string | undefined;
  tableNumber: number;
  onBillFullyPaid: () => void;
  pixConfig?: {
    pix_key: string;
    pix_merchant_name: string | null;
    pix_merchant_city: string | null;
  } | null;
}

// Split method button
const SplitMethodButton = memo(function SplitMethodButton({
  method,
  icon: Icon,
  label,
  isActive,
  onClick,
}: {
  method: SplitMethod;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200",
        isActive
          ? "border-primary bg-primary/10 text-primary"
          : "border-border/50 bg-background/50 text-muted-foreground hover:border-border hover:bg-muted/30"
      )}
    >
      <Icon className="h-6 w-6" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
});

// Order selection card for by_order split
const OrderSelectionCard = memo(function OrderSelectionCard({
  order,
  isSelected,
  onToggle,
}: {
  order: OrderWithItems;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const formattedPrice = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(order.total_price),
    [order.total_price]
  );

  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 text-left",
        isSelected
          ? "border-primary bg-primary/10"
          : "border-border/30 bg-background/50 hover:border-border"
      )}
    >
      <div className="flex items-center gap-3">
        <Checkbox checked={isSelected} className="pointer-events-none" />
        <div>
          <span className="font-semibold">Pedido #{order.order_number}</span>
          <p className="text-xs text-muted-foreground">
            {order.order_items.length} {order.order_items.length === 1 ? "item" : "itens"}
          </p>
        </div>
      </div>
      <span className={cn("font-bold", isSelected && "text-primary")}>
        {formattedPrice}
      </span>
    </button>
  );
});

// Success state
const PaymentSuccess = memo(function PaymentSuccess({
  billFullyPaid,
  onClose,
  onAutoClose,
}: {
  billFullyPaid: boolean;
  onClose: () => void;
  onAutoClose: () => void;
}) {
  useEffect(() => {
    if (billFullyPaid) {
      onAutoClose();
    }
  }, [billFullyPaid, onAutoClose]);

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-scale-in">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full animate-pulse" />
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center animate-bounce-in">
            {billFullyPaid ? (
              <PartyPopper className="h-10 w-10 text-primary-foreground" />
            ) : (
              <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
            )}
          </div>
        </div>
      </div>
      <h3 className="text-xl font-bold mb-2">
        {billFullyPaid ? "Conta Fechada!" : "Pagamento Registrado!"}
      </h3>
      <p className="text-sm text-muted-foreground max-w-[280px] mb-2">
        {billFullyPaid
          ? "Sua conta foi totalmente paga. Enviamos o comprovante para seu WhatsApp."
          : "Enviamos o comprovante do seu pagamento parcial para seu WhatsApp."}
      </p>
      {billFullyPaid && (
        <p className="text-xs text-muted-foreground mb-6">
          Obrigado pela preferência! Esta janela fechará automaticamente.
        </p>
      )}
      <Button onClick={onClose} variant="outline" className="rounded-full">
        {billFullyPaid ? "Fechar Agora" : "Continuar"}
      </Button>
    </div>
  );
});

export const SplitBillSheet = memo(function SplitBillSheet({
  open,
  onOpenChange,
  orders,
  billTotal,
  tableId,
  unitId,
  tableNumber,
  onBillFullyPaid,
  pixConfig,
}: SplitBillSheetProps) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [billFullyPaid, setBillFullyPaid] = useState(false);

  const {
    splitMethod,
    setSplitMethod,
    peopleCount,
    setPeopleCount,
    customAmount,
    setCustomAmount,
    selectedOrderIds,
    toggleOrderSelection,
    totalPaid,
    remainingBalance,
    paymentsCount,
    amountToPay,
    payPartial,
    payingPartial,
    paymentSuccess,
    resetSplitState,
  } = useSplitBill(tableId, unitId, orders, billTotal);

  // Auto-close and cleanup after full payment
  const handleAutoClose = useCallback(() => {
    setTimeout(() => {
      setCustomerName("");
      setPhone("");
      setShowPhoneInput(false);
      resetSplitState();
      onOpenChange(false);
      onBillFullyPaid();
    }, 3000);
  }, [onOpenChange, onBillFullyPaid, resetSplitState]);

  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }, []);

  const handlePayPartial = async () => {
    if (!showPhoneInput) {
      setShowPhoneInput(true);
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Informe um telefone válido");
      return;
    }

    try {
      const result = await payPartial(customerName, cleanPhone);
      if (result.billFullyPaid) {
        setBillFullyPaid(true);
      }
      toast.success(
        result.billFullyPaid
          ? "Conta paga! Comprovante enviado."
          : "Pagamento registrado! Comprovante enviado."
      );
    } catch (error) {
      console.error("Error paying partial:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao registrar pagamento"
      );
    }
  };

  // Reset phone input when sheet closes
  useEffect(() => {
    if (!open) {
      setShowPhoneInput(false);
      setPhone("");
      setCustomerName("");
      setBillFullyPaid(false);
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] sm:h-[85vh] flex flex-col p-0 rounded-t-3xl overflow-hidden glass border-t border-border/50"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-5 border-b border-border/30 flex-shrink-0 bg-background/50">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <span className="text-xl block">Dividir Conta</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Mesa {tableNumber}
                </span>
              </div>
            </div>
            {paymentsCount > 0 && (
              <Badge variant="secondary" className="font-bold rounded-full px-3">
                {paymentsCount} {paymentsCount === 1 ? "pagamento" : "pagamentos"}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Content */}
        <ScrollArea className="flex-1 min-h-0 overflow-hidden">
          <div className="px-6 py-4">
            {paymentSuccess ? (
              <PaymentSuccess
                billFullyPaid={billFullyPaid}
                onClose={() => {
                  if (billFullyPaid) {
                    onOpenChange(false);
                    onBillFullyPaid();
                  } else {
                    resetSplitState();
                    setShowPhoneInput(false);
                    setPhone("");
                    setCustomerName("");
                  }
                }}
                onAutoClose={handleAutoClose}
              />
            ) : (
              <div className="space-y-6">
                {/* Payment progress */}
                {totalPaid > 0 && (
                  <div className="glass rounded-2xl p-4 space-y-3 border border-primary/30 animate-fade-in">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Já pago</span>
                      <span className="font-bold text-primary">
                        {formatCurrency(totalPaid)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (totalPaid / billTotal) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Restante</span>
                      <span className="font-bold">{formatCurrency(remainingBalance)}</span>
                    </div>
                  </div>
                )}

                {/* Split method selector */}
                <div className="space-y-3">
                  <span className="text-sm font-semibold">Como deseja dividir?</span>
                  <div className="flex gap-3">
                    <SplitMethodButton
                      method="equal"
                      icon={Users}
                      label="Por Pessoas"
                      isActive={splitMethod === "equal"}
                      onClick={() => setSplitMethod("equal")}
                    />
                    <SplitMethodButton
                      method="by_order"
                      icon={Receipt}
                      label="Por Pedido"
                      isActive={splitMethod === "by_order"}
                      onClick={() => setSplitMethod("by_order")}
                    />
                    <SplitMethodButton
                      method="custom"
                      icon={DollarSign}
                      label="Valor"
                      isActive={splitMethod === "custom"}
                      onClick={() => setSplitMethod("custom")}
                    />
                  </div>
                </div>

                <Separator className="bg-border/30" />

                {/* Split configuration */}
                {splitMethod === "equal" && (
                  <div className="space-y-4 animate-fade-in">
                    <span className="text-sm font-semibold">Quantas pessoas?</span>
                    <div className="flex items-center justify-center gap-6">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-full"
                        onClick={() => setPeopleCount(Math.max(2, peopleCount - 1))}
                        disabled={peopleCount <= 2}
                      >
                        <Minus className="h-5 w-5" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <span className="text-4xl font-bold">{peopleCount}</span>
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-full"
                        onClick={() => setPeopleCount(Math.min(20, peopleCount + 1))}
                        disabled={peopleCount >= 20}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}

                {splitMethod === "by_order" && (
                  <div className="space-y-4 animate-fade-in">
                    <span className="text-sm font-semibold">
                      Selecione os pedidos que deseja pagar
                    </span>
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <OrderSelectionCard
                          key={order.id}
                          order={order}
                          isSelected={selectedOrderIds.includes(order.id)}
                          onToggle={() => toggleOrderSelection(order.id)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {splitMethod === "custom" && (
                  <div className="space-y-4 animate-fade-in">
                    <span className="text-sm font-semibold">
                      Quanto deseja pagar?
                    </span>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                        R$
                      </span>
                      <Input
                        type="number"
                        placeholder="0,00"
                        value={customAmount || ""}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          setCustomAmount(Math.min(value, remainingBalance));
                        }}
                        className="pl-12 h-14 text-xl font-bold rounded-xl bg-background/80 border-border/50"
                        step="0.01"
                        min="0"
                        max={remainingBalance}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Máximo: {formatCurrency(remainingBalance)}
                    </p>
                  </div>
                )}

                {/* Pix Payment for partial amount */}
                {pixConfig?.pix_key && amountToPay > 0 && (
                  <PixPaymentCard
                    pixKey={pixConfig.pix_key}
                    merchantName={pixConfig.pix_merchant_name || "RESTAURANTE"}
                    merchantCity={pixConfig.pix_merchant_city || "BRASIL"}
                    amount={amountToPay}
                  />
                )}

                {/* Phone input */}
                {showPhoneInput && (
                  <div className="glass rounded-2xl p-4 space-y-3 border border-primary/30 animate-fade-in">
                    <span className="text-sm font-semibold">Seus dados</span>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Seu nome (opcional)"
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="pl-11 h-12 rounded-xl bg-background/80 border-border/50"
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="(00) 00000-0000"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-11 h-12 rounded-xl bg-background/80 border-border/50"
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Enviaremos o comprovante e código Pix para seu WhatsApp
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {!paymentSuccess && (
          <SheetFooter className="flex-shrink-0 px-6 py-5 border-t border-border/30 bg-background/80 backdrop-blur-sm pb-safe">
            <div className="w-full space-y-4">
              {/* Payment Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Total da conta</span>
                  <span>{formatCurrency(billTotal)}</span>
                </div>
                {totalPaid > 0 && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Já pago ({paymentsCount})</span>
                    <span className="text-primary">
                      -{formatCurrency(totalPaid)}
                    </span>
                  </div>
                )}
                <Separator className="bg-border/30" />
                <div className="flex items-center justify-between text-xl font-bold">
                  <span>Sua Parte</span>
                  <span className="text-primary">{formatCurrency(amountToPay)}</span>
                </div>
              </div>

              {/* Pay Button */}
              <Button
                className={cn(
                  "w-full h-14 text-base font-bold rounded-xl",
                  "bg-gradient-to-r from-primary to-primary/90",
                  "shadow-lg shadow-primary/25 transition-all duration-300",
                  "hover:shadow-xl hover:shadow-primary/30"
                )}
                size="lg"
                onClick={handlePayPartial}
                disabled={payingPartial || amountToPay <= 0}
              >
                {payingPartial ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    Processando...
                  </>
                ) : showPhoneInput ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-3" />
                    Confirmar Pagamento
                  </>
                ) : (
                  <>
                    <DollarSign className="h-5 w-5 mr-3" />
                    Pagar Minha Parte
                  </>
                )}
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
});
