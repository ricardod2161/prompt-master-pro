import { Badge } from "@/components/ui/badge";
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
    <div className="flex gap-2 flex-wrap">
      <Badge
        variant={filterCategory === "all" ? "default" : "outline"}
        className="cursor-pointer transition-colors"
        onClick={() => onFilterChange("all")}
      >
        Todos ({Object.values(productCounts).reduce((a, b) => a + b, 0)})
      </Badge>
      {categories.map((cat) => (
        <Badge
          key={cat.id}
          variant={filterCategory === cat.id ? "default" : "outline"}
          className="cursor-pointer transition-colors group"
          onClick={() => onFilterChange(cat.id)}
          onDoubleClick={() => onEditCategory(cat)}
        >
          <FolderOpen className="w-3 h-3 mr-1" />
          {cat.name} ({productCounts[cat.id] || 0})
        </Badge>
      ))}
      <Badge
        variant={filterCategory === "uncategorized" ? "default" : "outline"}
        className="cursor-pointer transition-colors"
        onClick={() => onFilterChange("uncategorized")}
      >
        Sem categoria ({productCounts["uncategorized"] || 0})
      </Badge>
    </div>
  );
}
