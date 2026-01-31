import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Lock,
  Unlock,
  History,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useCashRegister,
  useOpenCashRegister,
  useCloseCashRegister,
  useAddCashMovement,
  type CashMovementType,
} from "@/hooks/useCashRegister";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

const movementTypeLabels: Record<CashMovementType, { label: string; icon: React.ElementType; color: string }> = {
  opening: { label: "Abertura", icon: Unlock, color: "text-blue-600" },
  sale: { label: "Venda", icon: TrendingUp, color: "text-green-600" },
  withdrawal: { label: "Sangria", icon: TrendingDown, color: "text-red-600" },
  deposit: { label: "Suprimento", icon: Plus, color: "text-green-600" },
  closing: { label: "Fechamento", icon: Lock, color: "text-gray-600" },
};

export default function Cashier() {
  const { data: cashRegister, isLoading } = useCashRegister();
  const openCashRegister = useOpenCashRegister();
  const closeCashRegister = useCloseCashRegister();
  const addCashMovement = useAddCashMovement();

  const [openDialogOpen, setOpenDialogOpen] = useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);

  const [initialAmount, setInitialAmount] = useState("");
  const [finalAmount, setFinalAmount] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [movementType, setMovementType] = useState<"withdrawal" | "deposit">("withdrawal");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementDescription, setMovementDescription] = useState("");

  const isOpen = cashRegister && !cashRegister.closed_at;

  const currentBalance = cashRegister?.movements?.reduce((sum, mov) => {
    if (mov.type === "withdrawal") return sum - mov.amount;
    return sum + mov.amount;
  }, 0) || 0;

  const totalSales = cashRegister?.movements
    ?.filter((m) => m.type === "sale")
    .reduce((sum, m) => sum + m.amount, 0) || 0;

  const totalWithdrawals = cashRegister?.movements
    ?.filter((m) => m.type === "withdrawal")
    .reduce((sum, m) => sum + m.amount, 0) || 0;

  const totalDeposits = cashRegister?.movements
    ?.filter((m) => m.type === "deposit")
    .reduce((sum, m) => sum + m.amount, 0) || 0;

  const handleOpenCashRegister = async () => {
    await openCashRegister.mutateAsync(parseFloat(initialAmount) || 0);
    setOpenDialogOpen(false);
    setInitialAmount("");
  };

  const handleCloseCashRegister = async () => {
    if (!cashRegister) return;
    await closeCashRegister.mutateAsync({
      registerId: cashRegister.id,
      finalAmount: parseFloat(finalAmount) || 0,
      notes: closeNotes || undefined,
    });
    setCloseDialogOpen(false);
    setFinalAmount("");
    setCloseNotes("");
  };

  const handleAddMovement = async () => {
    if (!cashRegister) return;
    await addCashMovement.mutateAsync({
      registerId: cashRegister.id,
      type: movementType,
      amount: parseFloat(movementAmount) || 0,
      description: movementDescription || undefined,
    });
    setMovementDialogOpen(false);
    setMovementAmount("");
    setMovementDescription("");
  };

  if (isLoading) {
    return <LoadingSkeleton variant="card" count={4} />;
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className={cn(
        "border-2",
        isOpen ? "border-green-500 bg-green-500/5" : "border-muted"
      )}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                isOpen ? "bg-green-500/20" : "bg-muted"
              )}>
                {isOpen ? (
                  <Unlock className="h-6 w-6 text-green-600" />
                ) : (
                  <Lock className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <CardTitle>
                  {isOpen ? "Caixa Aberto" : "Caixa Fechado"}
                </CardTitle>
                <CardDescription>
                  {isOpen && cashRegister
                    ? `Aberto em ${format(new Date(cashRegister.opened_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`
                    : "Abra o caixa para iniciar as operações"}
                </CardDescription>
              </div>
            </div>
            {!isOpen ? (
              <Button onClick={() => setOpenDialogOpen(true)}>
                <Unlock className="h-4 w-4 mr-2" />
                Abrir Caixa
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setMovementDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Movimentação
                </Button>
                <Button variant="destructive" onClick={() => setCloseDialogOpen(true)}>
                  <Lock className="h-4 w-4 mr-2" />
                  Fechar Caixa
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {isOpen && cashRegister && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Saldo Atual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {currentBalance.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Vendas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {totalSales.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Sangrias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  R$ {totalWithdrawals.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Suprimentos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  R$ {totalDeposits.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Movements Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Movimentações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cashRegister.movements && cashRegister.movements.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashRegister.movements
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((movement) => {
                        const config = movementTypeLabels[movement.type];
                        const Icon = config.icon;
                        const isNegative = movement.type === "withdrawal";

                        return (
                          <TableRow key={movement.id}>
                            <TableCell>
                              {format(new Date(movement.created_at), "HH:mm")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Icon className={cn("h-4 w-4", config.color)} />
                                <span>{config.label}</span>
                              </div>
                            </TableCell>
                            <TableCell>{movement.description || "-"}</TableCell>
                            <TableCell className={cn(
                              "text-right font-medium",
                              isNegative ? "text-red-600" : "text-green-600"
                            )}>
                              {isNegative ? "-" : "+"} R$ {movement.amount.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState
                  icon={History}
                  title="Nenhuma movimentação"
                  description="As movimentações do caixa aparecerão aqui"
                />
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Open Cash Register Dialog */}
      <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Valor Inicial (Troco)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleOpenCashRegister} disabled={openCashRegister.isPending}>
              {openCashRegister.isPending ? "Abrindo..." : "Abrir Caixa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Close Cash Register Dialog */}
      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Caixa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Saldo Esperado</p>
              <p className="text-2xl font-bold">R$ {currentBalance.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <Label>Valor Contado</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={finalAmount}
                onChange={(e) => setFinalAmount(e.target.value)}
              />
            </div>
            {finalAmount && parseFloat(finalAmount) !== currentBalance && (
              <div className={cn(
                "p-3 rounded-lg",
                parseFloat(finalAmount) > currentBalance ? "bg-green-500/10" : "bg-red-500/10"
              )}>
                <p className="text-sm font-medium">
                  Diferença: R$ {(parseFloat(finalAmount) - currentBalance).toFixed(2)}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                placeholder="Observações do fechamento..."
                value={closeNotes}
                onChange={(e) => setCloseNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleCloseCashRegister}
              disabled={closeCashRegister.isPending || !finalAmount}
            >
              {closeCashRegister.isPending ? "Fechando..." : "Confirmar Fechamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Movement Dialog */}
      <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Movimentação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={movementType} onValueChange={(v) => setMovementType(v as "withdrawal" | "deposit")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="withdrawal">Sangria (Retirada)</SelectItem>
                  <SelectItem value="deposit">Suprimento (Entrada)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={movementAmount}
                onChange={(e) => setMovementAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                placeholder="Motivo da movimentação..."
                value={movementDescription}
                onChange={(e) => setMovementDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAddMovement}
              disabled={addCashMovement.isPending || !movementAmount}
            >
              {addCashMovement.isPending ? "Salvando..." : "Registrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
