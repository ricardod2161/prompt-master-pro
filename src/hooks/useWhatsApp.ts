import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnit } from "@/contexts/UnitContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export interface WhatsAppSettings {
  id: string;
  unit_id: string;
  api_url: string | null;
  api_token: string | null;
  instance_name: string | null;
  bot_enabled: boolean | null;
  welcome_message: string | null;
  system_prompt: string | null;
  settings_password: string | null;
  tts_mode: string | null;
  tts_voice_id: string | null;
  elevenlabs_api_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConversation {
  id: string;
  unit_id: string;
  phone: string;
  customer_name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  is_bot_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// BUG FIX: removed unused `toast` and `queryClient` from useWhatsAppSettings
export function useWhatsAppSettings() {
  const { selectedUnit } = useUnit();

  const query = useQuery({
    queryKey: ["whatsapp-settings", selectedUnit?.id],
    queryFn: async () => {
      if (!selectedUnit?.id) return null;

      const { data, error } = await supabase
        .from("whatsapp_settings")
        .select("*")
        .eq("unit_id", selectedUnit.id)
        .maybeSingle();

      if (error) throw error;
      return data as WhatsAppSettings | null;
    },
    enabled: !!selectedUnit?.id,
  });

  return query;
}

export function useCreateWhatsAppSettings() {
  const { selectedUnit } = useUnit();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<WhatsAppSettings>) => {
      if (!selectedUnit?.id) throw new Error("Unidade não selecionada");

      // BUG FIX: use upsert with onConflict to avoid duplicate key error
      // when saving Bot before API settings
      const { data, error } = await supabase
        .from("whatsapp_settings")
        .upsert(
          {
            unit_id: selectedUnit.id,
            ...settings,
          },
          { onConflict: "unit_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-settings"] });
      toast({
        title: "Configurações salvas",
        description: "As configurações do WhatsApp foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
    },
  });
}

export function useUpdateWhatsAppSettings() {
  const { selectedUnit } = useUnit();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...settings
    }: Partial<WhatsAppSettings> & { id: string }) => {
      const { data, error } = await supabase
        .from("whatsapp_settings")
        .update(settings)
        .eq("id", id)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-settings"] });
      toast({
        title: "Configurações atualizadas",
        description: "As configurações do WhatsApp foram atualizadas.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: error.message,
      });
    },
  });
}

export function useWhatsAppConversations() {
  const { selectedUnit } = useUnit();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["whatsapp-conversations", selectedUnit?.id],
    queryFn: async () => {
      if (!selectedUnit?.id) return [];

      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .eq("unit_id", selectedUnit.id)
        .order("last_message_at", { ascending: false });

      if (error) throw error;
      return data as WhatsAppConversation[];
    },
    enabled: !!selectedUnit?.id,
  });

  // BUG FIX: scoped channel name to unit to prevent cross-unit/cross-tab conflicts
  useEffect(() => {
    if (!selectedUnit?.id) return;

    const channel = supabase
      .channel(`whatsapp-conversations-${selectedUnit.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whatsapp_conversations",
          filter: `unit_id=eq.${selectedUnit.id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["whatsapp-conversations", selectedUnit.id],
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUnit?.id, queryClient]);

  return query;
}

export function useToggleBotForConversation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      isBotActive,
    }: {
      conversationId: string;
      isBotActive: boolean;
    }) => {
      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .update({ is_bot_active: isBotActive })
        .eq("id", conversationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-conversations"] });
      toast({
        title: data.is_bot_active ? "Bot ativado" : "Bot desativado",
        description: `O bot foi ${data.is_bot_active ? "ativado" : "desativado"} para esta conversa.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    },
  });
}

export function useTestConnection() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      apiUrl,
      apiToken,
      instanceName,
    }: {
      apiUrl: string;
      apiToken: string;
      instanceName: string;
    }) => {
      // Test connection via edge function to avoid CORS issues
      const response = await supabase.functions.invoke("test-evolution-connection", {
        body: { apiUrl, apiToken, instanceName },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao testar conexão");
      }

      const result = response.data;
      
      if (!result.success) {
        throw new Error(result.error || "Falha ao conectar com a Evolution API");
      }

      return result.data;
    },
    onSuccess: (data) => {
      toast({
        title: "Conexão estabelecida",
        description: `Status: ${data?.instance?.state || "conectado"}`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro de conexão",
        description: error.message,
      });
    },
  });
}

export function useWhatsAppTodayStats(unitId: string | undefined) {
  return useQuery({
    queryKey: ["whatsapp-today-stats", unitId],
    queryFn: async () => {
      if (!unitId) return { messagesToday: 0, conversationsToday: 0 };

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const [messagesResult, conversationsResult] = await Promise.all([
        supabase
          .from("whatsapp_messages")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startOfToday.toISOString())
          .in(
            "conversation_id",
            (
              await supabase
                .from("whatsapp_conversations")
                .select("id")
                .eq("unit_id", unitId)
            ).data?.map((c) => c.id) || []
          ),
        supabase
          .from("whatsapp_conversations")
          .select("id", { count: "exact", head: true })
          .eq("unit_id", unitId)
          .gte("created_at", startOfToday.toISOString()),
      ]);

      return {
        messagesToday: messagesResult.count ?? 0,
        conversationsToday: conversationsResult.count ?? 0,
      };
    },
    enabled: !!unitId,
    refetchInterval: 60_000, // refresh every minute
  });
}
