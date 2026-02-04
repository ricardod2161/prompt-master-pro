import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnit } from "@/contexts/UnitContext";
import { toast } from "@/hooks/use-toast";

export interface OpeningHours {
  monday: { open: string; close: string; closed: boolean };
  tuesday: { open: string; close: string; closed: boolean };
  wednesday: { open: string; close: string; closed: boolean };
  thursday: { open: string; close: string; closed: boolean };
  friday: { open: string; close: string; closed: boolean };
  saturday: { open: string; close: string; closed: boolean };
  sunday: { open: string; close: string; closed: boolean };
}

export interface PaymentMethods {
  cash: boolean;
  credit: boolean;
  debit: boolean;
  pix: boolean;
  voucher: boolean;
}

export interface UnitSettings {
  id: string;
  unit_id: string;
  auto_print_enabled: boolean;
  auto_notify_enabled: boolean;
  delivery_enabled: boolean;
  table_ordering_enabled: boolean;
  counter_ordering_enabled: boolean;
  whatsapp_ordering_enabled: boolean;
  default_preparation_time: number;
  service_fee_percentage: number;
  delivery_fee: number;
  min_delivery_order: number;
  opening_hours: OpeningHours;
  timezone: string;
  currency: string;
  payment_methods: PaymentMethods;
  pix_key?: string | null;
  pix_merchant_name?: string | null;
  pix_merchant_city?: string | null;
  // Theme customization
  primary_color?: string;
  accent_color?: string;
  success_color?: string;
  warning_color?: string;
  error_color?: string;
  sidebar_color?: string;
  dark_mode_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_OPENING_HOURS: OpeningHours = {
  monday: { open: "08:00", close: "22:00", closed: false },
  tuesday: { open: "08:00", close: "22:00", closed: false },
  wednesday: { open: "08:00", close: "22:00", closed: false },
  thursday: { open: "08:00", close: "22:00", closed: false },
  friday: { open: "08:00", close: "23:00", closed: false },
  saturday: { open: "10:00", close: "23:00", closed: false },
  sunday: { open: "10:00", close: "20:00", closed: false },
};

const DEFAULT_PAYMENT_METHODS: PaymentMethods = {
  cash: true,
  credit: true,
  debit: true,
  pix: true,
  voucher: false,
};

export function useUnitSettings() {
  const { selectedUnit } = useUnit();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["unit-settings", selectedUnit?.id],
    queryFn: async () => {
      if (!selectedUnit) return null;
      
      const { data, error } = await supabase
        .from("unit_settings")
        .select("*")
        .eq("unit_id", selectedUnit.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        return {
          ...data,
          opening_hours: (data.opening_hours as unknown as OpeningHours) || DEFAULT_OPENING_HOURS,
          payment_methods: (data.payment_methods as unknown as PaymentMethods) || DEFAULT_PAYMENT_METHODS,
        } as UnitSettings;
      }
      
      return null;
    },
    enabled: !!selectedUnit,
  });

  const createSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<UnitSettings>) => {
      if (!selectedUnit) throw new Error("No unit selected");
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertData: any = {
        unit_id: selectedUnit.id,
        auto_print_enabled: settings.auto_print_enabled,
        auto_notify_enabled: settings.auto_notify_enabled,
        delivery_enabled: settings.delivery_enabled,
        table_ordering_enabled: settings.table_ordering_enabled,
        counter_ordering_enabled: settings.counter_ordering_enabled,
        whatsapp_ordering_enabled: settings.whatsapp_ordering_enabled,
        default_preparation_time: settings.default_preparation_time,
        service_fee_percentage: settings.service_fee_percentage,
        delivery_fee: settings.delivery_fee,
        min_delivery_order: settings.min_delivery_order,
        timezone: settings.timezone,
        currency: settings.currency,
      };
      
      if (settings.opening_hours) {
        insertData.opening_hours = settings.opening_hours;
      }
      if (settings.payment_methods) {
        insertData.payment_methods = settings.payment_methods;
      }
      
      const { data, error } = await supabase
        .from("unit_settings")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unit-settings", selectedUnit?.id] });
      toast({ title: "Configurações criadas", description: "As configurações foram salvas com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<UnitSettings>) => {
      if (!selectedUnit) throw new Error("No unit selected");
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = { ...settings };
      
      // JSONB fields need to be passed as-is
      if (settings.opening_hours) {
        updateData.opening_hours = settings.opening_hours;
      }
      if (settings.payment_methods) {
        updateData.payment_methods = settings.payment_methods;
      }
      
      const { data, error } = await supabase
        .from("unit_settings")
        .update(updateData)
        .eq("unit_id", selectedUnit.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unit-settings", selectedUnit?.id] });
      toast({ title: "Configurações atualizadas", description: "As alterações foram salvas com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const saveSettings = async (settings: Partial<UnitSettings>) => {
    if (query.data) {
      return updateSettingsMutation.mutateAsync(settings);
    } else {
      return createSettingsMutation.mutateAsync(settings);
    }
  };

  return {
    settings: query.data,
    isLoading: query.isLoading,
    error: query.error,
    saveSettings,
    isSaving: createSettingsMutation.isPending || updateSettingsMutation.isPending,
    refetch: query.refetch,
  };
}
