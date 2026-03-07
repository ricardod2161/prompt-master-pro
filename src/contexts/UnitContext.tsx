import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface Unit {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  cnpj: string | null;
}

interface UnitContextType {
  units: Unit[];
  selectedUnit: Unit | null;
  setSelectedUnit: (unit: Unit | null) => void;
  loading: boolean;
  refetchUnits: () => Promise<void>;
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export function UnitProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedUnit, setSelectedUnitState] = useState<Unit | null>(null);

  const { data: units = [], isLoading } = useQuery({
    queryKey: ['units', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("units")
        .select("*")
        .order("name");

      if (error) {
        console.error("Error fetching units:", error);
        throw error;
      }
      return (data || []) as Unit[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 min — units rarely change
  });

  // Restore selected unit from localStorage when units load
  useEffect(() => {
    if (units.length > 0 && !selectedUnit) {
      const savedUnitId = localStorage.getItem("selectedUnitId");
      if (savedUnitId) {
        const savedUnit = units.find((u) => u.id === savedUnitId);
        if (savedUnit) {
          setSelectedUnitState(savedUnit);
        }
      }
    }
  }, [units, selectedUnit]);

  // Clear units when user logs out
  useEffect(() => {
    if (!user) {
      setSelectedUnitState(null);
    }
  }, [user]);

  const setSelectedUnit = (unit: Unit | null) => {
    setSelectedUnitState(unit);
    if (unit) {
      localStorage.setItem("selectedUnitId", unit.id);
    } else {
      localStorage.removeItem("selectedUnitId");
    }
  };

  const refetchUnits = async () => {
    await queryClient.invalidateQueries({ queryKey: ['units', user?.id] });
  };

  return (
    <UnitContext.Provider
      value={{
        units,
        selectedUnit,
        setSelectedUnit,
        loading: isLoading,
        refetchUnits,
      }}
    >
      {children}
    </UnitContext.Provider>
  );
}

export function useUnit() {
  const context = useContext(UnitContext);
  if (context === undefined) {
    throw new Error("useUnit must be used within a UnitProvider");
  }
  return context;
}
