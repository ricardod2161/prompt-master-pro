import { Badge } from "@/components/ui/badge";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { CampaignTemplate } from "./campaignTemplates";

interface ExampleChipsProps {
  templates: CampaignTemplate[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function ExampleChips({ templates, selectedIndex, onSelect }: ExampleChipsProps) {
  if (!templates.length) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lightbulb className="w-3.5 h-3.5" />
        <span>Exemplos prontos:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {templates.map((t, i) => (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-all",
              selectedIndex === i
                ? "border-primary bg-primary/10 text-primary font-medium"
                : "border-border hover:border-primary/50 hover:bg-muted/50 text-muted-foreground"
            )}
          >
            {t.title.length > 35 ? t.title.slice(0, 35) + "…" : t.title}
          </button>
        ))}
      </div>
    </div>
  );
}
