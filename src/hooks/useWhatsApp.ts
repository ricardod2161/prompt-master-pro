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

export function useWhatsAppSettings() {
  const { selectedUnit } = useUnit();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

      const { data, error } = await supabase
        .from("whatsapp_settings")
        .insert({
          unit_id: selectedUnit.id,
          ...settings,
        })
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
        .single();

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

  // Setup realtime subscription
  useEffect(() => {
    if (!selectedUnit?.id) return;

    const channel = supabase
      .channel("whatsapp-conversations-realtime")
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
      // Test connection to Evolution API
      const response = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
        headers: {
          apikey: apiToken,
        },
      });

      if (!response.ok) {
        throw new Error("Falha ao conectar com a Evolution API");
      }

      const data = await response.json();
      return data;
    },
    onSuccess: (data) => {
      toast({
        title: "Conexão estabelecida",
        description: `Status: ${data.instance?.state || "conectado"}`,
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
