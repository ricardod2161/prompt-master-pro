import { Eye, Flame, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import type { Product } from "@/types/menu";

interface ProductListViewProps {
  filteredProducts: Product[];
  selectedProducts: Set<string>;
  topProductIds: Set<string>;
  orderCounts: Record<string, number>;
  onToggleSelect: (productId: string, selected: boolean) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onToggleAvailability: (product: Product) => void;
  formatCurrency: (value: number) => string;
}

/**
 * Tabela responsiva de produtos (modo lista). Sem lógica de estado.
 */
export function ProductListView({
  filteredProducts,
  selectedProducts,
  topProductIds,
  orderCounts,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onEdit,
  onDelete,
  onToggleAvailability,
  formatCurrency,
}: ProductListViewProps) {
  const allSelected =
    selectedProducts.size === filteredProducts.length && filteredProducts.length > 0;

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="w-8 p-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => (checked ? onSelectAll() : onClearSelection())}
              />
            </th>
            <th className="text-left p-2 font-medium">Produto</th>
            <th className="text-left p-2 font-medium hidden sm:table-cell">Categoria</th>
            <th className="text-left p-2 font-medium">Preço</th>
            <th className="text-left p-2 font-medium hidden md:table-cell">Delivery</th>
            <th className="text-left p-2 font-medium hidden lg:table-cell">Pedidos hoje</th>
            <th className="text-center p-2 font-medium">Ativo</th>
            <th className="text-right p-2 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody>
          {filteredProducts.map((product) => {
            const isTop = topProductIds.has(product.id);
            const todayCount = orderCounts[product.id] || 0;
            return (
              <tr
                key={product.id}
                className={`border-t border-border/50 hover:bg-muted/30 transition-colors ${selectedProducts.has(product.id) ? "bg-primary/5" : ""} ${!product.available ? "opacity-60" : ""}`}
              >
                <td className="p-2">
                  <Checkbox
                    checked={selectedProducts.has(product.id)}
                    onCheckedChange={(checked) => onToggleSelect(product.id, !!checked)}
                  />
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-8 h-8 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        {isTop && <Flame className="w-3 h-3 text-status-warning shrink-0" />}
                        <span className="font-medium truncate max-w-[180px]">{product.name}</span>
                      </div>
                      {product.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-2 hidden sm:table-cell">
                  <span className="text-muted-foreground text-xs">
                    {product.categories?.name || "—"}
                  </span>
                </td>
                <td className="p-2">
                  <span className="font-medium text-primary text-xs">
                    {product.is_variable_price
                      ? "Variável"
                      : product.variations && product.variations.length > 0
                      ? `${formatCurrency(Math.min(product.price, ...product.variations.map((v) => v.price)))}+`
                      : formatCurrency(product.price)}
                  </span>
                </td>
                <td className="p-2 hidden md:table-cell">
                  <span className="text-muted-foreground text-xs">
                    {product.delivery_price ? formatCurrency(product.delivery_price) : "—"}
                  </span>
                </td>
                <td className="p-2 hidden lg:table-cell">
                  {todayCount > 0 ? (
                    <Badge variant="secondary" className="text-xs">
                      {todayCount}×
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
                <td className="p-2 text-center">
                  <Switch
                    checked={product.available ?? true}
                    onCheckedChange={() => onToggleAvailability(product)}
                    className="scale-75"
                  />
                </td>
                <td className="p-2">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEdit(product)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onDelete(product.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
