import { useState } from "react";
import { useParams } from "react-router-dom";
import { useCustomerOrder, CartItem } from "@/hooks/useCustomerOrder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Error state
function ErrorState({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-4">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Mesa não encontrada</h2>
          <p className="text-muted-foreground">{message}</p>
        </CardContent>
      </Card>
    </div>
  );
}

// Order success state
function OrderSuccess({
  orderNumber,
  tableName,
  onNewOrder,
}: {
  orderNumber: number | null;
  tableName: string;
  onNewOrder: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="relative">
            <div className="h-24 w-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-14 w-14 text-green-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Pedido Enviado!
            </h2>
            {orderNumber && (
              <div className="bg-primary/10 rounded-lg py-3 px-4 inline-block">
                <p className="text-sm text-muted-foreground">Número do pedido</p>
                <p className="text-3xl font-bold text-primary">#{orderNumber}</p>
              </div>
            )}
          </div>
          <div className="space-y-2 text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              <span>{tableName}</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Tempo estimado: 15-30 min</span>
            </div>
          </div>
          <Button onClick={onNewOrder} variant="outline" className="w-full">
            Fazer Novo Pedido
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Product card component
function ProductCard({
  product,
  onAdd,
}: {
  product: Tables<"products"> & { category?: Tables<"categories"> | null };
  onAdd: (product: Tables<"products">) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
        onClick={() => setShowDetails(true)}
      >
        <div className="aspect-square relative bg-muted">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ChefHat className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          {product.preparation_time && (
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 text-xs"
            >
              <Clock className="h-3 w-3 mr-1" />
              {product.preparation_time}min
            </Badge>
          )}
        </div>
        <CardContent className="p-3 space-y-1">
          <h3 className="font-medium text-sm line-clamp-2 leading-tight">
            {product.name}
          </h3>
          <p className="text-primary font-bold">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(product.price)}
          </p>
        </CardContent>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-md mx-4">
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {product.image_url && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {product.description && (
              <p className="text-muted-foreground text-sm">
                {product.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(product.price)}
              </span>
              {product.preparation_time && (
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {product.preparation_time} min
                </Badge>
              )}
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={() => {
                onAdd(product);
                setShowDetails(false);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar ao Pedido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Cart item component
function CartItemRow({
  item,
  onUpdateQuantity,
  onRemove,
}: {
  item: CartItem;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.product.name}</p>
        <p className="text-primary text-sm font-semibold">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(item.product.price * item.quantity)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-6 text-center font-medium">{item.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onRemove(item.product.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// Main component
export default function CustomerOrder() {
  const { tableId } = useParams<{ tableId: string }>();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cartOpen, setCartOpen] = useState(false);

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
    submitOrder,
    isSubmitting,
    orderSuccess,
    orderNumber,
    resetOrder,
  } = useCustomerOrder(tableId || "");

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

  // Success state
  if (orderSuccess) {
    return (
      <OrderSuccess
        orderNumber={orderNumber}
        tableName={`Mesa ${table.number}`}
        onNewOrder={resetOrder}
      />
    );
  }

  // Filter products by category
  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category_id === selectedCategory);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {table.unit?.name || "Restaurante"}
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <UtensilsCrossed className="h-4 w-4" />
                <span>Mesa {table.number}</span>
              </div>
            </div>
            <Badge variant="outline" className="text-primary border-primary">
              Pedido Digital
            </Badge>
          </div>
        </div>

        {/* Category tabs */}
        <div className="px-4 pb-3">
          <ScrollArea className="w-full whitespace-nowrap">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="inline-flex h-9 w-auto bg-muted/50">
                <TabsTrigger value="all" className="text-xs px-3">
                  Todos
                </TabsTrigger>
                {categories.map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="text-xs px-3"
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
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="p-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhum produto disponível nesta categoria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdd={addToCart}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Cart button (fixed) */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetTrigger asChild>
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
            <Button
              className="w-full h-14 text-base font-semibold shadow-lg"
              size="lg"
              disabled={cartItemsCount === 0}
            >
              <ShoppingCart className="h-5 w-5 mr-3" />
              <span>Ver Carrinho</span>
              {cartItemsCount > 0 && (
                <>
                  <span className="mx-2">•</span>
                  <span>{cartItemsCount} {cartItemsCount === 1 ? "item" : "itens"}</span>
                  <span className="mx-2">•</span>
                  <span>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(cartTotal)}
                  </span>
                </>
              )}
            </Button>
          </div>
        </SheetTrigger>

        <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
          <SheetHeader className="px-4 py-4 border-b flex-shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Seu Pedido
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 px-4">
            {cart.length === 0 ? (
              <div className="py-12 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground">Seu carrinho está vazio</p>
              </div>
            ) : (
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
            )}

            {/* Customer info */}
            {cart.length > 0 && (
              <div className="py-4 space-y-3 border-t mt-2">
                <p className="text-sm font-medium text-muted-foreground">
                  Identificação (opcional)
                </p>
                <Input
                  placeholder="Seu nome"
                  value={customerInfo.name}
                  onChange={(e) =>
                    setCustomerInfo((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
                <Input
                  placeholder="Telefone"
                  type="tel"
                  value={customerInfo.phone}
                  onChange={(e) =>
                    setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>
            )}
          </ScrollArea>

          {cart.length > 0 && (
            <SheetFooter className="flex-shrink-0 px-4 py-4 border-t bg-muted/30">
              <div className="w-full space-y-4">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(cartTotal)}
                  </span>
                </div>
                <Button
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                  onClick={submitOrder}
                  disabled={isSubmitting || cart.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Enviar Pedido
                    </>
                  )}
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
