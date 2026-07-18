import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Wallet, Plus, Minus, Ban, Play, Loader2, Activity, TrendingUp, Clock, Coins, Settings2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

type SystemStatus = "active" | "blocked" | "suspended";

interface AISystem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: SystemStatus;
  provider: string;
  default_model: string;
}

interface AIWallet {
  system_id: string;
  available_credits: number;
  used_credits: number;
  monthly_limit: number | null;
  daily_limit: number | null;
  last_used_at: string | null;
}

interface AITx {
  id: string;
  system_id: string;
  type: string;
  amount: number;
  model: string | null;
  tokens_input: number | null;
  tokens_output: number | null;
  estimated_cost_usd: number | null;
  created_at: string;
}

export function AISystemsWalletPanel() {
  const qc = useQueryClient();
  const [selectedSystem, setSelectedSystem] = useState<AISystem | null>(null);
  const [adjustAmount, setAdjustAmount] = useState("");
  const [dailyLimit, setDailyLimit] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");

  const { data: systems, isLoading: sLoading } = useQuery({
    queryKey: ["ai_systems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_systems" as any)
        .select("*")
        .order("status", { ascending: true })
        .order("name");
      if (error) throw error;
      return data as unknown as AISystem[];
    },
  });

  const { data: wallets } = useQuery({
    queryKey: ["ai_system_wallets"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_system_wallets" as any).select("*");
      if (error) throw error;
      return data as unknown as AIWallet[];
    },
  });

  const { data: txs } = useQuery({
    queryKey: ["ai_system_transactions", selectedSystem?.id],
    enabled: !!selectedSystem,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_system_transactions" as any)
        .select("*")
        .eq("system_id", selectedSystem!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as AITx[];
    },
  });

  const adjust = useMutation({
    mutationFn: async ({ slug, amount, reason }: { slug: string; amount: number; reason: string }) => {
      const { error } = await supabase.rpc("ai_credit_adjust" as any, {
        _system_slug: slug, _amount: amount, _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Créditos atualizados");
      await Promise.all([
        qc.refetchQueries({ queryKey: ["ai_system_wallets"] }),
        qc.refetchQueries({ queryKey: ["ai_system_transactions"] }),
      ]);
      setAdjustAmount("");
    },
    onError: (e: any) => toast.error(e.message ?? "Falha ao ajustar créditos"),
  });

  const setStatus = useMutation({
    mutationFn: async ({ slug, status }: { slug: string; status: SystemStatus }) => {
      const { error } = await supabase.rpc("ai_system_set_status" as any, {
        _system_slug: slug, _status: status,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Status atualizado");
      await qc.refetchQueries({ queryKey: ["ai_systems"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Falha"),
  });

  const updateLimits = useMutation({
    mutationFn: async ({ slug, daily, monthly }: { slug: string; daily: number | null; monthly: number | null }) => {
      const { error } = await supabase.rpc("ai_system_update_limits" as any, {
        _system_slug: slug, _daily: daily, _monthly: monthly,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Limites atualizados");
      await qc.refetchQueries({ queryKey: ["ai_system_wallets"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Falha"),
  });

  const getWallet = (id: string) => wallets?.find((w) => w.system_id === id);

  if (sLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Carteiras de IA por Sistema
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cada sistema tem carteira independente. Nenhum sistema consome créditos de outro.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {systems?.map((sys) => {
          const w = getWallet(sys.id);
          const available = Number(w?.available_credits ?? 0);
          const used = Number(w?.used_credits ?? 0);
          return (
            <Card key={sys.id} className={sys.status !== "active" ? "opacity-70" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{sys.name}</CardTitle>
                    <p className="text-xs text-muted-foreground font-mono">{sys.slug}</p>
                  </div>
                  <Badge
                    variant={
                      sys.status === "active" ? "default" :
                      sys.status === "blocked" ? "destructive" : "secondary"
                    }
                  >
                    {sys.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded bg-muted/50 p-2">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Coins className="h-3 w-3" /> Disponível
                    </div>
                    <div className="font-bold text-lg text-primary">{available.toFixed(0)}</div>
                  </div>
                  <div className="rounded bg-muted/50 p-2">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Usado
                    </div>
                    <div className="font-bold text-lg">{used.toFixed(0)}</div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1">
                    <Activity className="h-3 w-3" /> Modelo: <span className="font-mono">{sys.default_model}</span>
                  </div>
                  {w?.last_used_at && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Último uso:{" "}
                      {formatDistanceToNow(new Date(w.last_used_at), { addSuffix: true, locale: ptBR })}
                    </div>
                  )}
                  {(w?.daily_limit || w?.monthly_limit) && (
                    <div>
                      Limites: {w?.daily_limit ?? "∞"}/dia · {w?.monthly_limit ?? "∞"}/mês
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => setSelectedSystem(sys)}>
                        <Plus className="h-3 w-3 mr-1" /> Créditos
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Ajustar créditos — {sys.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <Label>Quantidade (use negativo para remover)</Label>
                        <Input
                          type="number"
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                          placeholder="Ex: 100 ou -50"
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => adjust.mutate({
                            slug: sys.slug,
                            amount: Number(adjustAmount),
                            reason: "manual admin",
                          })}
                          disabled={!adjustAmount || adjust.isPending}
                        >
                          {adjust.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aplicar"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {sys.status === "active" ? (
                    <Button
                      size="sm" variant="destructive"
                      onClick={() => setStatus.mutate({ slug: sys.slug, status: "blocked" })}
                    >
                      <Ban className="h-3 w-3 mr-1" /> Bloquear
                    </Button>
                  ) : (
                    <Button
                      size="sm" variant="default"
                      onClick={() => setStatus.mutate({ slug: sys.slug, status: "active" })}
                    >
                      <Play className="h-3 w-3 mr-1" /> Ativar
                    </Button>
                  )}

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" onClick={() => {
                        setSelectedSystem(sys);
                        setDailyLimit(w?.daily_limit?.toString() ?? "");
                        setMonthlyLimit(w?.monthly_limit?.toString() ?? "");
                      }}>
                        <Settings2 className="h-3 w-3 mr-1" /> Limites
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Limites — {sys.name}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div>
                          <Label>Limite diário (vazio = sem limite)</Label>
                          <Input type="number" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} />
                        </div>
                        <div>
                          <Label>Limite mensal</Label>
                          <Input type="number" value={monthlyLimit} onChange={(e) => setMonthlyLimit(e.target.value)} />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => updateLimits.mutate({
                            slug: sys.slug,
                            daily: dailyLimit ? Number(dailyLimit) : null,
                            monthly: monthlyLimit ? Number(monthlyLimit) : null,
                          })}
                          disabled={updateLimits.isPending}
                        >
                          Salvar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedSystem(sys)}>
                        Histórico
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Transações — {sys.name}</DialogTitle>
                      </DialogHeader>
                      <div className="overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Modelo</TableHead>
                              <TableHead>Tokens</TableHead>
                              <TableHead className="text-right">Créditos</TableHead>
                              <TableHead className="text-right">Custo USD</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {txs?.map((t) => (
                              <TableRow key={t.id}>
                                <TableCell className="text-xs">
                                  {new Date(t.created_at).toLocaleString("pt-BR")}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{t.type}</Badge>
                                </TableCell>
                                <TableCell className="text-xs font-mono">{t.model ?? "—"}</TableCell>
                                <TableCell className="text-xs">
                                  {(t.tokens_input ?? 0) + (t.tokens_output ?? 0)}
                                </TableCell>
                                <TableCell className={`text-right font-mono ${Number(t.amount) < 0 ? "text-destructive" : "text-primary"}`}>
                                  {Number(t.amount).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right text-xs">
                                  ${Number(t.estimated_cost_usd ?? 0).toFixed(6)}
                                </TableCell>
                              </TableRow>
                            ))}
                            {!txs?.length && (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                                  Nenhuma transação
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
