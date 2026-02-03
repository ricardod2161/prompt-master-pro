import { useState, useRef } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import {
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Download,
  Printer,
  Smartphone,
  Utensils,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface TableQRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableNumber: number | null;
  qrCode: string | null;
  restaurantName?: string;
}

export function TableQRCodeDialog({
  open,
  onOpenChange,
  tableNumber,
  qrCode,
  restaurantName = "Restaurante",
}: TableQRCodeDialogProps) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handleCopy = async () => {
    if (qrCode) {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast({ title: "Link copiado!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPNG = () => {
    const canvas = document.getElementById("qr-canvas-download") as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement("a");
      link.download = `mesa-${tableNumber}-qrcode.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
      toast({ title: "QR Code PNG baixado!" });
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ title: "Erro ao abrir janela de impressão", variant: "destructive" });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code Mesa ${tableNumber}</title>
          <style>
            @page { 
              size: 80mm 120mm; 
              margin: 0; 
            }
            body { 
              margin: 0; 
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
              background: #fff;
            }
            .ticket {
              width: 72mm;
              padding: 4mm;
              text-align: center;
              background: white;
              border: 1px dashed #e5e7eb;
              border-radius: 8px;
            }
            .header {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              margin-bottom: 3mm;
              padding-bottom: 3mm;
              border-bottom: 1px dashed #e5e7eb;
            }
            .header svg {
              width: 18px;
              height: 18px;
            }
            .header span {
              font-size: 14px;
              font-weight: 600;
              color: #1f2937;
            }
            .qr-container {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              padding: 4mm;
              border-radius: 8px;
              margin-bottom: 3mm;
              display: inline-block;
            }
            .qr-container canvas, .qr-container svg {
              display: block;
            }
            .table-number {
              font-size: 22px;
              font-weight: 800;
              color: #0f172a;
              margin: 3mm 0 1mm 0;
              letter-spacing: -0.5px;
            }
            .instruction {
              font-size: 11px;
              color: #64748b;
              margin-bottom: 3mm;
              line-height: 1.4;
            }
            .highlight {
              background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
              color: white;
              padding: 2mm 3mm;
              border-radius: 6px;
              font-size: 10px;
              font-weight: 600;
              margin-bottom: 3mm;
              display: inline-block;
            }
            .footer {
              margin-top: 3mm;
              padding-top: 3mm;
              border-top: 1px dashed #e5e7eb;
              font-size: 9px;
              color: #94a3b8;
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
              </svg>
              <span>${restaurantName}</span>
            </div>
            <div class="qr-container">
              ${document.getElementById("qr-svg-print")?.innerHTML || ""}
            </div>
            <div class="table-number">Mesa ${tableNumber}</div>
            <div class="instruction">
              Escaneie o QR Code com a câmera do seu celular para acessar o cardápio e fazer seu pedido!
            </div>
            <div class="highlight">
              📱 Atendimento Digital
            </div>
            <div class="footer">
              Pedido rápido • Sem filas • Sem complicação
            </div>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const handleOpenLink = () => {
    if (qrCode) {
      window.open(qrCode, "_blank");
    }
  };

  if (!qrCode || tableNumber === null) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <QrCode className="h-5 w-5 text-primary" />
            </div>
            QR Code - Mesa {tableNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* QR Code Preview - Glassmorphism */}
          <div className="relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-inner border border-border/50">
            {/* Decorative elements */}
            <div className="absolute top-3 left-3 w-12 h-12 bg-primary/5 rounded-full blur-xl" />
            <div className="absolute bottom-3 right-3 w-16 h-16 bg-primary/5 rounded-full blur-xl" />
            
            <div className="relative flex flex-col items-center">
              {/* Real QR Code */}
              <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-100">
                <QRCodeSVG
                  id="qr-svg-display"
                  value={qrCode}
                  size={180}
                  level="H"
                  includeMargin={false}
                  bgColor="#FFFFFF"
                  fgColor="#0f172a"
                />
              </div>

              {/* Table info below QR */}
              <div className="mt-4 text-center">
                <h3 className="text-xl font-bold text-foreground">
                  Mesa {tableNumber}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5" />
                  Escaneie para fazer pedido
                </p>
              </div>
            </div>
          </div>

          {/* Hidden QR elements for print and download */}
          <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
            <div id="qr-svg-print">
              <QRCodeSVG
                value={qrCode}
                size={150}
                level="H"
                includeMargin={false}
                bgColor="#FFFFFF"
                fgColor="#0f172a"
              />
            </div>
            <QRCodeCanvas
              id="qr-canvas-download"
              value={qrCode}
              size={400}
              level="H"
              includeMargin={true}
              bgColor="#FFFFFF"
              fgColor="#0f172a"
            />
          </div>

          {/* Link with copy */}
          <div className="flex gap-2">
            <Input
              value={qrCode}
              readOnly
              className="flex-1 text-xs sm:text-sm font-mono bg-muted/50 truncate"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className={cn(
                    "shrink-0 transition-colors",
                    copied && "text-emerald-500 border-emerald-500 bg-emerald-500/10"
                  )}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{copied ? "Copiado!" : "Copiar Link"}</TooltipContent>
            </Tooltip>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleOpenLink}
              className="h-11 gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden xs:inline">Abrir</span> Link
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPNG}
              className="h-11 gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden xs:inline">Baixar</span> PNG
            </Button>
          </div>

          {/* Print Button - Full Width */}
          <Button
            onClick={handlePrint}
            className="w-full h-11 gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
          >
            <Printer className="h-4 w-4" />
            Imprimir Ticket para Mesa
          </Button>

          {/* Help Text */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border/50">
            <Utensils className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Imprima e coloque na mesa. Seus clientes podem escanear para acessar 
              o cardápio digital e fazer pedidos diretamente pelo celular.
            </p>
          </div>
        </div>

        {/* Print template (hidden) */}
        <div ref={printRef} style={{ display: "none" }} />
      </DialogContent>
    </Dialog>
  );
}
