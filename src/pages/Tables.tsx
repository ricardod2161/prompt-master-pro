import { useState } from "react";
import { QrCode, Plus, Trash2, RefreshCw, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useTables, useCreateTable, useDeleteTable, useUpdateTableStatus, useGenerateQRCode, type TableStatus } from "@/hooks/useTables";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const statusColors: Record<TableStatus, string> = {
  free: "border-green-500 bg-green-500/10",
  occupied: "border-blue-500 bg-blue-500/10",
  pending_order: "border-yellow-500 bg-yellow-500/10",
};

export default function Tables() {
  const { data: tables, isLoading } = useTables();
  const createTable = useCreateTable();
  const deleteTable = useDeleteTable();
  const updateTableStatus = useUpdateTableStatus();
  const generateQRCode = useGenerateQRCode();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [selectedTableQR, setSelectedTableQR] = useState<{ number: number; qr_code: string } | null>(null);

  const handleCreateTable = async () => {
    const number = parseInt(tableNumber);
    if (isNaN(number) || number < 1) {
      toast({ title: "Número inválido", variant: "destructive" });
      return;
    }

    if (tables?.some((t) => t.number === number)) {
      toast({ title: "Mesa já existe", variant: "destructive" });
      return;
    }

    await createTable.mutateAsync(number);
    setCreateDialogOpen(false);
    setTableNumber("");
  };

  const handleGenerateQR = async (tableId: string, tableNumber: number) => {
    const qrCode = await generateQRCode.mutateAsync(tableId);
    setSelectedTableQR({ number: tableNumber, qr_code: qrCode });
    setQrDialogOpen(true);
  };

  const handleCopyQR = () => {
    if (selectedTableQR?.qr_code) {
      navigator.clipboard.writeText(selectedTableQR.qr_code);
      toast({ title: "Link copiado!" });
    }
  };

  const handleToggleStatus = (tableId: string, currentStatus: TableStatus) => {
    const newStatus: TableStatus = currentStatus === "free" ? "occupied" : "free";
    updateTableStatus.mutate({ tableId, status: newStatus });
  };

  if (isLoading) {
    return <LoadingSkeleton variant="grid" count={8} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Mesas</h1>
          <p className="text-muted-foreground">
            {tables?.length || 0} mesas cadastradas
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Mesa
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-green-500 bg-green-500/20" />
          <span>Livre</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-500/20" />
          <span>Ocupada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded border-2 border-yellow-500 bg-yellow-500/20" />
          <span>Aguardando Pedido</span>
        </div>
      </div>

      {!tables?.length ? (
        <EmptyState
          icon={QrCode}
          title="Nenhuma mesa cadastrada"
          description="Adicione mesas para gerenciar seu salão"
          action={
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Mesa
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {tables
            .sort((a, b) => a.number - b.number)
            .map((table) => (
              <Card
                key={table.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md border-2",
                  statusColors[table.status || "free"]
                )}
                onClick={() => handleToggleStatus(table.id, table.status || "free")}
              >
                <CardContent className="p-4">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-2">Mesa {table.number}</h3>
                    <StatusBadge status={table.status || "free"} />
                  </div>

                  <div className="flex gap-1 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateQR(table.id, table.number);
                      }}
                    >
                      <QrCode className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover Mesa {table.number}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteTable.mutate(table.id)}
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Create Table Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Mesa</DialogTitle>
            <DialogDescription>
              Adicione uma nova mesa ao seu estabelecimento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Número da Mesa</Label>
              <Input
                type="number"
                min="1"
                placeholder="Ex: 1"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateTable} disabled={createTable.isPending}>
              {createTable.isPending ? "Criando..." : "Criar Mesa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code - Mesa {selectedTableQR?.number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-8 bg-white rounded-lg flex items-center justify-center">
              <div className="w-48 h-48 bg-muted flex items-center justify-center rounded-lg">
                <QrCode className="h-32 w-32 text-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input value={selectedTableQR?.qr_code || ""} readOnly />
              <Button variant="outline" size="icon" onClick={handleCopyQR}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Escaneie este código para fazer pedidos nesta mesa
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
