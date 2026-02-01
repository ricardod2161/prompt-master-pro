import { useState, useEffect } from "react";
import { Palette, RotateCcw, Save, Moon, Sun, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ColorPicker } from "./ColorPicker";
import { ColorPreviewCard } from "./ColorPreviewCard";
import { ColorPresets, ColorPreset } from "./ColorPresets";
import { useTheme, ThemeColors } from "@/hooks/useTheme";
import { useUnitSettings } from "@/hooks/useUnitSettings";
import { SettingCard } from "./SettingCard";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function AppearanceTab() {
  const { settings, saveSettings, isSaving } = useUnitSettings();
  const { applyColors, resetColors, isDarkMode, setThemeMode, defaultColors } = useTheme();
  
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [localColors, setLocalColors] = useState<ThemeColors>({
    primary_color: settings?.primary_color || defaultColors.primary_color,
    accent_color: settings?.accent_color || defaultColors.accent_color,
    success_color: settings?.success_color || defaultColors.success_color,
    warning_color: settings?.warning_color || defaultColors.warning_color,
    error_color: settings?.error_color || defaultColors.error_color,
    sidebar_color: settings?.sidebar_color,
  });
  const [localDarkMode, setLocalDarkMode] = useState(settings?.dark_mode_enabled ?? true);

  // Sync state when settings load
  useEffect(() => {
    if (settings) {
      setLocalColors({
        primary_color: settings.primary_color || defaultColors.primary_color,
        accent_color: settings.accent_color || defaultColors.accent_color,
        success_color: settings.success_color || defaultColors.success_color,
        warning_color: settings.warning_color || defaultColors.warning_color,
        error_color: settings.error_color || defaultColors.error_color,
        sidebar_color: settings.sidebar_color,
      });
      setLocalDarkMode(settings.dark_mode_enabled ?? true);
    }
  }, [settings, defaultColors]);

  // Apply colors in real-time for preview
  useEffect(() => {
    applyColors(localColors);
  }, [localColors, applyColors]);

  // Apply dark mode in real-time
  useEffect(() => {
    setThemeMode(localDarkMode ? "dark" : "light");
  }, [localDarkMode, setThemeMode]);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setLocalColors(prev => ({ ...prev, [key]: value }));
    setSelectedPreset(null); // Clear preset selection when manually changing colors
  };

  const handlePresetSelect = (preset: ColorPreset) => {
    setSelectedPreset(preset.name);
    setLocalColors({
      primary_color: preset.primary,
      accent_color: preset.accent,
      success_color: preset.success,
      warning_color: preset.warning,
      error_color: preset.error,
      sidebar_color: preset.sidebar,
    });
  };

  const handleSave = async () => {
    await saveSettings({
      ...localColors,
      dark_mode_enabled: localDarkMode,
    });
  };

  const handleReset = () => {
    setLocalColors(defaultColors);
    setLocalDarkMode(true);
    setSelectedPreset("Verde Padrão");
    resetColors();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Theme Mode */}
      <SettingCard
        icon={isDarkMode ? Moon : Sun}
        title="Tema Geral"
        description="Escolha entre modo claro ou escuro"
        variant="elevated"
      >
        <div 
          className={cn(
            "flex items-center justify-between p-4 rounded-xl border transition-all duration-300",
            localDarkMode 
              ? "bg-gradient-to-r from-primary/5 to-transparent border-primary/20" 
              : "bg-card/50 border-border/50"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-2.5 rounded-lg transition-all",
              localDarkMode 
                ? "bg-primary/15 text-primary" 
                : "bg-muted text-muted-foreground"
            )}>
              {localDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-medium">Modo Escuro</p>
              <p className="text-sm text-muted-foreground">
                Otimizado para ambientes com pouca luz
              </p>
            </div>
          </div>
          <Switch
            checked={localDarkMode}
            onCheckedChange={setLocalDarkMode}
            className="data-[state=checked]:bg-primary"
          />
        </div>
      </SettingCard>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Color Configuration */}
        <div className="space-y-6">
          {/* Color Presets */}
          <SettingCard
            icon={Sparkles}
            title="Paletas de Cores"
            description="Escolha uma paleta pronta ou personalize"
            variant="glass"
          >
            <ColorPresets
              selectedPreset={selectedPreset}
              onSelectPreset={handlePresetSelect}
            />
          </SettingCard>

          {/* Custom Colors */}
          <SettingCard
            icon={Palette}
            title="Personalizar Cores"
            description="Ajuste cada cor individualmente"
            variant="elevated"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <ColorPicker
                label="Cor Principal"
                description="Botões, links e destaques"
                value={localColors.primary_color}
                onChange={(v) => handleColorChange("primary_color", v)}
              />
              <ColorPicker
                label="Cor de Destaque"
                description="Status 'Preparando' e informações"
                value={localColors.accent_color}
                onChange={(v) => handleColorChange("accent_color", v)}
              />
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-4">
              <Label className="text-sm font-medium">Cores de Status</Label>
              <div className="grid gap-6 sm:grid-cols-3">
                <ColorPicker
                  label="Sucesso"
                  description="Concluído, pronto"
                  value={localColors.success_color}
                  onChange={(v) => handleColorChange("success_color", v)}
                />
                <ColorPicker
                  label="Alerta"
                  description="Pendente, atenção"
                  value={localColors.warning_color}
                  onChange={(v) => handleColorChange("warning_color", v)}
                />
                <ColorPicker
                  label="Erro"
                  description="Cancelado, problema"
                  value={localColors.error_color}
                  onChange={(v) => handleColorChange("error_color", v)}
                />
              </div>
            </div>

            <Separator className="my-4" />

            <ColorPicker
              label="Cor da Sidebar (opcional)"
              description="Deixe vazio para usar padrão do tema"
              value={localColors.sidebar_color || "222 47% 8%"}
              onChange={(v) => handleColorChange("sidebar_color", v)}
            />
          </SettingCard>
        </div>

        {/* Live Preview - Sticky on desktop */}
        <div className="lg:sticky lg:top-6 space-y-6">
          <ColorPreviewCard
            colors={{
              primary: localColors.primary_color,
              accent: localColors.accent_color,
              success: localColors.success_color,
              warning: localColors.warning_color,
              error: localColors.error_color,
              sidebar: localColors.sidebar_color,
            }}
          />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleSave} 
              className="flex-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-xl transition-all duration-300"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-border/50 bg-card/95 backdrop-blur-xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Resetar Cores?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá restaurar todas as cores para os valores padrão do sistema.
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="bg-destructive hover:bg-destructive/90">
                    Confirmar Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
