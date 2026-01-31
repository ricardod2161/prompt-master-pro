import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUnit } from "@/contexts/UnitContext";
import type { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products"> & {
  category?: Tables<"categories"> | null;
};

export function useProducts() {
  const { selectedUnit } = useUnit();

  return useQuery({
    queryKey: ["products", selectedUnit?.id],
    queryFn: async () => {
      if (!selectedUnit?.id) return [];

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*)
        `)
        .eq("unit_id", selectedUnit.id)
        .eq("available", true)
        .order("name");

      if (error) throw error;
      return data as Product[];
    },
    enabled: !!selectedUnit?.id,
  });
}

export function useCategories() {
  const { selectedUnit } = useUnit();

  return useQuery({
    queryKey: ["categories", selectedUnit?.id],
    queryFn: async () => {
      if (!selectedUnit?.id) return [];

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("unit_id", selectedUnit.id)
        .eq("active", true)
        .order("sort_order");

      if (error) throw error;
      return data;
    },
    enabled: !!selectedUnit?.id,
  });
}
