import { useState, useMemo, memo, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCustomerOrder, CartItem } from "@/hooks/useCustomerOrder";
import { useTableBill } from "@/hooks/useTableBill";
import { PaymentMethodSelector } from "@/components/customer-order/PaymentMethodSelector";
import { TableBillSheet } from "@/components/customer-order/TableBillSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  UtensilsCrossed,
  Clock,
  AlertCircle,
  ChefHat,
  User,
  Phone,
  ArrowLeft,
  Sparkles,
  Receipt,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

// Premium Loading skeleton with shimmer
const LoadingSkeleton = memo(function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header skeleton */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-40 shimmer" />
            <Skeleton className="h-4 w-24 shimmer" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full shimmer" />
        </div>
        <Skeleton className="h-10 w-full rounded-full shimmer" />
      </div>
      
      {/* Products grid skeleton */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className="space-y-2 animate-fade-in-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <Skeleton className="aspect-square w-full rounded-2xl shimmer" />
            <Skeleton className="h-4 w-3/4 shimmer" />
            <Skeleton className="h-5 w-1/2 shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
});

// Premium Error state
const ErrorState = memo(function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex items-center justify-center p-4">
      <div className="glass max-w-md w-full rounded-3xl p-8 text-center space-y-6 animate-scale-in">
        <div className="relative mx-auto w-fit">
          <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-full" />
          <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Mesa não encontrada</h2>
          <p className="text-muted-foreground text-sm">{message}</p>
        </div>
        <Button variant="outline" className="rounded-full" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </div>
    </div>
  );
});

// Premium Order success state
const OrderSuccess = memo(function OrderSuccess({
  orderNumber,
  tableName,
  onNewOrder,
}: {
  orderNumber: number | null;
  tableName: string;
  onNewOrder: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="glass max-w-md w-full rounded-3xl p-8 text-center space-y-8 animate-scale-in">
        {/* Success animation */}
        <div className="relative mx-auto w-fit">
          <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full animate-pulse" />
          <div className="relative h-28 w-28 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center animate-bounce-in">
              <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Pedido Enviado!
          </h2>
          {orderNumber && (
            <div className="inline-block">
              <div className="glass rounded-2xl py-4 px-6 space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Número do pedido</p>
                <p className="text-4xl font-black text-primary">#{orderNumber}</p>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2">
            <UtensilsCrossed className="h-4 w-4" />
            <span>{tableName}</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Tempo estimado: 15-30 min</span>
          </div>
        </div>
        
        <Button 
          onClick={onNewOrder} 
          variant="outline" 
          className="w-full rounded-full h-12 glass border-border/50"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Fazer Novo Pedido
        </Button>
      </div>
    </div>
  );
});

// Premium Product card component
const ProductCard = memo(function ProductCard({
  product,
  onAdd,
  index,
}: {
  product: Tables<"products"> & { category?: Tables<"categories"> | null };
  onAdd: (product: Tables<"products">) => void;
  index: number;
}) {
  const [showDetails, setShowDetails] = useState(false);

  const formattedPrice = useMemo(() => 
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(product.price),
    [product.price]
  );

  return (
    <>
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl cursor-pointer",
          "bg-card/80 backdrop-blur-sm border border-border/50",
          "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
          "transition-all duration-300 hover:-translate-y-1",
          "active:scale-[0.98] animate-fade-in-up"
        )}
        style={{ animationDelay: `${index * 50}ms` }}
        onClick={() => setShowDetails(true)}
      >
        {/* Image container */}
        <div className="aspect-square relative overflow-hidden bg-muted">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <ChefHat className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Preparation time badge */}
          {product.preparation_time && (
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 text-xs bg-background/90 backdrop-blur-sm border-0"
            >
              <Clock className="h-3 w-3 mr-1" />
              {product.preparation_time}min
            </Badge>
          )}
          
          {/* Quick add button on hover */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <Button
              size="icon"
              className="h-10 w-10 rounded-full shadow-lg"
              onClick={(e) => {
                e.stopPropagation();
                onAdd(product);
              }}
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-3 space-y-1.5">
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-primary font-bold text-lg">
            {formattedPrice}
          </p>
        </div>
      </div>

      {/* Product Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md mx-4 p-0 overflow-hidden rounded-3xl glass border-border/50">
          <div className="space-y-0">
            {product.image_url && (
              <div className="aspect-video relative overflow-hidden">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              </div>
            )}
            <div className="p-6 space-y-4">
              <DialogHeader>
                <DialogTitle className="text-xl">{product.name}</DialogTitle>
              </DialogHeader>
              
              {product.description && (
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {product.description}
                </p>
              )}
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-3xl font-black text-primary">
                  {formattedPrice}
                </span>
                {product.preparation_time && (
                  <Badge variant="outline" className="rounded-full">
                    <Clock className="h-3 w-3 mr-1" />
                    {product.preparation_time} min
                  </Badge>
                )}
              </div>
              
              <Button
                className="w-full h-12 rounded-full text-base font-semibold"
                size="lg"
                onClick={() => {
                  onAdd(product);
                  setShowDetails(false);
                }}
              >
                <Plus className="h-5 w-5 mr-2" />
                Adicionar ao Pedido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

// Cart item component - Enhanced with premium design
const CartItemRow = memo(function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}) {
  const subtotal = useMemo(() => item.product.price * item.quantity, [item.product.price, item.quantity]);
  
  const formattedUnitPrice = useMemo(() => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.product.price),
    [item.product.price]
  );
  
  const formattedSubtotal = useMemo(() => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(subtotal),
    [subtotal]
  );

  return (
    <div className="flex gap-3 py-4 border-b border-border/30 last:border-0 animate-fade-in">
      {/* Product Thumbnail */}
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0 ring-1 ring-border/50">
        {item.product.image_url ? (
          <img
            src={item.product.image_url}
            alt={item.product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <ChefHat className="h-6 w-6 text-muted-foreground/30" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm leading-tight line-clamp-2">
            {item.product.name}
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 -mt-1 -mr-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full flex-shrink-0"
            onClick={() => onRemove(item.product.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground">
          {formattedUnitPrice} cada
        </p>

        <div className="flex items-center justify-between pt-1">
          {/* Quantity Controls */}
          <div className="flex items-center gap-0.5 glass rounded-full p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-background/80"
              onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-background/80"
              onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Subtotal */}
          <p className="text-sm font-bold text-primary">
            {formattedSubtotal}
          </p>
        </div>
      </div>
    </div>
  );
});

// Empty cart state component
const EmptyCartState = memo(function EmptyCartState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-muted blur-2xl rounded-full" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <ShoppingCart className="h-10 w-10 text-muted-foreground/40" />
        </div>
      </div>
      <h3 className="text-lg font-bold mb-2">Carrinho vazio</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-[240px]">
        Adicione produtos do cardápio para começar seu pedido
      </p>
      <Button variant="outline" onClick={onClose} className="gap-2 rounded-full">
        <ArrowLeft className="h-4 w-4" />
        Ver Cardápio
      </Button>
    </div>
  );
});

// Main component
export default function CustomerOrder() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [billOpen, setBillOpen] = useState(false);

  const {
    table,
    tableLoading,
    tableError,
    products,
    productsLoading,
    categories,
    cart,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    cartTotal,
    cartItemsCount,
    customerInfo,
    setCustomerInfo,
    paymentMethod,
    setPaymentMethod,
    changeFor,
    setChangeFor,
    submitOrder,
    isSubmitting,
    submitError,
    orderSuccess,
    orderNumber,
    orderId,
    resetOrder,
  } = useCustomerOrder(tableId || "");

  // Use table bill hook
  const {
    orders: tableBillOrders,
    billTotal,
    ordersCount,
    itemsCount: billItemsCount,
    closeBill,
    closingBill,
    billClosed,
    resetBillState,
  } = useTableBill(tableId || "", table?.unit_id);

  // Redirect to tracking page when order is successful
  useEffect(() => {
    if (orderSuccess && orderId) {
      // Small delay for haptic feedback to complete
      const timer = setTimeout(() => {
        navigate(`/track/${orderId}`, { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [orderSuccess, orderId, navigate]);

  // Show error toast when submission fails
  useEffect(() => {
    if (submitError) {
      // Haptic feedback for error
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      toast.error("Erro ao enviar pedido", {
        description: "Não foi possível enviar seu pedido. Por favor, tente novamente.",
        duration: 5000,
      });
    }
  }, [submitError]);

  // Memoized filtered products
  const filteredProducts = useMemo(() => 
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category_id === selectedCategory),
    [products, selectedCategory]
  );

  // Memoized formatted cart total
  const formattedCartTotal = useMemo(() => 
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cartTotal),
    [cartTotal]
  );

  // Callbacks
  const handleAddToCart = useCallback((product: Tables<"products">) => {
    addToCart(product);
  }, [addToCart]);

  // Loading state
  if (tableLoading || productsLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (tableError || !table) {
    return (
      <ErrorState message="Não foi possível encontrar esta mesa. Verifique o QR Code e tente novamente." />
    );
  }

  // Success state - show brief loading while redirecting to tracking
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4 animate-pulse">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Redirecionando para acompanhamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Premium Header */}
      <header className="sticky top-0 z-40 glass border-b border-border/50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h1 className="text-xl font-bold text-foreground">
                {table.unit?.name || "Restaurante"}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <UtensilsCrossed className="h-4 w-4" />
                <span>Mesa {table.number}</span>
              </div>
            </div>
            
            {/* Bill button - shows when there are orders */}
            <div className="flex items-center gap-2">
              {ordersCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full glass border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => setBillOpen(true)}
                >
                  <Receipt className="h-4 w-4 mr-1.5" />
                  Ver Conta
                  <Badge className="ml-2 h-5 px-1.5 bg-primary text-primary-foreground text-xs rounded-full">
                    {ordersCount}
                  </Badge>
                </Button>
              )}
              {ordersCount === 0 && (
                <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-3">
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  Digital
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Category tabs with premium styling */}
        <div className="px-4 pb-4">
          <ScrollArea className="w-full whitespace-nowrap">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="inline-flex h-10 w-auto glass rounded-full p-1">
                <TabsTrigger 
                  value="all" 
                  className="text-sm px-4 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  Todos
                </TabsTrigger>
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="text-sm px-4 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    {cat.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </ScrollArea>
        </div>
      </header>

      {/* Products grid */}
      <main className="flex-1 overflow-y-auto pb-28">
        <div className="p-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 animate-fade-in">
              <div className="relative mx-auto w-fit mb-6">
                <div className="absolute inset-0 bg-muted blur-2xl rounded-full" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                  <ChefHat className="h-10 w-10 text-muted-foreground/40" />
                </div>
              </div>
              <p className="text-muted-foreground">
                Nenhum produto disponível nesta categoria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={handleAddToCart}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Premium Cart button (fixed) */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetTrigger asChild>
          <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe">
            <div className="glass rounded-2xl p-2">
              <Button
                className={cn(
                  "w-full h-14 text-base font-semibold rounded-xl relative overflow-hidden",
                  "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary",
                  "shadow-lg shadow-primary/25 transition-all duration-300",
                  cartItemsCount > 0 && "animate-pulse-glow"
                )}
                size="lg"
                disabled={cartItemsCount === 0}
              >
                <div className="flex items-center justify-center w-full">
                  <ShoppingCart className="h-5 w-5 mr-3" />
                  <span>Ver Carrinho</span>
                  {cartItemsCount > 0 && (
                    <>
                      <Separator orientation="vertical" className="h-5 mx-3 bg-primary-foreground/30" />
                      <span className="tabular-nums">{cartItemsCount}</span>
                      <Separator orientation="vertical" className="h-5 mx-3 bg-primary-foreground/30" />
                      <span className="font-bold">{formattedCartTotal}</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </div>
        </SheetTrigger>

        <SheetContent 
          side="bottom" 
          className="h-[90vh] sm:h-[85vh] flex flex-col p-0 rounded-t-3xl overflow-hidden glass border-t border-border/50"
        >
          {/* Header */}
          <SheetHeader className="px-6 py-5 border-b border-border/30 flex-shrink-0 bg-background/50">
            <SheetTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xl">Seu Pedido</span>
              </div>
              {cartItemsCount > 0 && (
                <Badge variant="secondary" className="font-bold rounded-full px-3">
                  {cartItemsCount} {cartItemsCount === 1 ? "item" : "itens"}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {/* Content */}
          <ScrollArea className="flex-1 min-h-0 overflow-hidden">
            <div className="px-6">
              {cart.length === 0 ? (
                <EmptyCartState onClose={() => setCartOpen(false)} />
              ) : (
                <>
                  {/* Cart Items */}
                  <div className="py-2">
                    {cart.map((item) => (
                      <CartItemRow
                        key={item.product.id}
                        item={item}
                        onUpdateQuantity={updateCartItemQuantity}
                        onRemove={removeFromCart}
                      />
                    ))}
                  </div>

                  {/* Customer Identification Section */}
                  <div className="py-4 mt-2">
                    <div className="glass rounded-2xl p-5 space-y-4 border border-border/30">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <p className="text-sm font-semibold">Identificação</p>
                          <Badge variant="outline" className="text-xs rounded-full">opcional</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground pl-6">
                          Para chamarmos você quando o pedido estiver pronto
                        </p>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Seu nome"
                            value={customerInfo.name}
                            onChange={(e) =>
                              setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))
                            }
                            className="pl-11 h-12 rounded-xl bg-background/80 border-border/50"
                          />
                        </div>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="(00) 00000-0000"
                            type="tel"
                            value={customerInfo.phone}
                            onChange={(e) =>
                              setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))
                            }
                            className="pl-11 h-12 rounded-xl bg-background/80 border-border/50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="pb-4">
                    <PaymentMethodSelector
                      paymentMethod={paymentMethod}
                      onPaymentMethodChange={setPaymentMethod}
                      changeFor={changeFor}
                      onChangeForChange={setChangeFor}
                      cartTotal={cartTotal}
                    />
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          {cart.length > 0 && (
            <SheetFooter className="flex-shrink-0 px-6 py-5 border-t border-border/30 bg-background/80 backdrop-blur-sm pb-safe">
              <div className="w-full space-y-4">
                {/* Order Summary */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Subtotal ({cartItemsCount} {cartItemsCount === 1 ? "item" : "itens"})</span>
                    <span>{formattedCartTotal}</span>
                  </div>
                  <Separator className="bg-border/30" />
                  <div className="flex items-center justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formattedCartTotal}</span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  className={cn(
                    "w-full h-14 text-base font-bold rounded-xl",
                    "bg-gradient-to-r from-primary to-primary/90",
                    "shadow-lg shadow-primary/25 transition-all duration-300",
                    "hover:shadow-xl hover:shadow-primary/30"
                  )}
                  size="lg"
                  onClick={() => {
                    if (!paymentMethod) {
                      toast.error("Selecione uma forma de pagamento");
                      return;
                    }
                    submitOrder();
                  }}
                  disabled={isSubmitting || cart.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-3" />
                      Enviando pedido...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-3" />
                      Enviar Pedido para Cozinha
                    </>
                  )}
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      {/* Table Bill Sheet */}
      <TableBillSheet
        open={billOpen}
        onOpenChange={(open) => {
          setBillOpen(open);
          if (!open) {
            resetBillState();
          }
        }}
        orders={tableBillOrders}
        billTotal={billTotal}
        ordersCount={ordersCount}
        itemsCount={billItemsCount}
        tableNumber={table.number}
        onCloseBill={closeBill}
        closingBill={closingBill}
        billClosed={billClosed}
      />
    </div>
  );
}
