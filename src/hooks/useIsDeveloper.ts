import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useIsDeveloper() {
  const { user } = useAuth();
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkDeveloperRole() {
      if (!user) {
        setIsDeveloper(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "developer")
          .maybeSingle();

        if (error) {
          console.error("Error checking developer role:", error);
          setIsDeveloper(false);
        } else {
          setIsDeveloper(!!data);
        }
      } catch (err) {
        console.error("Error checking developer role:", err);
        setIsDeveloper(false);
      } finally {
        setLoading(false);
      }
    }

    checkDeveloperRole();
  }, [user]);

  return { isDeveloper, loading };
}
