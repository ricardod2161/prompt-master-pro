import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface UserWithRoles {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: AppRole[];
  units: { id: string; name: string }[];
}

export function useUserManagement() {
  const queryClient = useQueryClient();

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<UserWithRoles[]> => {
      // Buscar todos os profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Buscar todas as roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Buscar todas as associações de unidades
      const { data: userUnits, error: unitsError } = await supabase
        .from("user_units")
        .select("user_id, unit_id, units(id, name)");

      if (unitsError) throw unitsError;

      // Combinar dados
      return (profiles || []).map((profile) => ({
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        roles: (roles || [])
          .filter((r) => r.user_id === profile.user_id)
          .map((r) => r.role),
        units: (userUnits || [])
          .filter((u) => u.user_id === profile.user_id)
          .map((u) => ({
            id: (u.units as any)?.id || u.unit_id,
            name: (u.units as any)?.name || "Unidade",
          })),
      }));
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role adicionada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao adicionar role: ${error.message}`);
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", role);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role removida com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao remover role: ${error.message}`);
    },
  });

  const assignUnitMutation = useMutation({
    mutationFn: async ({ userId, unitId }: { userId: string; unitId: string }) => {
      const { error } = await supabase
        .from("user_units")
        .insert({ user_id: userId, unit_id: unitId });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Usuário associado à unidade!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao associar unidade: ${error.message}`);
    },
  });

  const removeUnitMutation = useMutation({
    mutationFn: async ({ userId, unitId }: { userId: string; unitId: string }) => {
      const { error } = await supabase
        .from("user_units")
        .delete()
        .eq("user_id", userId)
        .eq("unit_id", unitId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Associação removida!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao remover associação: ${error.message}`);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async ({ userId, profileId }: { userId: string; profileId: string }) => {
      // Delete related data first
      await supabase.from("user_roles").delete().eq("user_id", userId);
      await supabase.from("user_units").delete().eq("user_id", userId);
      await supabase.from("notifications").delete().eq("user_id", userId);
      const { error } = await supabase.from("profiles").delete().eq("id", profileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      toast.success("Usuário excluído com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao excluir usuário: ${error.message}`);
    },
  });

  return {
    users: usersQuery.data || [],
    loading: usersQuery.isLoading,
    error: usersQuery.error,
    addRole: addRoleMutation.mutate,
    removeRole: removeRoleMutation.mutate,
    assignUnit: assignUnitMutation.mutate,
    removeUnit: removeUnitMutation.mutate,
    deleteUser: deleteUserMutation.mutate,
    isDeletingUser: deleteUserMutation.isPending,
    refetch: usersQuery.refetch,
  };
}
