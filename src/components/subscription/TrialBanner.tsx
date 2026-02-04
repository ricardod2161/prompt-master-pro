import { AlertTriangle, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { differenceInDays, differenceInHours } from "date-fns";

interface TrialBannerProps {
  trialEnd: string | null;
  tier: string | null;
}

export function TrialBanner({ trialEnd, tier }: TrialBannerProps) {
  const navigate = useNavigate();
  
  if (!trialEnd) return null;
  
  const trialEndDate = new Date(trialEnd);
  const now = new Date();
  const daysLeft = differenceInDays(trialEndDate, now);
  const hoursLeft = differenceInHours(trialEndDate, now);
  
  // Don't show if trial already ended
  if (daysLeft < 0) return null;
  
  const isUrgent = daysLeft <= 3;
  const timeText = daysLeft > 0 
    ? `${daysLeft} dia${daysLeft !== 1 ? 's' : ''}` 
    : `${hoursLeft} hora${hoursLeft !== 1 ? 's' : ''}`;

  return (
    <div className={`w-full px-4 py-2.5 flex items-center justify-between gap-4 text-sm ${
      isUrgent 
        ? 'bg-destructive/10 border-b border-destructive/20' 
        : 'bg-primary/10 border-b border-primary/20'
    }`}>
      <div className="flex items-center gap-2">
        {isUrgent ? (
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
        ) : (
          <Clock className="h-4 w-4 text-primary shrink-0" />
        )}
        <span className={isUrgent ? 'text-destructive' : 'text-foreground'}>
          <strong>Período de teste:</strong> {timeText} restante{daysLeft !== 1 ? 's' : ''} no plano {tier?.charAt(0).toUpperCase()}{tier?.slice(1)}
        </span>
      </div>
      
      <Button 
        size="sm" 
        variant={isUrgent ? "destructive" : "default"}
        className="gap-1.5 shrink-0"
        onClick={() => navigate('/pricing')}
      >
        <Sparkles className="h-3.5 w-3.5" />
        Assinar Agora
      </Button>
    </div>
  );
}
