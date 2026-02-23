import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnit } from "@/contexts/UnitContext";

export interface MarketingCredits {
  total_credits: number;
  used_credits: number;
  bonus_credits: number;
  available: number;
  reset_at: string | null;
}

export function useMarketingCredits() {
  const { selectedUnit } = useUnit();
  const queryClient = useQueryClient();

  const { data: credits, isLoading } = useQuery({
    queryKey: ["marketing-credits", selectedUnit?.id],
    queryFn: async (): Promise<MarketingCredits> => {
      if (!selectedUnit?.id) {
        return { total_credits: 3, used_credits: 0, bonus_credits: 0, available: 3, reset_at: null };
      }

      const { data, error } = await supabase
        .from("marketing_credits")
        .select("*")
        .eq("unit_id", selectedUnit.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // No record yet — they have 3 free credits
        return { total_credits: 3, used_credits: 0, bonus_credits: 0, available: 3, reset_at: null };
      }

      const available = (data.total_credits + data.bonus_credits) - data.used_credits;
      return {
        total_credits: data.total_credits,
        used_credits: data.used_credits,
        bonus_credits: data.bonus_credits,
        available: Math.max(0, available),
        reset_at: data.reset_at,
      };
    },
    enabled: !!selectedUnit?.id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["marketing-credits", selectedUnit?.id] });
  };

  return {
    credits: credits ?? { total_credits: 3, used_credits: 0, bonus_credits: 0, available: 3, reset_at: null },
    isLoading,
    invalidate,
  };
}
