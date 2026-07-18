import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  mode: "typing" | "recording";
  className?: string;
}

/**
 * WhatsApp-like real-time status indicator.
 * - "typing": three dots with a staggered bounce animation
 * - "recording": pulsing microphone icon with animated sound bars
 */
export function TypingIndicator({ mode, className }: TypingIndicatorProps) {
  if (mode === "recording") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium text-green-600",
          className
        )}
        aria-live="polite"
      >
        <span className="relative inline-flex h-3 w-3 items-center justify-center">
          <Mic className="h-3 w-3 animate-pulse" />
        </span>
        <span>gravando áudio</span>
        <span className="inline-flex items-end gap-[2px] h-3">
          <span className="w-[2px] bg-green-600 rounded-full animate-[recBar_0.9s_ease-in-out_infinite]" style={{ animationDelay: "0ms" }} />
          <span className="w-[2px] bg-green-600 rounded-full animate-[recBar_0.9s_ease-in-out_infinite]" style={{ animationDelay: "150ms" }} />
          <span className="w-[2px] bg-green-600 rounded-full animate-[recBar_0.9s_ease-in-out_infinite]" style={{ animationDelay: "300ms" }} />
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium text-green-600",
        className
      )}
      aria-live="polite"
    >
      <span>digitando</span>
      <span className="inline-flex items-center gap-[3px]">
        <span className="h-1 w-1 rounded-full bg-green-600 animate-[typingDot_1.2s_ease-in-out_infinite]" style={{ animationDelay: "0ms" }} />
        <span className="h-1 w-1 rounded-full bg-green-600 animate-[typingDot_1.2s_ease-in-out_infinite]" style={{ animationDelay: "200ms" }} />
        <span className="h-1 w-1 rounded-full bg-green-600 animate-[typingDot_1.2s_ease-in-out_infinite]" style={{ animationDelay: "400ms" }} />
      </span>
    </span>
  );
}
