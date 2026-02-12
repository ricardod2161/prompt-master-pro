import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FolderOpen, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  onReorder?: (reorderedCategories: Category[]) => void;
}

export function CategoryChips({
  categories,
  filterCategory,
  onFilterChange,
  onEditCategory,
  productCounts,
  onReorder,
}: CategoryChipsProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    dragNodeRef.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = "move";
    // Make the element semi-transparent
    setTimeout(() => {
      if (dragNodeRef.current) {
        dragNodeRef.current.style.opacity = "0.4";
      }
    }, 0);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIndex !== null && index !== dragIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = "1";
    }
    setDragIndex(null);
    setDragOverIndex(null);
    dragNodeRef.current = null;
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === dropIndex) {
      handleDragEnd();
      return;
    }

    const reordered = [...categories];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    // Update sort_order values
    const updated = reordered.map((cat, i) => ({ ...cat, sort_order: i }));
    
    // Optimistic update
    onReorder?.(updated);

    handleDragEnd();

    // Save to database
    setSaving(true);
    try {
      const updates = updated.map((cat) =>
        supabase
          .from("categories")
          .update({ sort_order: cat.sort_order })
          .eq("id", cat.id)
      );
      await Promise.all(updates);
      toast.success("Ordem salva!");
    } catch {
      toast.error("Erro ao salvar ordem");
    } finally {
      setSaving(false);
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2 items-center">
          <Badge
            variant={filterCategory === "all" ? "default" : "outline"}
            className="cursor-pointer transition-all duration-200 shrink-0 hover:scale-105"
            onClick={() => onFilterChange("all")}
          >
            Todos ({Object.values(productCounts).reduce((a, b) => a + b, 0)})
          </Badge>
          {categories.map((cat, index) => (
            <Tooltip key={cat.id}>
              <TooltipTrigger asChild>
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`transition-all duration-200 ${
                    dragOverIndex === index
                      ? "border-l-2 border-primary pl-1"
                      : ""
                  }`}
                >
                  <Badge
                    variant={filterCategory === cat.id ? "default" : "outline"}
                    className={`cursor-grab active:cursor-grabbing transition-all duration-200 group shrink-0 hover:scale-105 select-none ${
                      dragIndex === index ? "ring-2 ring-primary/50" : ""
                    } ${saving ? "pointer-events-none" : ""}`}
                    onClick={() => onFilterChange(cat.id)}
                    onDoubleClick={() => onEditCategory(cat)}
                  >
                    <GripVertical className="w-3 h-3 mr-0.5 opacity-40 group-hover:opacity-100 transition-opacity" />
                    <FolderOpen className="w-3 h-3 mr-1" />
                    {cat.name} ({productCounts[cat.id] || 0})
                  </Badge>
                </div>
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
