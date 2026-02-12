import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FolderOpen } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  active: boolean;
}

interface CategoryChipsProps {
  categories: Category[];
  filterCategory: string;
  onFilterChange: (categoryId: string) => void;
  onEditCategory: (category: Category) => void;
  productCounts: Record<string, number>;
}

export function CategoryChips({
  categories,
  filterCategory,
  onFilterChange,
  onEditCategory,
  productCounts,
}: CategoryChipsProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          <Badge
            variant={filterCategory === "all" ? "default" : "outline"}
            className="cursor-pointer transition-all duration-200 shrink-0 hover:scale-105"
            onClick={() => onFilterChange("all")}
          >
            Todos ({Object.values(productCounts).reduce((a, b) => a + b, 0)})
          </Badge>
          {categories.map((cat) => (
            <Tooltip key={cat.id}>
              <TooltipTrigger asChild>
                <Badge
                  variant={filterCategory === cat.id ? "default" : "outline"}
                  className="cursor-pointer transition-all duration-200 group shrink-0 hover:scale-105"
                  onClick={() => onFilterChange(cat.id)}
                  onDoubleClick={() => onEditCategory(cat)}
                >
                  <FolderOpen className="w-3 h-3 mr-1" />
                  {cat.name} ({productCounts[cat.id] || 0})
                </Badge>
              </TooltipTrigger>
              {cat.description && (
                <TooltipContent>
                  <p className="max-w-48 text-xs">{cat.description}</p>
                </TooltipContent>
              )}
            </Tooltip>
          ))}
          <Badge
            variant={filterCategory === "uncategorized" ? "default" : "outline"}
            className="cursor-pointer transition-all duration-200 shrink-0 hover:scale-105"
            onClick={() => onFilterChange("uncategorized")}
          >
            Sem categoria ({productCounts["uncategorized"] || 0})
          </Badge>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </TooltipProvider>
  );
}
