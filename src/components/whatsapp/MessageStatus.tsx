import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageStatusProps {
  status: "sent" | "delivered" | "read";
  className?: string;
}

export function MessageStatus({ status, className }: MessageStatusProps) {
  // sent = single grey check
  if (status === "sent") {
    return (
      <Check 
        className={cn("h-3.5 w-3.5 text-muted-foreground/70", className)} 
      />
    );
  }

  // delivered = double grey checks
  if (status === "delivered") {
    return (
      <CheckCheck 
        className={cn("h-3.5 w-3.5 text-muted-foreground/70", className)} 
      />
    );
  }

  // read = double blue checks
  return (
    <CheckCheck 
      className={cn("h-3.5 w-3.5 text-[#53bdeb]", className)} 
    />
  );
}
