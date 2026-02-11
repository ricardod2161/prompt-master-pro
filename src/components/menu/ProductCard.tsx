import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2, Clock, Truck } from "lucide-react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  active: boolean;
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
  categories?: Category;
}

interface ProductCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  onToggleAvailability: (product: Product) => void;
  formatCurrency: (value: number) => string;
}

export function ProductCard({
  product,
  onEdit,
  onDelete,
  onToggleAvailability,
  formatCurrency,
}: ProductCardProps) {
  return (
    <Card className={`group transition-all duration-200 hover:shadow-md ${!product.available ? "opacity-60" : ""}`}>
      <CardContent className="p-4 space-y-3">
        {/* Header: Name + Category */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm leading-tight truncate">{product.name}</h3>
            {product.categories?.name && (
              <Badge variant="secondary" className="mt-1 text-[10px] px-1.5 py-0">
                {product.categories.name}
              </Badge>
            )}
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
          <span className="text-lg font-bold text-primary">
            {formatCurrency(product.price)}
          </span>
          {product.delivery_price && (
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
      </CardContent>
    </Card>
  );
}
