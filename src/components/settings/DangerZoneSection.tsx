import { useState } from "react";
import { AlertTriangle, Trash2, Loader2, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface DangerZoneSectionProps {
  unitId: string;
  unitName: string;
  onResetComplete: () => void;
}

export function DangerZoneSection({ unitId, unitName, onResetComplete }: DangerZoneSectionProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [showCounterConfirm, setShowCounterConfirm] = useState(false);
  const [isResettingCounter, setIsResettingCounter] = useState(false);

  const handleFirstConfirm = () => {
    if (confirmText.trim().toLowerCase() !== unitName.trim().toLowerCase()) {
      toast({ title: "Nome incorreto", description: "Digite o nome exato da unidade para confirmar.", variant: "destructive" });
      return;
    }
    setShowConfirm(false);
    setShowFinalConfirm(true);
  };

  const handleReset = async () => {
    if (!user) return;
    setIsResetting(true);
    try {
      const { error } = await supabase.rpc("reset_unit_data", {
        _unit_id: unitId,
        _user_id: user.id,
      });

      if (error) throw error;

      toast({ title: "Unidade resetada", description: "Todos os dados operacionais foram removidos com sucesso." });
      onResetComplete();
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Erro ao resetar", description: err.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setIsResetting(false);
      setShowFinalConfirm(false);
      setConfirmText("");
    }
  };

  const handleResetCounter = async () => {
    if (!user) return;
    setIsResettingCounter(true);
    try {
      const { error } = await supabase.rpc("reset_order_counter", {
        _unit_id: unitId,
        _user_id: user.id,
      });
      if (error) throw error;
      toast({ title: "Contador resetado", description: "O próximo pedido começará do #1." });
    } catch (err: any) {
      toast({ title: "Erro ao resetar contador", description: err.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setIsResettingCounter(false);
      setShowCounterConfirm(false);
    }
  };

  return (
    <>
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Zona de Perigo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Resetar a unidade apaga <strong>todos</strong> os dados operacionais (pedidos, produtos, mesas, estoque, conversas, etc.)
            e mantém apenas a unidade e os usuários associados. Esta ação é <strong>irreversível</strong>.
          </p>
          <Button
            variant="destructive"
            onClick={() => setShowConfirm(true)}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Resetar Unidade
          </Button>
        </CardContent>
      </Card>

      <Card className="border-warning/50 bg-warning/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <RotateCcw className="h-5 w-5" />
            Resetar Contador de Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Reseta a numeração dos pedidos para que o próximo pedido criado seja o <strong>#1</strong>.
            Os pedidos existentes não serão apagados.
          </p>
          <p className="text-xs text-destructive/80 font-medium">
            ⚠️ Atenção: O contador é global e compartilhado entre todas as unidades do sistema.
            Resetar afetará a numeração de todas as unidades.
          </p>
          <Button
            variant="outline"
            onClick={() => setShowCounterConfirm(true)}
            className="gap-2 border-warning text-warning hover:bg-warning/10"
          >
            <RotateCcw className="h-4 w-4" />
            Resetar Contador
          </Button>
        </CardContent>
      </Card>

      {/* Counter reset confirmation */}
      <AlertDialog open={showCounterConfirm} onOpenChange={setShowCounterConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Resetar Contador de Pedidos?
            </AlertDialogTitle>
            <AlertDialogDescription>
              O próximo pedido criado será o <strong>#1</strong>. Os pedidos existentes não serão afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResettingCounter}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetCounter}
              disabled={isResettingCounter}
            >
              {isResettingCounter ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetando...
                </>
              ) : (
                "Sim, resetar contador"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Step 1: Type unit name */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Resetar "{unitName}"
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <span className="block">
                Todos os pedidos, produtos, mesas, estoque, conversas WhatsApp, notificações e configurações serão apagados permanentemente.
              </span>
              <span className="block font-medium text-foreground">
                Digite <strong>{unitName}</strong> para confirmar:
              </span>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Nome da unidade"
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmText("")}>Cancelar</AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleFirstConfirm}
              disabled={confirmText.trim().toLowerCase() !== unitName.trim().toLowerCase()}
            >
              Continuar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Step 2: Final confirmation */}
      <AlertDialog open={showFinalConfirm} onOpenChange={setShowFinalConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é <strong>irreversível</strong>. Todos os dados operacionais da unidade "{unitName}" serão permanentemente apagados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting} onClick={() => setConfirmText("")}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              disabled={isResetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isResetting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetando...
                </>
              ) : (
                "Sim, resetar tudo"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
