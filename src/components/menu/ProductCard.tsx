import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card3D } from "@/components/ui/card-3d";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Pencil, Trash2, Clock, Truck, ImageOff, Copy, ShoppingBag, Layers } from "lucide-react";

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
}: ProductCardProps) {
  const variations = product.variations || [];
  const hasVariations = variations.length > 0;
  const minPrice = hasVariations
    ? Math.min(product.price, ...variations.map((v) => v.price))
    : product.price;

  return (
    <Card3D
      variant="subtle"
      className={`group overflow-hidden transition-all duration-300 ${!product.available ? "opacity-60 grayscale-[30%]" : ""} ${selected ? "ring-2 ring-primary" : ""}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Product Image */}
      <div className="relative">
        <AspectRatio ratio={16 / 9}>
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-muted/50 flex items-center justify-center">
              <ImageOff className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
        </AspectRatio>

        {/* Selection checkbox */}
        {selectionMode && (
          <div
            className="absolute top-2 left-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={selected}
              onCheckedChange={(checked) => onSelect?.(product.id, !!checked)}
              className="h-5 w-5 bg-background/80 backdrop-blur-sm"
            />
          </div>
        )}

        {/* Order count badge */}
        {orderCount !== undefined && orderCount > 0 && (
          <Badge
            variant="secondary"
            className="absolute top-2 right-2 text-[10px] bg-background/80 backdrop-blur-sm"
          >
            <ShoppingBag className="w-3 h-3 mr-0.5" />
            {orderCount}
          </Badge>
        )}

        {/* Unavailable overlay */}
        {!product.available && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Badge variant="destructive" className="text-xs font-semibold">
              Indisponível
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Header: Name + Toggle */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight truncate">{product.name}</h3>
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {product.categories?.name && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {product.categories.name}
                </Badge>
              )}
              {hasVariations && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  <Layers className="w-2.5 h-2.5 mr-0.5" />
                  {variations.length} opções
                </Badge>
              )}
            </div>
          </div>
          <Switch
            checked={product.available}
            onCheckedChange={() => onToggleAvailability(product)}
            className="shrink-0"
          />
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-primary">
            {hasVariations ? `A partir de ${formatCurrency(minPrice)}` : formatCurrency(product.price)}
          </span>
          {!hasVariations && product.delivery_price && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Truck className="w-3 h-3" />
              {formatCurrency(product.delivery_price)}
            </span>
          )}
        </div>

        {/* Footer: Prep time + Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {product.preparation_time} min
          </span>
          <div className="flex gap-1">
            {onDuplicate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onDuplicate(product)}
                title="Duplicar produto"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onEdit(product)}
            >
              <Pencil className="w-3.5 h-3.5" />
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
        </div>
      </div>
    </Card3D>
  );
}
