import { useRef } from "react";
import { Layers, Loader2, Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type {
  Category,
  Product,
  ProductFormState,
  VariationFormItem,
} from "@/types/menu";

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct: Product | null;
  categories: Category[];

  productForm: ProductFormState;
  onFormChange: (form: ProductFormState) => void;

  variationsForm: VariationFormItem[];
  onAddVariation: () => void;
  onUpdateVariation: (index: number, field: keyof VariationFormItem, value: string) => void;
  onRemoveVariation: (index: number) => void;

  imagePreview: string | null;
  onImageSelect: (file: File) => void;
  onRemoveImage: () => void;

  formError: string | null;
  saving: boolean;
  uploadingImage: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * Componente puramente apresentacional do Dialog de Produto.
 * Recebe estado e handlers via props. Nenhuma lógica de negócio aqui.
 */
export function ProductDialog({
  open,
  onOpenChange,
  editingProduct,
  categories,
  productForm,
  onFormChange,
  variationsForm,
  onAddVariation,
  onUpdateVariation,
  onRemoveVariation,
  imagePreview,
  onImageSelect,
  onRemoveImage,
  formError,
  saving,
  uploadingImage,
  onSubmit,
}: ProductDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande", { description: "Máximo 5MB" });
      return;
    }
    onImageSelect(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            <DialogDescription>
              {editingProduct ? "Atualize os dados do produto" : "Adicione um novo produto ao cardápio"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {formError && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                {formError}
              </div>
            )}

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Foto do Produto</Label>
              <div className="flex items-center gap-3">
                {imagePreview ? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-border">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        onRemoveImage();
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Upload</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="text-xs text-muted-foreground">
                  <p>JPG, PNG ou WebP</p>
                  <p>Máximo 5MB</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={productForm.name}
                onChange={(e) => onFormChange({ ...productForm, name: e.target.value })}
                placeholder="Ex: X-Burger"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={productForm.description}
                onChange={(e) => onFormChange({ ...productForm, description: e.target.value })}
                placeholder="Ingredientes, observações..."
              />
            </div>

            {/* Variable Price Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-1.5">🔄 Preço Variável</Label>
                <p className="text-xs text-muted-foreground">
                  Cliente define o valor (porções, kg, etc.)
                </p>
              </div>
              <Switch
                checked={productForm.is_variable_price}
                onCheckedChange={(checked) =>
                  onFormChange({
                    ...productForm,
                    is_variable_price: checked,
                    price: checked ? "" : productForm.price,
                  })
                }
              />
            </div>

            {productForm.is_variable_price && (
              <div className="grid grid-cols-2 gap-4 p-3 rounded-lg border border-primary/20 bg-primary/5">
                <div className="space-y-2">
                  <Label className="text-xs">Valor Mínimo (opcional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.min_price}
                    onChange={(e) => onFormChange({ ...productForm, min_price: e.target.value })}
                    placeholder="Ex: 10,00"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Valor Máximo (opcional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.max_price}
                    onChange={(e) => onFormChange({ ...productForm, max_price: e.target.value })}
                    placeholder="Ex: 200,00"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}

            {!productForm.is_variable_price && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Preço Base</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.price}
                    onChange={(e) => onFormChange({ ...productForm, price: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Preço Delivery</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productForm.delivery_price}
                    onChange={(e) => onFormChange({ ...productForm, delivery_price: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
              </div>
            )}
            {productForm.is_variable_price && (
              <div className="space-y-2">
                <Label>Preço Delivery (fixo, opcional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={productForm.delivery_price}
                  onChange={(e) => onFormChange({ ...productForm, delivery_price: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={productForm.category_id}
                  onValueChange={(value) => onFormChange({ ...productForm, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tempo de Preparo (min) *</Label>
                <Input
                  type="number"
                  min="1"
                  value={productForm.preparation_time}
                  onChange={(e) => onFormChange({ ...productForm, preparation_time: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Variations Section */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  Variações (P/M/G)
                </Label>
                <Button type="button" variant="outline" size="sm" onClick={onAddVariation}>
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar
                </Button>
              </div>
              {variationsForm.filter((v) => !v._deleted).length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhuma variação. Adicione para oferecer tamanhos ou sabores com preços diferentes.
                </p>
              )}
              {variationsForm.map((variation, index) =>
                variation._deleted ? null : (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Label className="text-xs">Nome</Label>
                      <Input
                        value={variation.name}
                        onChange={(e) => onUpdateVariation(index, "name", e.target.value)}
                        placeholder="Ex: Grande"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="w-20 space-y-1">
                      <Label className="text-xs">Preço</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variation.price}
                        onChange={(e) => onUpdateVariation(index, "price", e.target.value)}
                        placeholder="0,00"
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="w-20 space-y-1">
                      <Label className="text-xs">Delivery</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variation.delivery_price}
                        onChange={(e) => onUpdateVariation(index, "delivery_price", e.target.value)}
                        placeholder="0,00"
                        className="h-8 text-sm"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => onRemoveVariation(index)}
                    >
                      <X className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                )
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || uploadingImage}>
              {saving || uploadingImage ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {uploadingImage ? "Enviando foto..." : "Salvando..."}
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
