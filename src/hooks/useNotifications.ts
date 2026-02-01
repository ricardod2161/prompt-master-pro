import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnit } from "@/contexts/UnitContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { toast } from "sonner";

export interface Notification {
  id: string;
  unit_id: string | null;
  user_id: string | null;
  title: string;
  message: string;
  type: string;
  category: string;
  read: boolean;
  action_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export function useNotifications() {
  const { selectedUnit } = useUnit();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications
  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ["notifications", selectedUnit?.id, user?.id],
    queryFn: async (): Promise<Notification[]> => {
      if (!selectedUnit?.id) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(`unit_id.eq.${selectedUnit.id},user_id.eq.${user?.id}`)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as Notification[];
    },
    enabled: !!selectedUnit?.id,
    staleTime: 10000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!selectedUnit?.id) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          
          // Check if this notification is for our unit or user
          if (
            newNotification.unit_id === selectedUnit.id ||
            newNotification.user_id === user?.id
          ) {
            // Show toast for new notification
            toast(newNotification.title, {
              description: newNotification.message,
              action: newNotification.action_url
                ? {
                    label: "Ver",
                    onClick: () => {
                      window.location.href = newNotification.action_url!;
                    },
                  }
                : undefined,
            });

            // Invalidate query to refetch
            queryClient.invalidateQueries({
              queryKey: ["notifications", selectedUnit?.id, user?.id],
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUnit?.id, user?.id, queryClient]);

  // Unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", selectedUnit?.id, user?.id],
      });
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUnit?.id) return;

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .or(`unit_id.eq.${selectedUnit.id},user_id.eq.${user?.id}`)
        .eq("read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", selectedUnit?.id, user?.id],
      });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", selectedUnit?.id, user?.id],
      });
    },
  });

  // Create notification helper
  const createNotification = async (params: {
    title: string;
    message: string;
    type?: string;
    category?: string;
    action_url?: string;
    metadata?: Record<string, string | number | boolean>;
  }) => {
    if (!selectedUnit?.id) return;

    const { error } = await supabase.from("notifications").insert([{
      unit_id: selectedUnit.id,
      user_id: user?.id,
      title: params.title,
      message: params.message,
      type: params.type || "info",
      category: params.category || "system",
      action_url: params.action_url,
      metadata: (params.metadata || {}) as Record<string, string | number | boolean>,
    }]);

    if (error) throw error;
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    refetch,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    createNotification,
    isMarkingRead: markAsReadMutation.isPending,
    isMarkingAllRead: markAllAsReadMutation.isPending,
  };
}
