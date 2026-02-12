import { useMemo, useState } from "react";
import { useProducts, useCategories } from "@/hooks/useProducts";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, UtensilsCrossed } from "lucide-react";

interface MenuContextSectionProps {
  selectedCategories: string[];
  onCategoriesChange: (ids: string[]) => void;
}

export function MenuContextSection({ selectedCategories, onCategoriesChange }: MenuContextSectionProps) {
  const { data: products, isLoading: loadingProducts } = useProducts();
  const { data: categories, isLoading: loadingCategories } = useCategories();

  const isLoading = loadingProducts || loadingCategories;

  const categoryMap = useMemo(() => {
    if (!products || !categories) return new Map<string, { name: string; count: number }>();
    const map = new Map<string, { name: string; count: number }>();
    for (const cat of categories) {
      const count = products.filter((p) => p.category_id === cat.id).length;
      map.set(cat.id, { name: cat.name, count });
    }
    // Products without category
    const uncategorized = products.filter((p) => !p.category_id).length;
    if (uncategorized > 0) {
      map.set("__uncategorized__", { name: "Sem categoria", count: uncategorized });
    }
    return map;
  }, [products, categories]);

  const toggleCategory = (id: string) => {
    if (selectedCategories.includes(id)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== id));
    } else {
      onCategoriesChange([...selectedCategories, id]);
    }
  };

  const selectAll = () => {
    onCategoriesChange(Array.from(categoryMap.keys()));
  };

  const summary = useMemo(() => {
    if (!products || !categories || selectedCategories.length === 0) return "";
    const lines: string[] = [];
    for (const id of selectedCategories) {
      const cat = categoryMap.get(id);
      if (!cat) continue;
      const catProducts = products.filter((p) =>
        id === "__uncategorized__" ? !p.category_id : p.category_id === id
      );
      if (catProducts.length === 0) continue;
      const items = catProducts
        .map((p) => `${p.name} — R$ ${p.price.toFixed(2)}${p.description ? ` (${p.description})` : ""}`)
        .join("; ");
      lines.push(`${cat.name} (${catProducts.length}): ${items}`);
    }
    return lines.join("\n");
  }, [products, categories, selectedCategories, categoryMap]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando cardápio...
      </div>
    );
  }

  if (categoryMap.size === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <UtensilsCrossed className="h-4 w-4" />
        Nenhum produto cadastrado. Adicione produtos no Cardápio primeiro.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Categorias para incluir no contexto</Label>
        <button
          type="button"
          onClick={selectAll}
          className="text-xs text-primary hover:underline"
        >
          Selecionar todas
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Array.from(categoryMap.entries()).map(([id, { name, count }]) => (
          <label
            key={id}
            className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              checked={selectedCategories.includes(id)}
              onCheckedChange={() => toggleCategory(id)}
            />
            <span className="text-sm flex-1">{name}</span>
            <Badge variant="secondary" className="text-xs">
              {count}
            </Badge>
          </label>
        ))}
      </div>

      {summary && (
        <div className="rounded-md bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground mb-1 font-medium">
            Resumo que será enviado à IA ({summary.length} chars):
          </p>
          <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-6">{summary}</p>
        </div>
      )}
    </div>
  );
}

export function generateMenuSummary(
  products: any[] | undefined,
  categories: any[] | undefined,
  selectedCategories: string[]
): string {
  if (!products || !categories || selectedCategories.length === 0) return "";
  const lines: string[] = [];
  for (const id of selectedCategories) {
    const cat = id === "__uncategorized__"
      ? { name: "Sem categoria" }
      : categories.find((c: any) => c.id === id);
    if (!cat) continue;
    const catProducts = products.filter((p: any) =>
      id === "__uncategorized__" ? !p.category_id : p.category_id === id
    );
    if (catProducts.length === 0) continue;
    const items = catProducts
      .map((p: any) => `${p.name} — R$ ${p.price.toFixed(2)}${p.description ? ` (${p.description})` : ""}`)
      .join("; ");
    lines.push(`${cat.name} (${catProducts.length}): ${items}`);
  }
  return lines.join("\n");
}
