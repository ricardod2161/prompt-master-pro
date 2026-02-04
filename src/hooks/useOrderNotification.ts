import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnit } from "@/contexts/UnitContext";
import { toast } from "@/hooks/use-toast";

type NotificationStatus = "ready" | "delivering" | "delivered" | "confirmed" | "cancelled";

interface SendNotificationParams {
  orderId: string;
  status: NotificationStatus;
}

export function useOrderNotification() {
  const { selectedUnit } = useUnit();

  return useMutation({
    mutationFn: async ({ orderId, status }: SendNotificationParams) => {
      if (!selectedUnit?.id) {
        throw new Error("Unidade não selecionada");
      }

      const response = await supabase.functions.invoke("send-order-notification", {
        body: {
          orderId,
          status,
          unitId: selectedUnit.id,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao enviar notificação");
      }

      const result = response.data;

      // If skipped (no phone or WhatsApp not configured), don't throw error
      if (result.skipped) {
        console.log("Notification skipped:", result.error);
        return { success: false, skipped: true, reason: result.error };
      }

      if (!result.success) {
        throw new Error(result.error || "Falha ao enviar notificação");
      }

      return result;
    },
    onSuccess: (data) => {
      if (data.skipped) {
        // Silent skip - don't show toast
        return;
      }
      toast({
        title: "📱 Notificação enviada",
        description: "O cliente foi notificado via WhatsApp",
      });
    },
    onError: (error) => {
      console.error("Notification error:", error);
      // Only show toast for actual errors, not for missing phone/config
      toast({
        variant: "destructive",
        title: "Erro na notificação",
        description: error.message,
      });
    },
  });
}
