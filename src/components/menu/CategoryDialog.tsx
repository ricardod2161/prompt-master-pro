import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Category, CategoryFormState } from "@/types/menu";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: Category | null;
  categoryForm: CategoryFormState;
  onFormChange: (form: CategoryFormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: (categoryId: string) => void;
  saving: boolean;
}

/**
 * Componente puramente apresentacional do Dialog de Categoria.
 * Toda a lógica de estado e mutações permanece no componente pai (Menu.tsx).
 */
export function CategoryDialog({
  open,
  onOpenChange,
  editingCategory,
  categoryForm,
  onFormChange,
  onSubmit,
  onDelete,
  saving,
}: CategoryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Atualize os dados da categoria" : "Crie uma nova categoria de produtos"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) => onFormChange({ ...categoryForm, name: e.target.value })}
                placeholder="Ex: Lanches"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) => onFormChange({ ...categoryForm, description: e.target.value })}
                placeholder="Descrição opcional"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            {editingCategory && (
              <Button type="button" variant="destructive" onClick={() => onDelete(editingCategory.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </Button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
