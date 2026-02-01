import { Settings as SettingsIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SettingsHeaderProps {
  unitName: string;
}

export function SettingsHeader({ unitName }: SettingsHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/50 p-6 mb-6">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/20 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative flex items-center gap-4">
        {/* Icon with 3D effect */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/30 rounded-xl blur-lg animate-pulse" />
          <div className="relative p-4 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
            <SettingsIcon className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>
        
        {/* Text content */}
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Configurações
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted-foreground">{unitName}</p>
            <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary text-xs">
              Unidade Ativa
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
