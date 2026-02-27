import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Shield, Loader2, CalendarClock, ShieldOff, ShieldCheck, Plus, Clock } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AccessOverride {
  id: string;
  user_id: string;
  tier: string;
  is_active: boolean;
  expires_at: string | null;
  notes: string | null;
}

interface AccessOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  currentOverride: AccessOverride | null;
}

async function callOverrideFunction(action: string, payload: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const url = `https://${projectId}.supabase.co/functions/v1/admin-access-override`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function AccessStatusBadge({ override }: { override: AccessOverride | null }) {
  if (!override) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
        <ShieldOff className="h-4 w-4 text-muted-foreground shrink-0" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">Sem override ativo</p>
          <p className="text-xs text-muted-foreground">Acesso depende de assinatura</p>
        </div>
      </div>
    );
  }

  const isExpired = override.expires_at ? new Date(override.expires_at) < new Date() : false;
  const daysLeft = override.expires_at ? differenceInDays(new Date(override.expires_at), new Date()) : null;

  if (isExpired) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
        <ShieldOff className="h-4 w-4 text-destructive shrink-0" />
        <div>
          <p className="text-sm font-medium text-destructive">Override expirado</p>
          <p className="text-xs text-destructive/70">
            Expirou em {format(new Date(override.expires_at!), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
      <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-emerald-700">
            Override ativo · {override.tier.charAt(0).toUpperCase() + override.tier.slice(1)}
          </p>
          {daysLeft !== null ? (
            <Badge className="text-xs bg-amber-500/10 text-amber-700 border-amber-500/30 border">
              <Clock className="h-3 w-3 mr-1" />
              {daysLeft <= 0 ? "Expira hoje" : `${daysLeft} dia${daysLeft !== 1 ? "s" : ""} restante${daysLeft !== 1 ? "s" : ""}`}
            </Badge>
          ) : (
            <Badge className="text-xs bg-emerald-500/10 text-emerald-700 border-emerald-500/30 border">
              Indefinido
            </Badge>
          )}
        </div>
        {override.expires_at && (
          <p className="text-xs text-emerald-600/70 mt-0.5">
            Expira em {format(new Date(override.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        )}
      </div>
    </div>
  );
}

export function AccessOverrideDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  currentOverride,
}: AccessOverrideDialogProps) {
  const queryClient = useQueryClient();
  const isExpired = currentOverride?.expires_at ? new Date(currentOverride.expires_at) < new Date() : false;
  const hasActiveOverride = !!currentOverride && !isExpired;

  const [tier, setTier] = useState(currentOverride?.tier || "pro");
  const [days, setDays] = useState<string>("");
  const [indefinite, setIndefinite] = useState(!currentOverride?.expires_at);
  const [notes, setNotes] = useState(currentOverride?.notes || "");

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-access-overrides"] });
  };

  const extendMutation = useMutation({
    mutationFn: (d: number) =>
      callOverrideFunction("extend", { user_id: customerId, days: d }),
    onSuccess: (_, d) => {
      invalidate();
      toast.success(`+${d} dias adicionados com sucesso!`);
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const grantMutation = useMutation({
    mutationFn: () =>
      callOverrideFunction("grant", {
        user_id: customerId,
        tier,
        days: indefinite ? null : (days ? parseInt(days) : 30),
        notes: notes || null,
      }),
    onSuccess: () => {
      invalidate();
      toast.success("Acesso liberado com sucesso!");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const revokeMutation = useMutation({
    mutationFn: () =>
      callOverrideFunction("revoke", { user_id: customerId }),
    onSuccess: () => {
      invalidate();
      toast.success("Acesso bloqueado!");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(`Erro: ${err.message}`),
  });

  const isLoading = extendMutation.isPending || grantMutation.isPending || revokeMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Gerenciar Acesso
          </DialogTitle>
          <DialogDescription>
            Controle manual de acesso para <strong>{customerName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Status atual */}
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Status Atual</Label>
            <AccessStatusBadge override={currentOverride} />
          </div>

          {/* Ações rápidas — adicionar dias */}
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground mb-2 block">Adicionar Dias de Trial</Label>
            <div className="flex gap-2">
              {[7, 14, 30].map((d) => (
                <Button
                  key={d}
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1"
                  disabled={isLoading}
                  onClick={() => extendMutation.mutate(d)}
                >
                  {extendMutation.isPending && extendMutation.variables === d ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Plus className="h-3 w-3" />
                  )}
                  {d} dias
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Configurar acesso completo */}
          <div className="space-y-4">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground block">Configurar Acesso</Label>

            <div className="space-y-1.5">
              <Label>Plano</Label>
              <Select value={tier} onValueChange={setTier} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Duração</Label>
              <div className="flex items-center gap-3">
                <Switch checked={indefinite} onCheckedChange={setIndefinite} id="indefinite" disabled={isLoading} />
                <label htmlFor="indefinite" className="text-sm cursor-pointer select-none">Indefinido</label>
              </div>
              {!indefinite && (
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="number"
                    min="1"
                    max="365"
                    placeholder="30"
                    value={days}
                    onChange={(e) => setDays(e.target.value)}
                    className="w-28"
                    disabled={isLoading}
                  />
                  <span className="text-sm text-muted-foreground">dias a partir de agora</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Observações (opcional)</Label>
              <Textarea
                placeholder="Ex: Cliente pediu extensão do trial..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none"
                rows={2}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              onClick={() => grantMutation.mutate()}
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {grantMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <ShieldCheck className="h-4 w-4 mr-1" />
              Liberar Acesso
            </Button>
          </div>

          {hasActiveOverride && (
            <Button
              variant="destructive"
              onClick={() => revokeMutation.mutate()}
              disabled={isLoading}
              className="w-full"
            >
              {revokeMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <ShieldOff className="h-4 w-4 mr-1" />
              Bloquear Acesso
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
