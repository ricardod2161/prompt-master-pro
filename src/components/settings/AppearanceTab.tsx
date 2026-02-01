import { useState, useEffect } from "react";
import { Palette, RotateCcw, Save, Moon, Sun, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ColorPicker } from "./ColorPicker";
import { ColorPreviewCard } from "./ColorPreviewCard";
import { ColorPresets, ColorPreset, COLOR_PRESETS } from "./ColorPresets";
import { useTheme, ThemeColors } from "@/hooks/useTheme";
import { useUnitSettings } from "@/hooks/useUnitSettings";
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
    <div className="space-y-6">
      {/* Theme Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            Tema Geral
          </CardTitle>
          <CardDescription>Escolha entre modo claro ou escuro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-3">
              <Sun className="h-5 w-5 text-muted-foreground" />
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
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Color Configuration */}
        <div className="space-y-6">
          {/* Color Presets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Paletas de Cores
              </CardTitle>
              <CardDescription>Escolha uma paleta pronta ou personalize</CardDescription>
            </CardHeader>
            <CardContent>
              <ColorPresets
                selectedPreset={selectedPreset}
                onSelectPreset={handlePresetSelect}
              />
            </CardContent>
          </Card>

          {/* Custom Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Personalizar Cores</CardTitle>
              <CardDescription>Ajuste cada cor individualmente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
              
              <Separator />
              
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

              <Separator />

              <ColorPicker
                label="Cor da Sidebar (opcional)"
                description="Deixe vazio para usar padrão do tema"
                value={localColors.sidebar_color || "222 47% 8%"}
                onChange={(v) => handleColorChange("sidebar_color", v)}
              />
            </CardContent>
          </Card>
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
              className="flex-1"
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
                <Button variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Resetar Cores?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso irá restaurar todas as cores para os valores padrão do sistema.
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>
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
