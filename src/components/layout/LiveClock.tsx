import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function LiveClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeWithSeconds = format(currentTime, "HH:mm:ss");
  const timeWithoutSeconds = format(currentTime, "HH:mm");
  const dateString = format(currentTime, "EEEE, dd 'de' MMM", { locale: ptBR });
  const fullDate = format(currentTime, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/50 border border-border/50 backdrop-blur-sm transition-all hover:bg-background/70">
          <Clock className="h-4 w-4 text-primary animate-pulse" />
          
          {/* Mobile: Only time without seconds */}
          <span className="font-mono text-sm font-medium sm:hidden">
            {timeWithoutSeconds}
          </span>
          
          {/* Tablet: Time with seconds */}
          <span className="hidden sm:block lg:hidden font-mono text-sm font-medium">
            {timeWithSeconds}
          </span>
          
          {/* Desktop: Full time and date */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="font-mono text-sm font-medium">
              {timeWithSeconds}
            </span>
            <span className="text-muted-foreground">|</span>
            <span className="text-sm text-muted-foreground capitalize">
              {dateString}
            </span>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="capitalize">
        {fullDate}
      </TooltipContent>
    </Tooltip>
  );
}
