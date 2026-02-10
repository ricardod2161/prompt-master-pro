import { useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import type { Order } from "@/hooks/useOrders";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useUnitSettings } from "@/hooks/useUnitSettings";

// Thermal printer bridge URL (local service)
const PRINTER_API_URL = "http://localhost:3001";

interface PrintTicketData {
  orderNumber: number;
  customerName: string | null;
  channel: string;
  items: {
    name: string;
    quantity: number;
    notes?: string | null;
  }[];
  notes?: string | null;
  createdAt: string;
  tableNumber?: number | null;
  deliveryAddress?: string | null;
}

// Format ticket as text for thermal printer (58mm or 80mm)
function formatTicketText(data: PrintTicketData): string {
  const divider = "=".repeat(24);
  const thinDivider = "-".repeat(24);
  
  let ticket = "";
  
  // Header
  ticket += `${divider}\n`;
  ticket += `    COMANDA #${data.orderNumber}\n`;
  ticket += `${divider}\n`;
  
  // Date/Time
  ticket += `Data: ${format(new Date(data.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}\n`;
  
  // Channel
  const channelLabels: Record<string, string> = {
    counter: "BALCAO",
    table: "MESA",
    delivery: "DELIVERY",
    whatsapp: "WHATSAPP",
  };
  ticket += `Canal: ${channelLabels[data.channel] || data.channel.toUpperCase()}\n`;
  
  // Customer
  if (data.customerName) {
    ticket += `Cliente: ${data.customerName}\n`;
  }
  
  // Table number
  if (data.tableNumber) {
    ticket += `Mesa: ${data.tableNumber}\n`;
  }
  
  // Delivery address
  if (data.deliveryAddress) {
    ticket += `${thinDivider}\n`;
    ticket += `    ** ENDERECO **\n`;
    ticket += `${data.deliveryAddress}\n`;
  }
  
  ticket += `${thinDivider}\n`;
  ticket += `     ** ITENS **\n`;
  ticket += `${thinDivider}\n`;
  
  // Items
  data.items.forEach((item) => {
    ticket += `${item.quantity}x ${item.name}\n`;
    if (item.notes) {
      ticket += `   > ${item.notes}\n`;
    }
  });
  
  // Order notes
  if (data.notes) {
    ticket += `${thinDivider}\n`;
    ticket += `OBS: ${data.notes}\n`;
  }
  
  ticket += `${divider}\n`;
  ticket += `   *** PREPARAR ***\n`;
  ticket += `${divider}\n\n\n`;
  
  return ticket;
}

// Try to print via thermal printer bridge
async function printViaBridge(ticketText: string): Promise<boolean> {
  try {
    const response = await fetch(`${PRINTER_API_URL}/print`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: ticketText }),
    });
    
    if (response.ok) {
      return true;
    }
    return false;
  } catch {
    // Bridge not available
    return false;
  }
}

// Fallback: open print dialog
function printViaBrowser(ticketText: string, orderNumber: number): void {
  const printWindow = window.open("", "_blank", "width=400,height=600");
  if (!printWindow) {
    toast({
      title: "Erro ao imprimir",
      description: "Pop-up bloqueado. Permita pop-ups para imprimir.",
      variant: "destructive",
    });
    return;
  }
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Comanda #${orderNumber}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            font-size: 13px;
            line-height: 1.4;
            padding: 4px;
            margin: 0 auto;
            max-width: 48mm;
            box-sizing: border-box;
          }
          pre {
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-wrap: break-word;
            margin: 0;
            font-size: inherit;
          }
          @media print {
            @page { margin: 1mm; }
            body { 
              padding: 0;
              font-size: 12px;
              max-width: 100%;
            }
          }
        </style>
      </head>
      <body>
        <pre>${ticketText}</pre>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}

export function usePrintOrder() {
  const { settings } = useUnitSettings();
  
  const printKitchenTicket = useCallback(async (order: Order, showToast = true) => {
    const ticketData: PrintTicketData = {
      orderNumber: order.order_number,
      customerName: order.customer_name,
      channel: order.channel,
      items: order.order_items?.map((item) => ({
        name: item.product_name,
        quantity: item.quantity,
        notes: item.notes,
      })) || [],
      notes: order.notes,
      createdAt: order.created_at,
      tableNumber: order.table?.number,
      deliveryAddress: order.delivery_order?.address || null,
    };
    
    const ticketText = formatTicketText(ticketData);
    
    // Try thermal printer bridge first
    const bridgeSuccess = await printViaBridge(ticketText);
    
    if (bridgeSuccess) {
      if (showToast) {
        toast({
          title: "Comanda impressa",
          description: `Pedido #${order.order_number} enviado para impressora`,
        });
      }
      return true;
    }
    
    // Fallback to browser print
    printViaBrowser(ticketText, order.order_number);
    return true;
  }, []);
  
  // Auto-print when status changes to preparing (if enabled in settings)
  const printOnPreparing = useCallback(async (order: Order, newStatus: string, previousStatus: string | null) => {
    // Check if auto-print is enabled (default to true for backwards compatibility)
    const autoPrintEnabled = settings?.auto_print_enabled ?? true;
    
    if (!autoPrintEnabled) {
      return; // Auto-print disabled, skip silently
    }
    
    if (newStatus === "preparing" && previousStatus !== "preparing") {
      await printKitchenTicket(order, true);
    }
  }, [printKitchenTicket, settings?.auto_print_enabled]);
  
  return {
    printKitchenTicket,
    printOnPreparing,
  };
}
