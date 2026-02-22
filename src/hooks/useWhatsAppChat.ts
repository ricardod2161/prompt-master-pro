import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnit } from "@/contexts/UnitContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import type { ChatMessage } from "@/components/whatsapp/ChatBubble";

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

export interface TypingStatus {
  conversation_id: string;
  is_typing: boolean;
  is_recording: boolean;
}

export function useWhatsAppChat(conversationId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [typingStatus, setTypingStatus] = useState<TypingStatus | null>(null);

  // Fetch messages for a conversation
  const messagesQuery = useQuery({
    queryKey: ["whatsapp-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];

      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      return (data || []).map((msg): ChatMessage => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        created_at: msg.created_at,
        status: (msg as any).status || "sent",
        media_type: (msg as any).media_type || "text",
        media_url: (msg as any).media_url,
        media_duration: (msg as any).media_duration,
        media_caption: (msg as any).media_caption,
        transcription: (msg as any).transcription,
      }));
    },
    enabled: !!conversationId,
    refetchInterval: 5000, // Poll every 5 seconds as backup
  });

  // Fetch typing status
  const typingQuery = useQuery({
    queryKey: ["whatsapp-typing", conversationId],
    queryFn: async () => {
      if (!conversationId) return null;

      const { data, error } = await supabase
        .from("whatsapp_typing_status")
        .select("*")
        .eq("conversation_id", conversationId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        // Check if typing status has expired
        const expiresAt = new Date((data as any).expires_at);
        if (expiresAt < new Date()) {
          return null;
        }
        return {
          conversation_id: data.conversation_id,
          is_typing: data.is_typing || false,
          is_recording: data.is_recording || false,
        };
      }
      return null;
    },
    enabled: !!conversationId,
    refetchInterval: 3000,
  });

  // Setup realtime subscriptions
  useEffect(() => {
    if (!conversationId) return;

    // Subscribe to messages changes
    const messagesChannel = supabase
      .channel(`whatsapp-messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whatsapp_messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["whatsapp-messages", conversationId],
          });
        }
      )
      .subscribe();

    // Subscribe to typing status changes
    const typingChannel = supabase
      .channel(`whatsapp-typing-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "whatsapp_typing_status",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object") {
            const newData = payload.new as any;
            setTypingStatus({
              conversation_id: newData.conversation_id,
              is_typing: newData.is_typing || false,
              is_recording: newData.is_recording || false,
            });
          } else {
            setTypingStatus(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(typingChannel);
    };
  }, [conversationId, queryClient]);

  // Update typing status from query
  useEffect(() => {
    if (typingQuery.data) {
      setTypingStatus(typingQuery.data);
    }
  }, [typingQuery.data]);

  // Send message mutation (for manual messages from admin)
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversationId) throw new Error("No conversation selected");

      // This would need to integrate with Evolution API to actually send the message
      // For now, just insert into database as assistant message
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .insert({
          conversation_id: conversationId,
          role: "assistant",
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["whatsapp-messages", conversationId],
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro ao enviar mensagem",
        description: error.message,
      });
    },
  });

  return {
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    isTyping: typingStatus?.is_typing || false,
    isRecording: typingStatus?.is_recording || false,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
    refetch: messagesQuery.refetch,
  };
}

// Hook for managing conversations list with realtime
export function useWhatsAppConversationsRealtime() {
  const { selectedUnit } = useUnit();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["whatsapp-conversations-rt", selectedUnit?.id],
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
      .channel("whatsapp-conversations-rt")
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
            queryKey: ["whatsapp-conversations-rt", selectedUnit.id],
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
