import { useParams, useNavigate } from "react-router-dom";
import { useOrderTracking } from "@/hooks/useOrderTracking";
import { generatePixCode, isValidPixKey } from "@/lib/pix-generator";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Clock,
  ChefHat,
  CheckCircle2,
  UtensilsCrossed,
  Copy,
  XCircle,
  Sparkles,
  QrCode,
} from "lucide-react";
import { useMemo, useCallback } from "react";

// Status step component
function StatusStep({
  label,
  icon: Icon,
  isActive,
  isCompleted,
  isCancelled,
}: {
  label: string;
  icon: React.ElementType;
  isActive: boolean;
  isCompleted: boolean;
  isCancelled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500",
          isCancelled && "bg-destructive/20 text-destructive",
          isCompleted && !isCancelled && "bg-primary text-primary-foreground",
          isActive && !isCompleted && !isCancelled && "bg-primary/20 text-primary ring-4 ring-primary/20 animate-pulse",
          !isActive && !isCompleted && !isCancelled && "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <span
        className={cn(
          "text-xs font-medium text-center",
          (isActive || isCompleted) && !isCancelled ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
      </span>
    </div>
  );
}

// Loading state
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-lg mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </div>
  );
}

// Not found state
function NotFoundState() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-border/50">
        <CardContent className="pt-8 text-center space-y-6">
          <div className="relative mx-auto w-fit">
            <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-full" />
            <div className="relative h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Pedido não encontrado</h2>
            <p className="text-muted-foreground text-sm">
              Não foi possível encontrar este pedido. Verifique o link e tente novamente.
            </p>
          </div>
          <Button variant="outline" className="rounded-full" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao início
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OrderTracking() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const {
    order,
    isLoading,
    currentStatus,
    progressPercentage,
    statusLabel,
    unitSettings,
    unitInfo,
  } = useOrderTracking(token || "");

  // Generate Pix code
  const pixCode = useMemo(() => {
    if (!unitSettings?.pix_key || !isValidPixKey(unitSettings.pix_key) || !order) {
      return null;
    }

    return generatePixCode({
      pixKey: unitSettings.pix_key,
      merchantName: unitSettings.pix_merchant_name || unitInfo?.name || "RESTAURANTE",
      merchantCity: unitSettings.pix_merchant_city || "BRASIL",
      amount: order.total_price,
      transactionId: `PED${order.order_number}`,
      description: `Pedido ${order.order_number}`,
    });
  }, [unitSettings, unitInfo, order]);

  // Copy Pix code to clipboard
  const handleCopyPix = useCallback(async () => {
    if (!pixCode) return;

    try {
      await navigator.clipboard.writeText(pixCode);
      toast.success("Código Pix copiado!", {
        description: "Cole no app do seu banco para pagar",
      });
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch {
      toast.error("Erro ao copiar", {
        description: "Tente selecionar e copiar manualmente",
      });
    }
  }, [pixCode]);

  // Format currency
  const formatCurrency = useCallback((value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }, []);

  // Format Pix key for display (CPF, CNPJ, phone, email, or random)
  const formatPixKey = useCallback((key: string) => {
    const cleanKey = key.replace(/\D/g, "");
    
    // CPF: 11 digits
    if (cleanKey.length === 11 && /^\d+$/.test(cleanKey)) {
      return cleanKey.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    
    // CNPJ: 14 digits
    if (cleanKey.length === 14 && /^\d+$/.test(cleanKey)) {
      return cleanKey.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    }
    
    // Phone: starts with +55 or has 10-11 digits
    if (/^\+?55\d{10,11}$/.test(key.replace(/\D/g, "")) || (cleanKey.length >= 10 && cleanKey.length <= 11)) {
      return key;
    }
    
    // Email or EVP (random key) - return as-is
    return key;
  }, []);

  // Loading
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Not found
  if (!order) {
    return <NotFoundState />;
  }

  const isCancelled = currentStatus === "cancelled";
  const isReady = currentStatus === "ready" || currentStatus === "delivered";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="sticky top-0 z-10 glass border-b border-border/50 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full"
            onClick={() => {
              if (order?.table_id) {
                navigate(`/order/${order.table_id}`);
              } else {
                navigate(-1);
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          {order.table_number && (
            <Badge variant="outline" className="rounded-full">
              <UtensilsCrossed className="h-3 w-3 mr-1" />
              Mesa {order.table_number}
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-6 pb-8">
        {/* Order Number Card */}
        <Card className="border-border/50 overflow-hidden">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
              Número do Pedido
            </p>
            <p className="text-5xl font-black text-primary">#{order.order_number}</p>
            {order.customer_name && (
              <p className="text-sm text-muted-foreground mt-2">{order.customer_name}</p>
            )}
          </div>
        </Card>

        {/* Status Timeline */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Progress bar */}
              <Progress
                value={progressPercentage}
                className={cn(
                  "h-2",
                  isCancelled && "[&>div]:bg-destructive"
                )}
              />

              {/* Status steps */}
              <div className="flex justify-between items-center">
                <StatusStep
                  label="Pendente"
                  icon={Clock}
                  isActive={currentStatus === "pending"}
                  isCompleted={progressPercentage > 0}
                  isCancelled={isCancelled}
                />
                <div className="flex-1 h-0.5 bg-border mx-2" />
                <StatusStep
                  label="Preparando"
                  icon={ChefHat}
                  isActive={currentStatus === "preparing"}
                  isCompleted={progressPercentage >= 50}
                  isCancelled={isCancelled}
                />
                <div className="flex-1 h-0.5 bg-border mx-2" />
                <StatusStep
                  label="Pronto"
                  icon={CheckCircle2}
                  isActive={isReady}
                  isCompleted={isReady}
                  isCancelled={isCancelled}
                />
              </div>

              {/* Current status message */}
              <div
                className={cn(
                  "text-center p-4 rounded-xl",
                  isCancelled && "bg-destructive/10",
                  currentStatus === "pending" && "bg-muted",
                  currentStatus === "preparing" && "bg-primary/10",
                  isReady && "bg-primary/20"
                )}
              >
                {isCancelled ? (
                  <>
                    <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                    <p className="font-semibold text-destructive">Pedido Cancelado</p>
                  </>
                ) : isReady ? (
                  <>
                    <Sparkles className="h-8 w-8 text-primary mx-auto mb-2 animate-pulse" />
                    <p className="font-semibold text-primary">Seu pedido está pronto!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.channel === "table"
                        ? "Já estamos levando até você!"
                        : "Pode retirar no balcão"}
                    </p>
                  </>
                ) : currentStatus === "preparing" ? (
                  <>
                    <ChefHat className="h-8 w-8 text-primary mx-auto mb-2 animate-bounce" />
                    <p className="font-semibold">Preparando seu pedido...</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tempo estimado: 15-20 min
                    </p>
                  </>
                ) : (
                  <>
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="font-semibold">Pedido recebido!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Aguardando início do preparo
                    </p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pix Payment Section */}
        {pixCode && !isCancelled && (
          <Card className="border-2 border-emerald-500/30 overflow-hidden shadow-lg">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white">
              <div className="flex items-center justify-center gap-2">
                <div className="p-2 bg-white/20 rounded-full">
                  <QrCode className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">PAGUE COM PIX</h3>
              </div>
            </div>

            <CardContent className="pt-6 space-y-5">
              {/* QR Code */}
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-2xl shadow-md border-2 border-emerald-100">
                  <QRCodeSVG
                    value={pixCode}
                    size={200}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              </div>

              {/* Total */}
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground mb-1">Valor a pagar</p>
                <p className="text-4xl font-black text-emerald-600">
                  {formatCurrency(order.total_price)}
                </p>
              </div>

              {/* Pix Copia e Cola Section */}
              <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-3">
                  <Copy className="h-4 w-4 text-emerald-600" />
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
                    PIX COPIA E COLA
                  </span>
                </div>
                
                {/* Clickable code area */}
                <button
                  onClick={handleCopyPix}
                  className="w-full p-4 bg-white dark:bg-background rounded-lg border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-all active:scale-[0.99] group"
                >
                  <div className="max-h-24 overflow-y-auto">
                    <p className="text-xs font-mono text-muted-foreground break-all text-left leading-relaxed">
                      {pixCode}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-center gap-2 text-emerald-600 font-medium">
                    <Copy className="h-4 w-4 group-hover:animate-pulse" />
                    <span className="text-sm">Toque para copiar</span>
                  </div>
                </button>
              </div>

              {/* Main copy button */}
              <Button
                onClick={handleCopyPix}
                className="w-full h-14 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-lg font-semibold shadow-lg shadow-emerald-500/25"
              >
                <Copy className="h-5 w-5 mr-2" />
                Copiar código Pix
              </Button>

              {/* Beneficiary info */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                  Dados do beneficiário
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Nome:</span>
                  <span className="text-sm font-medium">
                    {unitSettings?.pix_merchant_name || unitInfo?.name || "RESTAURANTE"}
                  </span>
                </div>
                {unitSettings?.pix_key && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Chave:</span>
                    <span className="text-sm font-mono">
                      {formatPixKey(unitSettings.pix_key)}
                    </span>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <p className="text-xs text-center text-muted-foreground">
                Abra o app do seu banco, escolha Pix e cole o código ou escaneie o QR Code
              </p>
            </CardContent>
          </Card>
        )}

        {/* Order Items */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" />
              Itens do Pedido
            </h3>

            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="h-6 w-6 p-0 justify-center">
                      {item.quantity}
                    </Badge>
                    <span className="text-sm">{item.product_name}</span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatCurrency(item.total_price)}
                  </span>
                </div>
              ))}

              <Separator className="my-3" />

              <div className="flex justify-between items-center font-bold">
                <span>Total</span>
                <span className="text-primary text-lg">
                  {formatCurrency(order.total_price)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Restaurant info */}
        {unitInfo && (
          <div className="text-center text-sm text-muted-foreground">
            <p className="font-medium">{unitInfo.name}</p>
            {unitInfo.address && <p>{unitInfo.address}</p>}
          </div>
        )}
      </main>
    </div>
  );
}
