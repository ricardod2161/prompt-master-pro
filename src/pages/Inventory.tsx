import { useState } from "react";
import { format } from "date-fns";
import { Package, Plus, Minus, AlertTriangle, History, Edit, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useInventory,
  useInventoryMovements,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useAddInventoryMovement,
  useDeleteInventoryItem,
  type InventoryItem,
  type InventoryMovementType,
} from "@/hooks/useInventory";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

const movementTypes: { value: InventoryMovementType; label: string }[] = [
  { value: "purchase", label: "Compra (Entrada)" },
  { value: "adjustment", label: "Ajuste" },
  { value: "waste", label: "Perda/Desperdício" },
  { value: "transfer", label: "Transferência" },
];

export default function Inventory() {
  const { data: items, isLoading } = useInventory();
  const createItem = useCreateInventoryItem();
  const updateItem = useUpdateInventoryItem();
  const addMovement = useAddInventoryMovement();
  const deleteItem = useDeleteInventoryItem();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [unitMeasure, setUnitMeasure] = useState("");
  const [minStock, setMinStock] = useState("");
  const [costPerUnit, setCostPerUnit] = useState("");
  const [currentStock, setCurrentStock] = useState("");

  // Movement form
  const [movementType, setMovementType] = useState<InventoryMovementType>("purchase");
  const [movementQuantity, setMovementQuantity] = useState("");
  const [movementNotes, setMovementNotes] = useState("");

  const { data: movements } = useInventoryMovements(selectedItem?.id);

  const lowStockItems = items?.filter(
    (item) => item.min_stock && item.current_stock <= item.min_stock
  ) || [];

  const resetForm = () => {
    setName("");
    setUnitMeasure("");
    setMinStock("");
    setCostPerUnit("");
    setCurrentStock("");
  };

  const handleCreateItem = async () => {
    await createItem.mutateAsync({
      name,
      unit_measure: unitMeasure,
      current_stock: parseFloat(currentStock) || 0,
      min_stock: parseFloat(minStock) || 0,
      cost_per_unit: parseFloat(costPerUnit) || 0,
    });
    setCreateDialogOpen(false);
    resetForm();
  };

  const handleEditItem = async () => {
    if (!selectedItem) return;
    await updateItem.mutateAsync({
      id: selectedItem.id,
      name,
      unit_measure: unitMeasure,
      min_stock: parseFloat(minStock) || 0,
      cost_per_unit: parseFloat(costPerUnit) || 0,
    });
    setEditDialogOpen(false);
    setSelectedItem(null);
    resetForm();
  };

  const handleAddMovement = async () => {
    if (!selectedItem) return;
    await addMovement.mutateAsync({
      itemId: selectedItem.id,
      type: movementType,
      quantity: parseFloat(movementQuantity) || 0,
      notes: movementNotes || undefined,
    });
    setMovementDialogOpen(false);
    setSelectedItem(null);
    setMovementQuantity("");
    setMovementNotes("");
  };

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setName(item.name);
    setUnitMeasure(item.unit_measure);
    setMinStock(item.min_stock?.toString() || "");
    setCostPerUnit(item.cost_per_unit?.toString() || "");
    setEditDialogOpen(true);
  };

  const openMovementDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setMovementDialogOpen(true);
  };

  const openHistoryDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setHistoryDialogOpen(true);
  };

  if (isLoading) {
    return <LoadingSkeleton variant="table" count={10} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Estoque</h1>
          <p className="text-muted-foreground">
            {items?.length || 0} insumos cadastrados
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Insumo
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Estoque Baixo ({lowStockItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockItems.map((item) => (
                <Badge key={item.id} variant="destructive">
                  {item.name}: {item.current_stock} {item.unit_measure}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items Table */}
      {!items?.length ? (
        <EmptyState
          icon={Package}
          title="Nenhum insumo cadastrado"
          description="Adicione insumos para controlar seu estoque"
          action={
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Insumo
            </Button>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Estoque Atual</TableHead>
                <TableHead>Estoque Mínimo</TableHead>
                <TableHead>Custo Unit.</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => {
                const isLow = item.min_stock && item.current_stock <= item.min_stock;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.unit_measure}</TableCell>
                    <TableCell>
                      <span className={cn(isLow && "text-destructive font-bold")}>
                        {item.current_stock}
                      </span>
                      {isLow && <AlertTriangle className="inline h-4 w-4 ml-1 text-destructive" />}
                    </TableCell>
                    <TableCell>{item.min_stock || "-"}</TableCell>
                    <TableCell>
                      {item.cost_per_unit ? `R$ ${item.cost_per_unit.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openMovementDialog(item)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openHistoryDialog(item)}
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover {item.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteItem.mutate(item.id)}
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Item Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Insumo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Farinha de Trigo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unidade de Medida</Label>
                <Input
                  placeholder="Ex: kg, un, ml"
                  value={unitMeasure}
                  onChange={(e) => setUnitMeasure(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Estoque Inicial</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={currentStock}
                  onChange={(e) => setCurrentStock(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estoque Mínimo</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Custo por Unidade</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateItem} disabled={createItem.isPending || !name || !unitMeasure}>
              {createItem.isPending ? "Criando..." : "Criar Insumo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Insumo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Unidade de Medida</Label>
                <Input
                  value={unitMeasure}
                  onChange={(e) => setUnitMeasure(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Estoque Mínimo</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Custo por Unidade</Label>
              <Input
                type="number"
                step="0.01"
                value={costPerUnit}
                onChange={(e) => setCostPerUnit(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditItem} disabled={updateItem.isPending}>
              {updateItem.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentação - {selectedItem?.name}</DialogTitle>
            <DialogDescription>
              Estoque atual: {selectedItem?.current_stock} {selectedItem?.unit_measure}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={movementType} onValueChange={(v) => setMovementType(v as InventoryMovementType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {movementTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0"
                value={movementQuantity}
                onChange={(e) => setMovementQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Motivo da movimentação..."
                value={movementNotes}
                onChange={(e) => setMovementNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddMovement} disabled={addMovement.isPending || !movementQuantity}>
              {addMovement.isPending ? "Registrando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Histórico - {selectedItem?.name}</DialogTitle>
          </DialogHeader>
          {movements && movements.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead>Estoque Anterior</TableHead>
                  <TableHead>Estoque Novo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell>
                      {format(new Date(mov.created_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="capitalize">{mov.type}</TableCell>
                    <TableCell>{mov.quantity}</TableCell>
                    <TableCell>{mov.previous_stock}</TableCell>
                    <TableCell>{mov.new_stock}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={History}
              title="Sem movimentações"
              description="O histórico de movimentações aparecerá aqui"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
