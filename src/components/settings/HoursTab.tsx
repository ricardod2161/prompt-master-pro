import { Clock, Globe, Copy, Save, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SettingCard } from "./SettingCard";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface OpeningHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

interface HoursSettings {
  opening_hours: OpeningHours;
  timezone: string;
}

interface HoursTabProps {
  settings: HoursSettings;
  onSettingsChange: (settings: HoursSettings) => void;
  onSave: () => void;
  isSaving: boolean;
}

const DAYS_OF_WEEK = [
  { key: "monday" as const, label: "Segunda", shortLabel: "Seg" },
  { key: "tuesday" as const, label: "Terça", shortLabel: "Ter" },
  { key: "wednesday" as const, label: "Quarta", shortLabel: "Qua" },
  { key: "thursday" as const, label: "Quinta", shortLabel: "Qui" },
  { key: "friday" as const, label: "Sexta", shortLabel: "Sex" },
  { key: "saturday" as const, label: "Sábado", shortLabel: "Sáb" },
  { key: "sunday" as const, label: "Domingo", shortLabel: "Dom" },
];

const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "Brasília (GMT-3)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/Belem", label: "Belém (GMT-3)" },
  { value: "America/Fortaleza", label: "Fortaleza (GMT-3)" },
  { value: "America/Recife", label: "Recife (GMT-3)" },
  { value: "America/Cuiaba", label: "Cuiabá (GMT-4)" },
  { value: "America/Porto_Velho", label: "Porto Velho (GMT-4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (GMT-5)" },
];

export function HoursTab({ settings, onSettingsChange, onSave, isSaving }: HoursTabProps) {
  const handleDayChange = (day: keyof OpeningHours, field: keyof DayHours, value: string | boolean) => {
    onSettingsChange({
      ...settings,
      opening_hours: {
        ...settings.opening_hours,
        [day]: { ...settings.opening_hours[day], [field]: value },
      },
    });
  };

  const copyToWeekdays = () => {
    const mondayHours = settings.opening_hours.monday;
    const weekdays: (keyof OpeningHours)[] = ["tuesday", "wednesday", "thursday", "friday"];
    
    const newHours = { ...settings.opening_hours };
    weekdays.forEach((day) => {
      newHours[day] = { ...mondayHours };
    });
    
    onSettingsChange({ ...settings, opening_hours: newHours });
    toast({ title: "Horários copiados", description: "Segunda-feira copiada para Terça a Sexta" });
  };

  const copyToAll = () => {
    const mondayHours = settings.opening_hours.monday;
    const allDays: (keyof OpeningHours)[] = ["tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    
    const newHours = { ...settings.opening_hours };
    allDays.forEach((day) => {
      newHours[day] = { ...mondayHours };
    });
    
    onSettingsChange({ ...settings, opening_hours: newHours });
    toast({ title: "Horários copiados", description: "Segunda-feira copiada para todos os dias" });
  };

  return (
    <div className="animate-fade-in">
      <SettingCard
        icon={Clock}
        title="Horário de Funcionamento"
        description="Configure os horários de abertura e fechamento"
        variant="elevated"
      >
        {/* Timezone */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b border-border/50">
          <div className="space-y-2 flex-1 max-w-xs">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Fuso Horário
            </Label>
            <Select
              value={settings.timezone}
              onValueChange={(value) => onSettingsChange({ ...settings, timezone: value })}
            >
              <SelectTrigger className="h-11 bg-background/50 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Quick copy buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyToWeekdays} className="gap-2">
              <Copy className="h-4 w-4" />
              <span className="hidden sm:inline">Copiar para Seg-Sex</span>
              <span className="sm:hidden">Seg-Sex</span>
            </Button>
            <Button variant="outline" size="sm" onClick={copyToAll} className="gap-2">
              <Copy className="h-4 w-4" />
              <span className="hidden sm:inline">Copiar para Todos</span>
              <span className="sm:hidden">Todos</span>
            </Button>
          </div>
        </div>

        {/* Days grid */}
        <div className="space-y-2 pt-4">
          {DAYS_OF_WEEK.map((day) => {
            const dayHours = settings.opening_hours[day.key];
            const isOpen = !dayHours.closed;
            
            return (
              <div
                key={day.key}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border transition-all duration-300",
                  isOpen 
                    ? "bg-gradient-to-r from-status-success/5 to-transparent border-status-success/20"
                    : "bg-muted/30 border-border/30"
                )}
              >
                {/* Day name and toggle */}
                <div className="flex items-center justify-between sm:w-36">
                  <span className="font-medium">
                    <span className="hidden sm:inline">{day.label}</span>
                    <span className="sm:hidden">{day.shortLabel}</span>
                  </span>
                  <Switch
                    checked={isOpen}
                    onCheckedChange={(checked) => handleDayChange(day.key, "closed", !checked)}
                    className="data-[state=checked]:bg-status-success"
                  />
                </div>
                
                {/* Hours or closed badge */}
                {isOpen ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      type="time"
                      value={dayHours.open}
                      onChange={(e) => handleDayChange(day.key, "open", e.target.value)}
                      className="w-28 h-10 bg-background/70 border-border/50 focus:border-primary/50"
                    />
                    <span className="text-muted-foreground text-sm">até</span>
                    <Input
                      type="time"
                      value={dayHours.close}
                      onChange={(e) => handleDayChange(day.key, "close", e.target.value)}
                      className="w-28 h-10 bg-background/70 border-border/50 focus:border-primary/50"
                    />
                    <Badge variant="outline" className="ml-auto bg-status-success/10 text-status-success border-status-success/30 gap-1">
                      <Check className="h-3 w-3" />
                      Aberto
                    </Badge>
                  </div>
                ) : (
                  <Badge variant="secondary" className="w-fit gap-1">
                    <X className="h-3 w-3" />
                    Fechado
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-border/50">
          <Button 
            onClick={onSave} 
            disabled={isSaving} 
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25"
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Horários
          </Button>
        </div>
      </SettingCard>
    </div>
  );
}
