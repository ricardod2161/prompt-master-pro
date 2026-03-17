import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Trash2, Clock, Truck, Copy, ShoppingBag, Layers, Flame } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  active: boolean;
}

interface ProductVariation {
  id: string;
  name: string;
  price: number;
  delivery_price: number | null;
  available: boolean;
  sort_order: number;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  delivery_price: number | null;
  category_id: string | null;
  available: boolean;
  preparation_time: number;
  image_url?: string | null;
  is_variable_price?: boolean;
  min_price?: number | null;
  max_price?: number | null;
  categories?: Category;
  variations?: ProductVariation[];
}

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onToggleAvailability: (product: Product) => void;
  onDuplicate?: (product: Product) => void;
  formatCurrency: (value: number) => string;
  index?: number;
  selected?: boolean;
  onSelect?: (productId: string, selected: boolean) => void;
  selectionMode?: boolean;
  orderCount?: number;
  isTop?: boolean;
}

export function ProductCard({
  product,
  onEdit,
  onDelete,
  onToggleAvailability,
  onDuplicate,
  formatCurrency,
  index = 0,
  selected = false,
  onSelect,
  selectionMode = false,
  orderCount,
  isTop = false,
}: ProductCardProps) {
  const variations = product.variations || [];
  const hasVariations = variations.length > 0;
  const minPrice = hasVariations
    ? Math.min(product.price, ...variations.map((v) => v.price))
    : product.price;

  return (
    <div
      className={`group relative rounded-lg border bg-card/80 backdrop-blur-sm p-2 transition-all duration-200 hover:border-border
        ${!product.available ? "opacity-50 grayscale-[30%]" : ""}
        ${selected ? "ring-2 ring-primary border-primary/50" : "border-border/50"}
        ${isTop ? "border-amber-500/50 shadow-sm shadow-amber-500/10" : ""}
      `}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      {/* Top badge */}
      {isTop && (
        <div className="absolute -top-1.5 -left-1.5 z-10">
          <div className="bg-warning text-warning-foreground rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
            <Flame className="w-3 h-3" />
          </div>
        </div>
      )}

      {/* Product thumbnail */}
      {product.image_url && (
        <div className="w-full h-14 rounded mb-1.5 overflow-hidden">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Header: Checkbox + Name + Toggle */}
      <div className="flex items-center gap-1.5">
        {selectionMode && (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelect?.(product.id, !!checked)}
              className="h-4 w-4"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-xs leading-tight truncate">{product.name}</h3>
        </div>
        {orderCount !== undefined && orderCount > 0 && (
          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 shrink-0">
            <ShoppingBag className="w-2.5 h-2.5 mr-0.5" />
            {orderCount}
          </Badge>
        )}
        <Switch
          checked={product.available}
          onCheckedChange={() => onToggleAvailability(product)}
          className="shrink-0 scale-75 origin-right"
        />
      </div>

      {/* Category + Variations badges */}
      <div className="flex items-center gap-1 mt-1 flex-wrap">
        {product.categories?.name && (
          <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5">
            {product.categories.name}
          </Badge>
        )}
        {hasVariations && (
          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5">
            <Layers className="w-2 h-2 mr-0.5" />
            {variations.length}
          </Badge>
        )}
        {!product.available && (
          <Badge variant="destructive" className="text-[9px] px-1 py-0 h-3.5">
            Off
          </Badge>
        )}
      </div>

      {/* Price + Prep time */}
      <div className="flex items-center justify-between mt-1.5">
        <div className="flex items-baseline gap-1">
          <span className="text-xs font-bold text-primary">
            {product.is_variable_price
              ? "Variável"
              : hasVariations
              ? `${formatCurrency(minPrice)}+`
              : formatCurrency(product.price)}
          </span>
          {!hasVariations && !product.is_variable_price && product.delivery_price && (
            <span className="text-[9px] text-muted-foreground flex items-center">
              <Truck className="w-2.5 h-2.5 mr-0.5" />
              {formatCurrency(product.delivery_price)}
            </span>
          )}
        </div>
        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
          <Clock className="w-2.5 h-2.5" />
          {product.preparation_time}m
        </span>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-0.5 mt-1 border-t border-border/30 pt-1">
        {onDuplicate && (
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onDuplicate(product)} title="Duplicar">
            <Copy className="w-3 h-3" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onEdit(product)}>
          <Pencil className="w-3 h-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => onDelete(product.id)}>
          <Trash2 className="w-3 h-3 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
