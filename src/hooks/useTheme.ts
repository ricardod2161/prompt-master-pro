import { useEffect, useCallback } from "react";
import { useTheme as useNextTheme } from "next-themes";
import { useUnitSettings } from "@/hooks/useUnitSettings";

export interface ThemeColors {
  primary_color: string;
  accent_color: string;
  success_color: string;
  warning_color: string;
  error_color: string;
  sidebar_color?: string;
}

const DEFAULT_COLORS: ThemeColors = {
  primary_color: "142 76% 36%",
  accent_color: "217 91% 60%",
  success_color: "142 76% 36%",
  warning_color: "38 92% 50%",
  error_color: "0 84% 60%",
};

export function useTheme() {
  const { settings } = useUnitSettings();
  const { theme, setTheme: setNextTheme, resolvedTheme } = useNextTheme();

  // Apply colors to CSS variables
  const applyColors = useCallback((colors: ThemeColors) => {
    const root = document.documentElement;
    
    // Primary color
    if (colors.primary_color) {
      root.style.setProperty("--primary", colors.primary_color);
      root.style.setProperty("--ring", colors.primary_color);
      root.style.setProperty("--sidebar-primary", colors.primary_color);
      root.style.setProperty("--sidebar-ring", colors.primary_color);
    }
    
    // Accent color (used for info/preparing status)
    if (colors.accent_color) {
      root.style.setProperty("--status-info", colors.accent_color);
      root.style.setProperty("--status-preparing", colors.accent_color);
    }
    
    // Success color
    if (colors.success_color) {
      root.style.setProperty("--status-success", colors.success_color);
      root.style.setProperty("--status-ready", colors.success_color);
    }
    
    // Warning color
    if (colors.warning_color) {
      root.style.setProperty("--status-warning", colors.warning_color);
      root.style.setProperty("--status-pending", colors.warning_color);
    }
    
    // Error color
    if (colors.error_color) {
      root.style.setProperty("--status-error", colors.error_color);
    }
    
    // Sidebar color (optional)
    if (colors.sidebar_color) {
      root.style.setProperty("--sidebar-background", colors.sidebar_color);
    }
  }, []);

  // Reset colors to defaults
  const resetColors = useCallback(() => {
    const root = document.documentElement;
    
    // Remove custom properties to fallback to CSS defaults
    root.style.removeProperty("--primary");
    root.style.removeProperty("--ring");
    root.style.removeProperty("--sidebar-primary");
    root.style.removeProperty("--sidebar-ring");
    root.style.removeProperty("--status-info");
    root.style.removeProperty("--status-preparing");
    root.style.removeProperty("--status-success");
    root.style.removeProperty("--status-ready");
    root.style.removeProperty("--status-warning");
    root.style.removeProperty("--status-pending");
    root.style.removeProperty("--status-error");
    root.style.removeProperty("--sidebar-background");
  }, []);

  // Apply theme mode
  const setThemeMode = useCallback((mode: "light" | "dark") => {
    setNextTheme(mode);
  }, [setNextTheme]);

  // Apply colors from settings when they load
  useEffect(() => {
    if (settings) {
      const colors: ThemeColors = {
        primary_color: settings.primary_color || DEFAULT_COLORS.primary_color,
        accent_color: settings.accent_color || DEFAULT_COLORS.accent_color,
        success_color: settings.success_color || DEFAULT_COLORS.success_color,
        warning_color: settings.warning_color || DEFAULT_COLORS.warning_color,
        error_color: settings.error_color || DEFAULT_COLORS.error_color,
        sidebar_color: settings.sidebar_color,
      };
      applyColors(colors);

      // Apply dark mode setting
      if (settings.dark_mode_enabled !== undefined) {
        setNextTheme(settings.dark_mode_enabled ? "dark" : "light");
      }
    }
  }, [settings, applyColors, setNextTheme]);

  return {
    theme,
    resolvedTheme,
    setThemeMode,
    applyColors,
    resetColors,
    isDarkMode: resolvedTheme === "dark",
    defaultColors: DEFAULT_COLORS,
  };
}
