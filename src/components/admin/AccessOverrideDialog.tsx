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
import { Shield, Loader2, CalendarClock } from "lucide-react";
import { toast } from "sonner";

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

export function AccessOverrideDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  currentOverride,
}: AccessOverrideDialogProps) {
  const queryClient = useQueryClient();
  const hasActiveOverride = !!currentOverride;

  const [grantAccess, setGrantAccess] = useState(hasActiveOverride);
  const [tier, setTier] = useState(currentOverride?.tier || "pro");
  const [days, setDays] = useState<string>("");
  const [indefinite, setIndefinite] = useState(!currentOverride?.expires_at);
  const [notes, setNotes] = useState(currentOverride?.notes || "");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!grantAccess) {
        return callOverrideFunction("revoke", { user_id: customerId });
      }
      return callOverrideFunction("grant", {
        user_id: customerId,
        tier,
        days: indefinite ? null : (days ? parseInt(days) : 30),
        notes: notes || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-access-overrides"] });
      toast.success(grantAccess ? "Acesso liberado com sucesso!" : "Acesso revogado!");
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(`Erro: ${err.message}`);
    },
  });

  const expiresAt = currentOverride?.expires_at
    ? new Date(currentOverride.expires_at).toLocaleDateString("pt-BR")
    : null;

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

        {hasActiveOverride && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border">
            <CalendarClock className="h-4 w-4 text-foreground shrink-0" />
            <div className="text-sm">
              <span className="font-medium">Override ativo</span>
              {expiresAt && (
                <span className="text-muted-foreground ml-1">— expira em {expiresAt}</span>
              )}
              {!currentOverride?.expires_at && (
                <span className="text-muted-foreground ml-1">— indefinido</span>
              )}
            </div>
          </div>
        )}

        <div className="space-y-5">
          {/* Toggle liberar/bloquear */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/60">
            <div>
              <Label className="text-sm font-medium">Liberar Acesso</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {grantAccess ? "Acesso liberado manualmente" : "Acesso bloqueado"}
              </p>
            </div>
            <Switch checked={grantAccess} onCheckedChange={setGrantAccess} />
          </div>

          {grantAccess && (
            <>
              {/* Plano */}
              <div className="space-y-1.5">
                <Label>Plano</Label>
                <Select value={tier} onValueChange={setTier}>
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

              {/* Duração */}
              <div className="space-y-1.5">
                <Label>Duração</Label>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={indefinite}
                    onCheckedChange={setIndefinite}
                    id="indefinite"
                  />
                  <label htmlFor="indefinite" className="text-sm cursor-pointer select-none">
                    Indefinido
                  </label>
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
                    />
                    <span className="text-sm text-muted-foreground">dias a partir de agora</span>
                  </div>
                )}
              </div>

              {/* Observações */}
              <div className="space-y-1.5">
                <Label>Observações (opcional)</Label>
                <Textarea
                  placeholder="Ex: Cliente pediu extensão do trial..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none"
                  rows={2}
                />
              </div>
            </>
          )}

          {!grantAccess && hasActiveOverride && (
            <div className="text-sm text-muted-foreground p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              O override ativo será revogado e o cliente voltará a precisar de uma assinatura válida.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
