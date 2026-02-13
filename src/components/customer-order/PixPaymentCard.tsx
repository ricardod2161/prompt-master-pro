import { useState, useMemo, memo, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { generatePixCode } from "@/lib/pix-generator";

interface PixPaymentCardProps {
  pixKey: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  transactionId?: string;
  description?: string;
  className?: string;
}

export const PixPaymentCard = memo(function PixPaymentCard({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  transactionId,
  description,
  className,
}: PixPaymentCardProps) {
  const [copied, setCopied] = useState(false);

  const pixCode = useMemo(
    () =>
      generatePixCode({
        pixKey,
        merchantName,
        merchantCity,
        amount,
        transactionId,
        description,
      }),
    [pixKey, merchantName, merchantCity, amount, transactionId, description]
  );

  const formattedAmount = useMemo(
    () =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(amount),
    [amount]
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      if (navigator.vibrate) navigator.vibrate(100);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = pixCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }, [pixCode]);

  if (amount <= 0) return null;

  return (
    <div
      className={cn(
        "rounded-2xl p-5 space-y-4 border-2 border-emerald-500/30 bg-emerald-500/5 animate-fade-in",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <QrCode className="h-4 w-4 text-emerald-600" />
          </div>
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
            Pague com Pix
          </span>
        </div>
        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
          {formattedAmount}
        </span>
      </div>

      {/* QR Code */}
      <div className="flex justify-center">
        <div className="bg-white p-3 rounded-xl shadow-sm">
          <QRCodeSVG value={pixCode} size={180} level="M" />
        </div>
      </div>

      {/* Copy code button */}
      <button
        onClick={handleCopy}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200",
          copied
            ? "bg-emerald-500 text-white"
            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-[0.98]"
        )}
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Código Pix Copiado!
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copiar Código Pix
          </>
        )}
      </button>

      {/* Collapsible code preview */}
      <div
        onClick={handleCopy}
        className="cursor-pointer text-[10px] text-muted-foreground break-all leading-relaxed bg-background/60 rounded-lg p-3 max-h-16 overflow-y-auto border border-border/30"
      >
        {pixCode}
      </div>
    </div>
  );
});
