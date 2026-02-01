import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  isRecording?: boolean;
  className?: string;
}

export function TypingIndicator({ isRecording, className }: TypingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1 px-4 py-2.5 bg-muted rounded-2xl rounded-bl-md">
        <div className="flex gap-1">
          <span 
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" 
            style={{ animationDelay: "0ms", animationDuration: "600ms" }}
          />
          <span 
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" 
            style={{ animationDelay: "150ms", animationDuration: "600ms" }}
          />
          <span 
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" 
            style={{ animationDelay: "300ms", animationDuration: "600ms" }}
          />
        </div>
      </div>
      <span className="text-xs text-muted-foreground">
        {isRecording ? "gravando..." : "digitando..."}
      </span>
    </div>
  );
}
