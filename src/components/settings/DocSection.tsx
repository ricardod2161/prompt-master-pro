import { LucideIcon } from "lucide-react";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DocSectionProps {
  value: string;
  icon: LucideIcon;
  title: string;
  description?: string;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  children: React.ReactNode;
  className?: string;
}

export function DocSection({
  value,
  icon: Icon,
  title,
  description,
  badge,
  badgeVariant = "secondary",
  children,
  className,
}: DocSectionProps) {
  return (
    <AccordionItem
      value={value}
      className={cn(
        "border border-border/50 rounded-xl mb-3 bg-card/30 backdrop-blur-sm overflow-hidden transition-all hover:border-primary/30",
        className
      )}
    >
      <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-muted/30 [&[data-state=open]]:bg-muted/50">
        <div className="flex items-center gap-3 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{title}</h3>
              {badge && (
                <Badge variant={badgeVariant} className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                {description}
              </p>
            )}
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-2">
        <div className="pl-13 space-y-4">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}
