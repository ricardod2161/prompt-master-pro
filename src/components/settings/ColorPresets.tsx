import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColorPreset {
  name: string;
  primary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  sidebar?: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    name: "Verde Padrão",
    primary: "142 76% 36%",
    accent: "217 91% 60%",
    success: "142 76% 36%",
    warning: "38 92% 50%",
    error: "0 84% 60%",
  },
  {
    name: "Azul Corporativo",
    primary: "217 91% 50%",
    accent: "142 70% 45%",
    success: "142 70% 45%",
    warning: "38 92% 50%",
    error: "0 84% 60%",
  },
  {
    name: "Laranja Energético",
    primary: "25 95% 53%",
    accent: "217 91% 60%",
    success: "142 70% 45%",
    warning: "45 93% 47%",
    error: "0 84% 60%",
  },
  {
    name: "Roxo Moderno",
    primary: "271 76% 53%",
    accent: "217 91% 60%",
    success: "142 70% 45%",
    warning: "38 92% 50%",
    error: "0 84% 60%",
  },
  {
    name: "Vermelho Intenso",
    primary: "0 72% 51%",
    accent: "217 91% 60%",
    success: "142 70% 45%",
    warning: "38 92% 50%",
    error: "0 84% 60%",
  },
  {
    name: "Rosa Elegante",
    primary: "330 81% 60%",
    accent: "271 76% 53%",
    success: "142 70% 45%",
    warning: "38 92% 50%",
    error: "0 84% 60%",
  },
  {
    name: "Teal Profissional",
    primary: "174 72% 40%",
    accent: "217 91% 60%",
    success: "142 70% 45%",
    warning: "38 92% 50%",
    error: "0 84% 60%",
  },
  {
    name: "Amber Quente",
    primary: "38 92% 50%",
    accent: "217 91% 60%",
    success: "142 70% 45%",
    warning: "45 93% 47%",
    error: "0 84% 60%",
  },
];

interface ColorPresetsProps {
  selectedPreset: string | null;
  onSelectPreset: (preset: ColorPreset) => void;
}

export function ColorPresets({ selectedPreset, onSelectPreset }: ColorPresetsProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">Paletas Pré-definidas</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {COLOR_PRESETS.map((preset) => {
          const isSelected = selectedPreset === preset.name;
          return (
            <Card
              key={preset.name}
              className={cn(
                "cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md",
                isSelected && "ring-2 ring-primary ring-offset-2"
              )}
              onClick={() => onSelectPreset(preset)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium truncate">{preset.name}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </div>
                <div className="flex gap-1">
                  <div
                    className="h-6 flex-1 rounded-l"
                    style={{ backgroundColor: `hsl(${preset.primary})` }}
                  />
                  <div
                    className="h-6 flex-1"
                    style={{ backgroundColor: `hsl(${preset.accent})` }}
                  />
                  <div
                    className="h-6 flex-1"
                    style={{ backgroundColor: `hsl(${preset.success})` }}
                  />
                  <div
                    className="h-6 flex-1"
                    style={{ backgroundColor: `hsl(${preset.warning})` }}
                  />
                  <div
                    className="h-6 flex-1 rounded-r"
                    style={{ backgroundColor: `hsl(${preset.error})` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
