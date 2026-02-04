import { useState, useMemo, memo } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { toast } from "sonner";
import {
  Receipt,
  Clock,
  Phone,
  CheckCircle2,
  MessageCircle,
  ChefHat,
  Loader2,
  PartyPopper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type OrderWithItems = Tables<"orders"> & {
  order_items: Tables<"order_items">[];
};

interface TableBillSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: OrderWithItems[];
  billTotal: number;
  ordersCount: number;
  itemsCount: number;
  tableNumber: number;
  onCloseBill: (phone: string) => Promise<unknown>;
  closingBill: boolean;
  billClosed: boolean;
}

// Order item row component
const OrderItemRow = memo(function OrderItemRow({
  item,
}: {
  item: Tables<"order_items">;
}) {
  const formattedPrice = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(item.total_price),
    [item.total_price]
  );

  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="h-5 w-5 flex items-center justify-center p-0 text-xs rounded">
          {item.quantity}
        </Badge>
        <span className="text-muted-foreground">{item.product_name}</span>
      </div>
      <span className="font-medium">{formattedPrice}</span>
    </div>
  );
});

// Order card component
const OrderCard = memo(function OrderCard({
  order,
  index,
}: {
  order: OrderWithItems;
  index: number;
}) {
  const formattedSubtotal = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(order.total_price),
    [order.total_price]
  );

  const formattedTime = useMemo(
    () => format(new Date(order.created_at), "HH:mm", { locale: ptBR }),
    [order.created_at]
  );

  const statusLabel = useMemo(() => {
    switch (order.status) {
      case "pending":
        return { label: "Aguardando", color: "bg-yellow-500/10 text-yellow-600" };
      case "preparing":
        return { label: "Preparando", color: "bg-blue-500/10 text-blue-600" };
      case "ready":
        return { label: "Pronto", color: "bg-green-500/10 text-green-600" };
      case "delivered":
        return { label: "Entregue", color: "bg-emerald-500/10 text-emerald-600" };
      default:
        return { label: order.status, color: "bg-muted text-muted-foreground" };
    }
  }, [order.status]);

  return (
    <div
      className={cn(
        "glass rounded-2xl p-4 space-y-3 border border-border/30",
        "animate-fade-in-up"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Order header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Receipt className="h-4 w-4 text-primary" />
          </div>
          <div>
            <span className="font-bold">Pedido #{order.order_number}</span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formattedTime}
            </div>
          </div>
        </div>
        <Badge className={cn("rounded-full text-xs", statusLabel.color)}>
          {statusLabel.label}
        </Badge>
      </div>

      {/* Items list */}
      <div className="space-y-1 pl-10">
        {order.order_items.map((item) => (
          <OrderItemRow key={item.id} item={item} />
        ))}
      </div>

      {/* Order subtotal */}
      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <span className="text-sm text-muted-foreground">Subtotal</span>
        <span className="font-bold text-primary">{formattedSubtotal}</span>
      </div>
    </div>
  );
});

// Empty state
const EmptyBillState = memo(function EmptyBillState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-muted blur-2xl rounded-full" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <ChefHat className="h-10 w-10 text-muted-foreground/40" />
        </div>
      </div>
      <h3 className="text-lg font-bold mb-2">Nenhum pedido ainda</h3>
      <p className="text-sm text-muted-foreground max-w-[240px]">
        Faça pedidos pelo cardápio e eles aparecerão aqui para você acompanhar
      </p>
    </div>
  );
});

// Bill closed success state
const BillClosedSuccess = memo(function BillClosedSuccess({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-scale-in">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full animate-pulse" />
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center animate-bounce-in">
            <PartyPopper className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>
      </div>
      <h3 className="text-xl font-bold mb-2">Conta Fechada!</h3>
      <p className="text-sm text-muted-foreground max-w-[280px] mb-6">
        Enviamos o resumo da sua conta com o código Pix para seu WhatsApp. 
        Obrigado pela preferência!
      </p>
      <Button onClick={onClose} variant="outline" className="rounded-full">
        Fechar
      </Button>
    </div>
  );
});

export const TableBillSheet = memo(function TableBillSheet({
  open,
  onOpenChange,
  orders,
  billTotal,
  ordersCount,
  itemsCount,
  tableNumber,
  onCloseBill,
  closingBill,
  billClosed,
}: TableBillSheetProps) {
  const [phone, setPhone] = useState("");
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const formattedTotal = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(billTotal),
    [billTotal]
  );

  const handleCloseBill = async () => {
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
      await onCloseBill(cleanPhone);
      toast.success("Conta enviada para seu WhatsApp!");
    } catch (error) {
      console.error("Error closing bill:", error);
      toast.error("Erro ao fechar conta. Tente novamente.");
    }
  };

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
                <Receipt className="h-5 w-5 text-primary" />
              </div>
              <div className="text-left">
                <span className="text-xl block">Minha Conta</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Mesa {tableNumber}
                </span>
              </div>
            </div>
            {ordersCount > 0 && (
              <Badge variant="secondary" className="font-bold rounded-full px-3">
                {ordersCount} {ordersCount === 1 ? "pedido" : "pedidos"}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        {/* Content */}
        <ScrollArea className="flex-1 min-h-0 overflow-hidden">
          <div className="px-6 py-4">
            {billClosed ? (
              <BillClosedSuccess onClose={() => onOpenChange(false)} />
            ) : orders.length === 0 ? (
              <EmptyBillState />
            ) : (
              <div className="space-y-4">
                {orders.map((order, index) => (
                  <OrderCard key={order.id} order={order} index={index} />
                ))}

                {/* Phone input for closing bill */}
                {showPhoneInput && (
                  <div className="glass rounded-2xl p-4 space-y-3 border border-primary/30 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">
                        Receber conta no WhatsApp
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Informe seu telefone para receber o resumo completo da conta 
                      com o código Pix para pagamento.
                    </p>
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
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {orders.length > 0 && !billClosed && (
          <SheetFooter className="flex-shrink-0 px-6 py-5 border-t border-border/30 bg-background/80 backdrop-blur-sm pb-safe">
            <div className="w-full space-y-4">
              {/* Bill Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {itemsCount} {itemsCount === 1 ? "item" : "itens"} em{" "}
                    {ordersCount} {ordersCount === 1 ? "pedido" : "pedidos"}
                  </span>
                </div>
                <Separator className="bg-border/30" />
                <div className="flex items-center justify-between text-xl font-bold">
                  <span>Total da Conta</span>
                  <span className="text-primary">{formattedTotal}</span>
                </div>
              </div>

              {/* Close Bill Button */}
              <Button
                className={cn(
                  "w-full h-14 text-base font-bold rounded-xl",
                  "bg-gradient-to-r from-primary to-primary/90",
                  "shadow-lg shadow-primary/25 transition-all duration-300",
                  "hover:shadow-xl hover:shadow-primary/30"
                )}
                size="lg"
                onClick={handleCloseBill}
                disabled={closingBill || orders.length === 0}
              >
                {closingBill ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                    Enviando...
                  </>
                ) : showPhoneInput ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-3" />
                    Confirmar e Receber no WhatsApp
                  </>
                ) : (
                  <>
                    <Receipt className="h-5 w-5 mr-3" />
                    Fechar Conta
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
