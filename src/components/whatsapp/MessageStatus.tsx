import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageStatusProps {
  status: "sent" | "delivered" | "read";
  className?: string;
}

export function MessageStatus({ status, className }: MessageStatusProps) {
  if (status === "sent") {
    return (
      <Check 
        className={cn("h-3.5 w-3.5 text-muted-foreground", className)} 
      />
    );
  }

  return (
    <CheckCheck 
      className={cn(
        "h-3.5 w-3.5",
        status === "read" ? "text-[#53bdeb]" : "text-muted-foreground",
        className
      )} 
    />
  );
}
