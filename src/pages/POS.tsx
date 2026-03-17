import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search, ShoppingCart, Minus, Plus, Trash2, User, Phone,
  MessageSquare, Pencil, Check, X, Banknote, CreditCard,
  QrCode, Ticket, Store, UtensilsCrossed, Bike, Clock,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card3D, Card3DContent } from "@/components/ui/card-3d";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useProducts, useCategories, type Product } from "@/hooks/useProducts";
import { useOrders, useCreateOrder, type OrderChannel, type PaymentMethod } from "@/hooks/useOrders";
import { useTables } from "@/hooks/useTables";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
  editingNote?: boolean;
}

// ── Constantes ───────────────────────────────────────────────────────────────

const CHANNELS: { value: OrderChannel; label: string; icon: React.ElementType }[] = [
  { value: "counter", label: "Balcão", icon: Store },
  { value: "table",   label: "Mesa",   icon: UtensilsCrossed },
  { value: "delivery",label: "Delivery",icon: Bike },
  { value: "whatsapp",label: "WhatsApp",icon: MessageSquare },
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: "cash",    label: "Dinheiro", icon: Banknote },
  { value: "credit",  label: "Crédito",  icon: CreditCard },
  { value: "debit",   label: "Débito",   icon: CreditCard },
  { value: "pix",     label: "PIX",      icon: QrCode },
  { value: "voucher", label: "Vale",     icon: Ticket },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pendente",    color: "bg-yellow-500/20 text-yellow-500" },
  preparing: { label: "Preparando",  color: "bg-blue-500/20 text-blue-500" },
  ready:     { label: "Pronto",      color: "bg-green-500/20 text-green-500" },
  delivered: { label: "Entregue",    color: "bg-primary/20 text-primary" },
  cancelled: { label: "Cancelado",   color: "bg-destructive/20 text-destructive" },
  completed: { label: "Concluído",   color: "bg-muted text-muted-foreground" },
};

function formatCurrency(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ── Componente CartPanel (reutilizado em sidebar e drawer) ────────────────────

interface CartPanelProps {
  cart: CartItem[];
  cartTotal: number;
  totalItems: number;
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onToggleNote: (id: string) => void;
  onChangeNote: (id: string, note: string) => void;
  onCheckout: () => void;
  recentOrders: ReturnType<typeof useOrders>["data"];
  recentOpen: boolean;
  onToggleRecent: () => void;
}

function CartPanel({
  cart, cartTotal, totalItems,
  onUpdateQty, onRemove, onToggleNote, onChangeNote, onCheckout,
  recentOrders, recentOpen, onToggleRecent,
}: CartPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShoppingCart className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold">Carrinho</span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {totalItems} {totalItems === 1 ? "item" : "itens"}
          </Badge>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 flex flex-col min-h-0 p-4 pt-3">
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2">
            <ShoppingCart className="h-8 w-8 opacity-30" />
            <span className="text-sm">Carrinho vazio</span>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-1 px-1">
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.product.id} className="rounded-lg bg-background/50 border border-border/30 overflow-hidden">
                    <div className="flex items-center gap-2 p-2">
                      {/* Qty controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="outline" size="icon" className="h-6 w-6 rounded-full"
                          onClick={() => onUpdateQty(item.product.id, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-6 w-6 rounded-full"
                          onClick={() => onUpdateQty(item.product.id, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs truncate">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.product.price)} ×{item.quantity} ={" "}
                          <span className="text-foreground font-semibold">
                            {formatCurrency(item.product.price * item.quantity)}
                          </span>
                        </p>
                      </div>
                      {/* Actions */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground"
                          title="Adicionar observação"
                          onClick={() => onToggleNote(item.product.id)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10"
                          onClick={() => onRemove(item.product.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {/* Inline note input */}
                    {item.editingNote && (
                      <div className="px-2 pb-2">
                        <Input
                          autoFocus
                          placeholder="Ex: sem cebola, bem passado..."
                          value={item.notes || ""}
                          onChange={(e) => onChangeNote(item.product.id, e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") onToggleNote(item.product.id); }}
                          className="h-7 text-xs bg-background/80"
                        />
                      </div>
                    )}
                    {/* Show saved note */}
                    {!item.editingNote && item.notes && (
                      <div className="px-2 pb-1.5">
                        <p className="text-xs text-muted-foreground italic truncate">📝 {item.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <Separator className="my-3" />

            <div className="space-y-3">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(cartTotal)}</span>
              </div>
              <Button
                className="w-full gradient-primary hover-lift"
                size="lg"
                onClick={onCheckout}
              >
                Finalizar Pedido
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Recent Orders Panel */}
      <div className="border-t border-border/50">
        <button
          onClick={onToggleRecent}
          className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span className="font-medium">Pedidos recentes</span>
          </div>
          {recentOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {recentOpen && (
          <div className="px-3 pb-3 space-y-1.5">
            {!recentOrders || recentOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">Nenhum pedido hoje</p>
            ) : (
              recentOrders.slice(0, 5).map((order) => {
                const st = STATUS_LABELS[order.status ?? "pending"];
                return (
                  <div key={order.id} className="flex items-center justify-between rounded-md bg-muted/30 px-2.5 py-1.5 gap-2">
                    <span className="text-xs font-bold text-primary">#{order.order_number}</span>
                    <span className="text-xs text-muted-foreground flex-1 truncate">
                      {CHANNELS.find(c => c.value === order.channel)?.label ?? order.channel}
                    </span>
                    <span className="text-xs font-semibold">{formatCurrency(order.total_price)}</span>
                    <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", st.color)}>
                      {st.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página principal PDV ──────────────────────────────────────────────────────

export default function POS() {
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories } = useCategories();
  const { data: tables } = useTables();
  const createOrder = useCreateOrder();

  // Today's recent orders for the sidebar panel
  const todayOrders = useOrders({ date: new Date(), limit: 5 });

  const [search, setSearch]                       = useState("");
  const [selectedCategory, setSelectedCategory]   = useState<string | null>(null);
  const [cart, setCart]                           = useState<CartItem[]>([]);
  const [cartDrawerOpen, setCartDrawerOpen]       = useState(false);
  const [checkoutOpen, setCheckoutOpen]           = useState(false);
  const [recentOpen, setRecentOpen]               = useState(false);

  // Inline channel + table selector (above product grid)
  const [channel, setChannel]                     = useState<OrderChannel>("counter");
  const [selectedTable, setSelectedTable]         = useState<string>("");

  // Checkout form
  const [customerName, setCustomerName]           = useState("");
  const [customerPhone, setCustomerPhone]         = useState("");
  const [orderNotes, setOrderNotes]               = useState("");
  const [paymentMethod, setPaymentMethod]         = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived]           = useState("");

  const searchRef = useRef<HTMLInputElement>(null);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "F2" && cart.length > 0 && !checkoutOpen) {
        e.preventDefault();
        setCheckoutOpen(true);
      }
      if (e.key === "Escape" && checkoutOpen) {
        setCheckoutOpen(false);
      }
      if (e.key === "/" && !checkoutOpen && document.activeElement !== searchRef.current) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [cart.length, checkoutOpen]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchSearch   = p.name.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !selectedCategory || p.category_id === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [products, search, selectedCategory]);

  const cartTotal = useMemo(() =>
    cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
  [cart]);

  const totalItems = useMemo(() =>
    cart.reduce((sum, item) => sum + item.quantity, 0),
  [cart]);

  const change = useMemo(() => {
    const received = parseFloat(cashReceived.replace(",", ".")) || 0;
    return Math.max(0, received - cartTotal);
  }, [cashReceived, cartTotal]);

  // Cart item in-grid badge
  const cartMap = useMemo(() => {
    const m: Record<string, number> = {};
    cart.forEach((i) => { m[i.product.id] = i.quantity; });
    return m;
  }, [cart]);

  const freeTables = useMemo(() =>
    tables?.filter((t) => t.status === "free") ?? [],
  [tables]);

  // ── Cart actions ────────────────────────────────────────────────────────────
  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => i.product.id === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const toggleNoteEdit = useCallback((productId: string) => {
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, editingNote: !i.editingNote } : i
      )
    );
  }, []);

  const changeNote = useCallback((productId: string, note: string) => {
    setCart((prev) =>
      prev.map((i) =>
        i.product.id === productId ? { ...i, notes: note } : i
      )
    );
  }, []);

  // ── Checkout ────────────────────────────────────────────────────────────────
  const resetCheckout = useCallback(() => {
    setCart([]);
    setCheckoutOpen(false);
    setCartDrawerOpen(false);
    setCustomerName("");
    setCustomerPhone("");
    setOrderNotes("");
    setPaymentMethod("cash");
    setCashReceived("");
    setSelectedTable("");
  }, []);

  const handleCheckout = async () => {
    try {
      const order = await createOrder.mutateAsync({
        channel,
        customer_name:  customerName || undefined,
        customer_phone: customerPhone || undefined,
        notes:          orderNotes   || undefined,
        table_id:       channel === "table" ? selectedTable : undefined,
        items: cart.map((item) => ({
          product_id:   item.product.id,
          product_name: item.product.name,
          quantity:     item.quantity,
          unit_price:   item.product.price,
          notes:        item.notes,
        })),
        payments: [{ method: paymentMethod, amount: cartTotal }],
      });
      resetCheckout();
      // Brief flash on the title with order number
      const _ = order; // captured for future use
    } catch {
      // error toast handled by useMutation onError
    }
  };

  const canCheckout = cart.length > 0 && !(channel === "table" && !selectedTable) && !createOrder.isPending;

  // ── Shared cart panel props ──────────────────────────────────────────────────
  const cartPanelProps: CartPanelProps = {
    cart, cartTotal, totalItems,
    onUpdateQty:    updateQuantity,
    onRemove:       removeFromCart,
    onToggleNote:   toggleNoteEdit,
    onChangeNote:   changeNote,
    onCheckout:     () => setCheckoutOpen(true),
    recentOrders:   todayOrders.data,
    recentOpen,
    onToggleRecent: () => setRecentOpen((v) => !v),
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4 relative">

      {/* ── Products Section ── */}
      <div className="flex-1 flex flex-col min-h-0">

        {/* Search */}
        <div className="space-y-3 mb-3 animate-fade-in-up">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder="Buscar produto... (pressione /)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card/50 border-border/50"
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearch("")}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Channel selector */}
          <div className="flex gap-2 flex-wrap">
            {CHANNELS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => { setChannel(value); setSelectedTable(""); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                  channel === value
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border bg-card/50"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Table picker — only when channel = table */}
          {channel === "table" && (
            <div className="animate-fade-in-up">
              <p className="text-xs text-muted-foreground mb-1.5">Selecione a mesa</p>
              {freeTables.length === 0 ? (
                <p className="text-xs text-destructive">Todas as mesas estão ocupadas</p>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {freeTables.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTable(t.id)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-sm font-medium border transition-all",
                        selectedTable === t.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border/50 text-muted-foreground hover:border-border bg-card/50"
                      )}
                    >
                      Mesa {t.number}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Category filter */}
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-1">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className={selectedCategory === null ? "gradient-primary" : "hover-lift"}
              >
                Todos
              </Button>
              {categories?.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={selectedCategory === cat.id ? "gradient-primary" : "hover-lift"}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Product grid */}
        <ScrollArea className="flex-1">
          {productsLoading ? (
            <LoadingSkeleton variant="grid" count={8} />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={ShoppingCart}
              title="Nenhum produto encontrado"
              description="Tente ajustar os filtros ou buscar por outro termo"
            />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-24 lg:pb-0">
              {filteredProducts.map((product, index) => {
                const qtyInCart = cartMap[product.id] ?? 0;
                return (
                  <Card3D
                    key={product.id}
                    variant="subtle"
                    className="cursor-pointer animate-fade-in-up relative"
                    style={{ animationDelay: `${0.02 * index}s` }}
                    onClick={() => addToCart(product)}
                  >
                    {/* Quantity badge on card */}
                    {qtyInCart > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 z-10 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow">
                        {qtyInCart}
                      </span>
                    )}
                    <Card3DContent className="p-3">
                      {product.image_url && (
                        <div className="aspect-square rounded-lg bg-muted mb-2 overflow-hidden">
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      )}
                      <h4 className="font-medium text-sm leading-tight line-clamp-2">{product.name}</h4>
                      {product.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{product.description}</p>
                      )}
                      <p className={cn("font-bold mt-1", qtyInCart > 0 ? "text-primary" : "text-foreground")}>
                        {formatCurrency(product.price)}
                      </p>
                      {product.category && (
                        <Badge variant="secondary" className="mt-1 text-[10px] py-0">
                          {product.category.name}
                        </Badge>
                      )}
                    </Card3DContent>
                  </Card3D>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* ── Desktop Cart Sidebar ── */}
      <GlassCard
        glow={cart.length > 0}
        glowColor="primary"
        className="hidden lg:flex flex-col w-80 xl:w-96 animate-fade-in-up"
        style={{ animationDelay: "0.2s" }}
      >
        <CartPanel {...cartPanelProps} />
      </GlassCard>

      {/* ── Mobile floating cart button ── */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <Button
          size="lg"
          className="h-14 pl-4 pr-5 rounded-full shadow-xl gradient-primary gap-2 text-base font-semibold"
          onClick={() => setCartDrawerOpen(true)}
        >
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <Badge className="bg-primary-foreground text-primary text-xs px-1.5 py-0 h-5">
              {totalItems}
            </Badge>
          )}
          <span>{formatCurrency(cartTotal)}</span>
        </Button>
      </div>

      {/* ── Mobile Cart Drawer ── */}
      <Sheet open={cartDrawerOpen} onOpenChange={setCartDrawerOpen}>
        <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl p-0 flex flex-col">
          <SheetHeader className="sr-only">
            <SheetTitle>Carrinho</SheetTitle>
          </SheetHeader>
          <CartPanel {...cartPanelProps} />
        </SheetContent>
      </Sheet>

      {/* ── Checkout Dialog ── */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-lg glass max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Finalizar Pedido
              <Badge variant="outline" className="ml-auto text-xs">
                {CHANNELS.find(c => c.value === channel)?.label}
                {channel === "table" && selectedTable && ` · Mesa ${freeTables.find(t => t.id === selectedTable)?.number ?? ""}`}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Order summary */}
            <div className="rounded-lg bg-muted/30 border border-border/30 divide-y divide-border/30">
              {cart.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center px-3 py-1.5 text-sm">
                  <span className="text-muted-foreground">
                    {item.quantity}× {item.product.name}
                    {item.notes && <span className="block text-[11px] italic text-muted-foreground/70">↳ {item.notes}</span>}
                  </span>
                  <span className="font-semibold shrink-0 ml-2">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center px-3 py-2 font-bold">
                <span>Total</span>
                <span className="text-primary text-lg">{formatCurrency(cartTotal)}</span>
              </div>
            </div>

            {/* Payment method — visual buttons */}
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => { setPaymentMethod(value); setCashReceived(""); }}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-medium transition-all",
                      paymentMethod === value
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border bg-card/50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash change calculator */}
            {paymentMethod === "cash" && (
              <div className="animate-fade-in-up space-y-2 rounded-xl bg-muted/30 border border-border/30 p-3">
                <Label className="text-sm">Valor recebido</Label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                    <Input
                      placeholder="0,00"
                      value={cashReceived}
                      onChange={(e) => setCashReceived(e.target.value)}
                      className="pl-9 bg-background/50"
                      inputMode="decimal"
                    />
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">Troco</p>
                    <p className={cn(
                      "text-lg font-bold",
                      parseFloat(cashReceived.replace(",", ".") || "0") >= cartTotal
                        ? "text-primary"
                        : "text-destructive"
                    )}>
                      {formatCurrency(change)}
                    </p>
                  </div>
                </div>
                {/* Quick cash buttons */}
                <div className="flex gap-2 flex-wrap mt-1">
                  {[cartTotal, Math.ceil(cartTotal / 10) * 10, Math.ceil(cartTotal / 50) * 50, 100, 200].filter((v, i, a) => a.indexOf(v) === i && v >= cartTotal).slice(0, 4).map((v) => (
                    <button
                      key={v}
                      onClick={() => setCashReceived(v.toFixed(2).replace(".", ","))}
                      className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground border border-border/30 transition-colors"
                    >
                      {formatCurrency(v)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customer info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-sm">
                  <User className="h-3 w-3" /> Cliente
                </Label>
                <Input
                  placeholder="Nome (opcional)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1 text-sm">
                  <Phone className="h-3 w-3" /> Telefone
                </Label>
                <Input
                  placeholder="(opcional)"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="bg-background/50"
                  inputMode="tel"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="flex items-center gap-1 text-sm">
                <MessageSquare className="h-3 w-3" /> Observações gerais
              </Label>
              <Textarea
                placeholder="Observações do pedido..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="bg-background/50 resize-none"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="mt-2 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={!canCheckout}
              className="gradient-primary min-w-32"
            >
              {createOrder.isPending ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
                  Processando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Confirmar — F2
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
