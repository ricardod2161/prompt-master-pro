import { useState } from "react";
import { ShoppingCart, Monitor, UtensilsCrossed, BarChart3, Plus, Minus, CreditCard, Clock, Check, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { trackPixelEvent, trackPixelCustomEvent } from "@/hooks/usePixelTracking";

// Mock data for demos
const MOCK_PRODUCTS = [
  { id: 1, name: "X-Burger", price: 25.9, category: "Lanches" },
  { id: 2, name: "X-Bacon", price: 29.9, category: "Lanches" },
  { id: 3, name: "Batata Frita", price: 15.9, category: "Acompanhamentos" },
  { id: 4, name: "Refrigerante", price: 7.9, category: "Bebidas" },
  { id: 5, name: "Suco Natural", price: 9.9, category: "Bebidas" },
];

const MOCK_KDS_ORDERS = [
  { id: "#142", time: "2 min", items: ["1x X-Burger", "1x Batata"], status: "preparing" },
  { id: "#143", time: "5 min", items: ["2x X-Bacon", "2x Refri"], status: "pending" },
  { id: "#144", time: "8 min", items: ["1x Combo Família"], status: "pending" },
];

const MOCK_STATS = [
  { label: "Vendas Hoje", value: "R$ 4.280", change: "+12%" },
  { label: "Pedidos", value: "47", change: "+8%" },
  { label: "Ticket Médio", value: "R$ 91,06", change: "+5%" },
  { label: "Tempo Médio", value: "18 min", change: "-15%" },
];

export function InteractiveDemoSection() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<{ id: number; name: string; price: number; category: string; qty: number }[]>([]);
  const [kdsOrders, setKdsOrders] = useState(MOCK_KDS_ORDERS);

  const addToCart = (product: typeof MOCK_PRODUCTS[0]) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === productId);
      if (existing && existing.qty > 1) {
        return prev.map((item) =>
          item.id === productId ? { ...item, qty: item.qty - 1 } : item
        );
      }
      return prev.filter((item) => item.id !== productId);
    });
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  const advanceOrder = (orderId: string) => {
    setKdsOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? { ...order, status: order.status === "pending" ? "preparing" : "ready" }
          : order
      )
    );
  };

  return (
    <section id="demo" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      </div>

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Experimente{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Agora
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Veja como o RestaurantOS funciona na prática. Interaja com as demos abaixo.
          </p>
        </div>

        {/* Demo Tabs */}
        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="pdv" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8">
              <TabsTrigger value="pdv" className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                <span className="hidden sm:inline">PDV</span>
              </TabsTrigger>
              <TabsTrigger value="kds" className="gap-2">
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">KDS</span>
              </TabsTrigger>
              <TabsTrigger value="menu" className="gap-2">
                <UtensilsCrossed className="w-4 h-4" />
                <span className="hidden sm:inline">Cardápio</span>
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </TabsTrigger>
            </TabsList>

            {/* PDV Demo */}
            <TabsContent value="pdv">
              <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 md:p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Products */}
                  <div className="md:col-span-2">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-primary" />
                      Produtos
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {MOCK_PRODUCTS.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => addToCart(product)}
                          className="p-4 rounded-xl border border-border bg-background hover:border-primary hover:bg-primary/5 transition-all text-left group"
                        >
                          <p className="font-medium text-sm group-hover:text-primary transition-colors">
                            {product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {product.category}
                          </p>
                          <p className="font-bold text-primary mt-2">
                            R$ {product.price.toFixed(2)}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Cart */}
                  <div className="border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Carrinho
                    </h3>
                    
                    {cart.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Clique nos produtos para adicionar ao carrinho
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {cart.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                          >
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                R$ {item.price.toFixed(2)} x {item.qty}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center hover:bg-destructive hover:text-destructive-foreground transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-sm font-medium">
                                {item.qty}
                              </span>
                              <button
                                onClick={() => addToCart(item)}
                                className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}

                        <div className="border-t border-border pt-3 mt-4">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-semibold">Total</span>
                            <span className="text-xl font-bold text-primary">
                              R$ {cartTotal.toFixed(2)}
                            </span>
                          </div>
                          <Button className="w-full" size="sm">
                            Finalizar Pedido
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* KDS Demo */}
            <TabsContent value="kds">
              <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 md:p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-primary" />
                  Tela da Cozinha (KDS)
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Clique nos pedidos para avançar o status
                </p>
                
                <div className="grid sm:grid-cols-3 gap-4">
                  {kdsOrders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => advanceOrder(order.id)}
                      className={cn(
                        "p-4 rounded-xl border-2 transition-all text-left",
                        order.status === "pending" && "border-yellow-500 bg-yellow-500/10",
                        order.status === "preparing" && "border-blue-500 bg-blue-500/10",
                        order.status === "ready" && "border-green-500 bg-green-500/10"
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-bold text-lg">{order.id}</span>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {order.time}
                        </div>
                      </div>
                      
                      <div className="space-y-1 mb-3">
                        {order.items.map((item, i) => (
                          <p key={i} className="text-sm">{item}</p>
                        ))}
                      </div>

                      <div
                        className={cn(
                          "flex items-center gap-2 text-xs font-medium px-2 py-1 rounded-full w-fit",
                          order.status === "pending" && "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400",
                          order.status === "preparing" && "bg-blue-500/20 text-blue-700 dark:text-blue-400",
                          order.status === "ready" && "bg-green-500/20 text-green-700 dark:text-green-400"
                        )}
                      >
                        {order.status === "ready" && <Check className="w-3 h-3" />}
                        {order.status === "pending" && "Pendente"}
                        {order.status === "preparing" && "Preparando"}
                        {order.status === "ready" && "Pronto"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Menu Demo */}
            <TabsContent value="menu">
              <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 md:p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <UtensilsCrossed className="w-5 h-5 text-primary" />
                  Cardápio Digital
                </h3>
                
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {["Todos", "Lanches", "Acompanhamentos", "Bebidas"].map((cat) => (
                    <button
                      key={cat}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors",
                        cat === "Todos"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {MOCK_PRODUCTS.map((product) => (
                    <div
                      key={product.id}
                      className="p-4 rounded-xl border border-border bg-background flex items-center gap-4"
                    >
                      <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0">
                        <UtensilsCrossed className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                        <p className="font-bold text-primary mt-1">
                          R$ {product.price.toFixed(2)}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Dashboard Demo */}
            <TabsContent value="dashboard">
              <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4 md:p-6">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Dashboard de Vendas
                </h3>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {MOCK_STATS.map((stat) => (
                    <div
                      key={stat.label}
                      className="p-4 rounded-xl border border-border bg-background"
                    >
                      <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          stat.change.startsWith("+") ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {stat.change} vs ontem
                      </p>
                    </div>
                  ))}
                </div>

                {/* Fake chart */}
                <div className="h-48 rounded-xl border border-border bg-background p-4 flex items-end gap-2">
                  {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-gradient-to-t from-primary to-primary/50 rounded-t transition-all hover:from-primary/80"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* CTA */}
          <div className="text-center mt-10">
            <Button size="lg" onClick={() => { trackPixelEvent("StartTrial", { content_name: "demo_section" }); navigate("/login"); }}>
              Começar Gratuitamente →
            </Button>
            <p className="text-sm text-muted-foreground mt-3">
              Teste grátis por 14 dias. Sem cartão de crédito.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
