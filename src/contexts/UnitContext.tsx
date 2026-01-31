import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUnits = async () => {
    if (!user) {
      setUnits([]);
      setSelectedUnit(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("units")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching units:", error);
      setUnits([]);
    } else {
      setUnits(data || []);
      
      // Try to restore selected unit from localStorage
      const savedUnitId = localStorage.getItem("selectedUnitId");
      if (savedUnitId && data) {
        const savedUnit = data.find((u) => u.id === savedUnitId);
        if (savedUnit) {
          setSelectedUnit(savedUnit);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUnits();
  }, [user]);

  useEffect(() => {
    // Persist selected unit
    if (selectedUnit) {
      localStorage.setItem("selectedUnitId", selectedUnit.id);
    } else {
      localStorage.removeItem("selectedUnitId");
    }
  }, [selectedUnit]);

  return (
    <UnitContext.Provider
      value={{
        units,
        selectedUnit,
        setSelectedUnit,
        loading,
        refetchUnits: fetchUnits,
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
