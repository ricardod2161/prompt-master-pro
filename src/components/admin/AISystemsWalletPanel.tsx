import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Wallet, Plus, Minus, Ban, Play, Loader2, Activity, TrendingUp, Clock, Coins,
  Settings2, RefreshCw, Search, DollarSign, Zap, AlertTriangle, History, CheckCircle2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
  response_time_ms: number | null;
  created_at: string;
}

type StatusFilter = "all" | SystemStatus;

const STATUS_LABEL: Record<SystemStatus, string> = {
  active: "Ativo",
  blocked: "Bloqueado",
  suspended: "Suspenso",
};

export function AISystemsWalletPanel() {
  const qc = useQueryClient();
  const [selectedSystem, setSelectedSystem] = useState<AISystem | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [removeAmount, setRemoveAmount] = useState("");
  const [dailyLimit, setDailyLimit] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [historyPage, setHistoryPage] = useState(0);
  const HISTORY_PAGE_SIZE = 25;
  const [openDialog, setOpenDialog] = useState<
    | { type: "add" | "remove" | "limits" | "history"; systemId: string }
    | null
  >(null);


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

  // Aggregate stats for today across all systems (single query, cheap)
  const { data: todayTx } = useQuery({
    queryKey: ["ai_system_tx_today"],
    queryFn: async () => {
      const since = new Date();
      since.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("ai_system_transactions" as any)
        .select("system_id,amount,estimated_cost_usd,tokens_input,tokens_output,type")
        .gte("created_at", since.toISOString());
      if (error) throw error;
      return data as unknown as AITx[];
    },
    refetchInterval: 60_000,
  });

  const { data: txsPage } = useQuery({
    queryKey: ["ai_system_transactions", selectedSystem?.id, historyPage],
    enabled: !!selectedSystem && openDialog?.type === "history",
    queryFn: async () => {
      const from = historyPage * HISTORY_PAGE_SIZE;
      const to = from + HISTORY_PAGE_SIZE - 1;
      const { data, count, error } = await supabase
        .from("ai_system_transactions" as any)
        .select("*", { count: "exact" })
        .eq("system_id", selectedSystem!.id)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { rows: data as unknown as AITx[], total: count ?? 0 };
    },
  });
  const txs = txsPage?.rows;
  const txsTotal = txsPage?.total ?? 0;
  const txsPages = Math.max(1, Math.ceil(txsTotal / HISTORY_PAGE_SIZE));

  useEffect(() => { setHistoryPage(0); }, [selectedSystem?.id]);



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
        qc.refetchQueries({ queryKey: ["ai_system_tx_today"] }),
      ]);
      setAddAmount("");
      setRemoveAmount("");
      setOpenDialog(null);
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
      setOpenDialog(null);
    },
    onError: (e: any) => toast.error(e.message ?? "Falha"),
  });

  const getWallet = (id: string) => wallets?.find((w) => w.system_id === id);

  // Per-system aggregations for today
  const todayBySystem = useMemo(() => {
    const map = new Map<string, { debitCredits: number; costUsd: number; calls: number; tokens: number }>();
    for (const t of todayTx ?? []) {
      const prev = map.get(t.system_id) ?? { debitCredits: 0, costUsd: 0, calls: 0, tokens: 0 };
      const amt = Number(t.amount);
      if (amt < 0) {
        prev.debitCredits += Math.abs(amt);
        prev.calls += 1;
      }
      prev.costUsd += Number(t.estimated_cost_usd ?? 0);
      prev.tokens += (t.tokens_input ?? 0) + (t.tokens_output ?? 0);
      map.set(t.system_id, prev);
    }
    return map;
  }, [todayTx]);

  // Global KPIs
  const kpis = useMemo(() => {
    let totalAvailable = 0;
    let totalUsed = 0;
    let activeCount = 0;
    for (const s of systems ?? []) {
      const w = getWallet(s.id);
      totalAvailable += Number(w?.available_credits ?? 0);
      totalUsed += Number(w?.used_credits ?? 0);
      if (s.status === "active") activeCount += 1;
    }
    let costUsdToday = 0;
    let callsToday = 0;
    for (const t of todayTx ?? []) {
      costUsdToday += Number(t.estimated_cost_usd ?? 0);
      if (Number(t.amount) < 0) callsToday += 1;
    }
    return {
      totalAvailable,
      totalUsed,
      activeCount,
      total: systems?.length ?? 0,
      costUsdToday,
      callsToday,
    };
  }, [systems, wallets, todayTx]);

  const filtered = useMemo(() => {
    return (systems ?? [])
      .filter((s) => (statusFilter === "all" ? true : s.status === statusFilter))
      .filter((s) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q) ||
          (s.description ?? "").toLowerCase().includes(q)
        );
      });
  }, [systems, statusFilter, search]);

  const refreshAll = async () => {
    await Promise.all([
      qc.refetchQueries({ queryKey: ["ai_systems"] }),
      qc.refetchQueries({ queryKey: ["ai_system_wallets"] }),
      qc.refetchQueries({ queryKey: ["ai_system_tx_today"] }),
    ]);
    toast.success("Dados atualizados");
  };

  if (sLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Carteiras de IA por Sistema
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cada sistema tem carteira independente. Nenhum sistema consome créditos de outro.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshAll} className="gap-2 w-fit">
          <RefreshCw className="h-4 w-4" /> Atualizar
        </Button>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          icon={<Coins className="h-4 w-4" />}
          label="Créditos disponíveis"
          value={kpis.totalAvailable.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
          hint="Soma de todas as carteiras"
          tone="primary"
        />
        <KpiCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Créditos usados"
          value={kpis.totalUsed.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
          hint="Histórico total consumido"
        />
        <KpiCard
          icon={<Zap className="h-4 w-4" />}
          label="Chamadas hoje"
          value={kpis.callsToday.toLocaleString("pt-BR")}
          hint={`≈ $${kpis.costUsdToday.toFixed(4)} USD`}
          tone="warning"
        />
        <KpiCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          label="Sistemas ativos"
          value={`${kpis.activeCount} / ${kpis.total}`}
          hint="Ativos vs. cadastrados"
          tone="success"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="active">Ativos</TabsTrigger>
            <TabsTrigger value="blocked">Bloqueados</TabsTrigger>
            <TabsTrigger value="suspended">Suspensos</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <Wallet className="h-10 w-10 mx-auto mb-3 opacity-40" />
          Nenhum sistema encontrado com esses filtros.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((sys) => {
            const w = getWallet(sys.id);
            const available = Number(w?.available_credits ?? 0);
            const used = Number(w?.used_credits ?? 0);
            const today = todayBySystem.get(sys.id);
            const usedToday = today?.debitCredits ?? 0;
            const dailyPct = w?.daily_limit ? Math.min(100, (usedToday / Number(w.daily_limit)) * 100) : 0;
            const lowCredits = available > 0 && available < 10;
            const noCredits = available <= 0;

            return (
              <Card
                key={sys.id}
                className={cn(
                  "relative overflow-hidden transition-all",
                  sys.status !== "active" && "opacity-70",
                  noCredits && sys.status === "active" && "border-destructive/50",
                )}
              >
                {/* Status accent bar */}
                <div
                  className={cn(
                    "absolute top-0 left-0 right-0 h-1",
                    sys.status === "active" && "bg-gradient-to-r from-primary to-primary/50",
                    sys.status === "blocked" && "bg-destructive",
                    sys.status === "suspended" && "bg-muted-foreground/30",
                  )}
                />

                <CardHeader className="pb-3 pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="truncate">{sys.name}</span>
                        {noCredits && sys.status === "active" && (
                          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                        )}
                      </CardTitle>
                      <p className="text-[11px] text-muted-foreground font-mono truncate">
                        {sys.slug} · {sys.provider}
                      </p>
                      {sys.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {sys.description}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant={
                        sys.status === "active" ? "default" :
                        sys.status === "blocked" ? "destructive" : "secondary"
                      }
                      className="flex-shrink-0"
                    >
                      {STATUS_LABEL[sys.status]}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Credits */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className={cn(
                      "rounded-lg border p-2.5",
                      noCredits ? "bg-destructive/5 border-destructive/30" : "bg-muted/40",
                    )}>
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                        <Coins className="h-3 w-3" /> Disponível
                      </div>
                      <div className={cn(
                        "font-bold text-xl leading-tight mt-0.5",
                        noCredits ? "text-destructive" : lowCredits ? "text-amber-500" : "text-primary",
                      )}>
                        {available.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted/40 p-2.5">
                      <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> Usado total
                      </div>
                      <div className="font-bold text-xl leading-tight mt-0.5">
                        {used.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>

                  {/* Today stats */}
                  <div className="rounded-lg bg-muted/30 border p-2.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Hoje
                      </span>
                      <span className="font-medium">
                        {(today?.calls ?? 0)} chamadas · {usedToday.toFixed(0)} créditos
                      </span>
                    </div>
                    {w?.daily_limit ? (
                      <div className="space-y-1">
                        <Progress value={dailyPct} className="h-1.5" />
                        <div className="text-[10px] text-muted-foreground flex justify-between">
                          <span>Limite diário</span>
                          <span>{usedToday.toFixed(0)} / {Number(w.daily_limit).toFixed(0)}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-muted-foreground">Sem limite diário definido</div>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> Custo estimado hoje
                      </span>
                      <span className="font-mono">${(today?.costUsd ?? 0).toFixed(4)}</span>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 flex-shrink-0" />
                      <span className="font-mono truncate">{sys.default_model}</span>
                    </div>
                    {w?.last_used_at ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          Último uso {formatDistanceToNow(new Date(w.last_used_at), { addSuffix: true, locale: ptBR })}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 opacity-60">
                        <Clock className="h-3 w-3" /> Nunca usado
                      </div>
                    )}
                    {w?.monthly_limit && (
                      <div>Limite mensal: {Number(w.monthly_limit).toLocaleString("pt-BR")} créditos</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="default"
                      className="gap-1"
                      onClick={() => {
                        setSelectedSystem(sys);
                        setAddAmount("");
                        setOpenDialog({ type: "add", systemId: sys.id });
                      }}
                    >
                      <Plus className="h-3.5 w-3.5" /> Adicionar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      disabled={available <= 0}
                      onClick={() => {
                        setSelectedSystem(sys);
                        setRemoveAmount("");
                        setOpenDialog({ type: "remove", systemId: sys.id });
                      }}
                    >
                      <Minus className="h-3.5 w-3.5" /> Remover
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1"
                      onClick={() => {
                        setSelectedSystem(sys);
                        setDailyLimit(w?.daily_limit?.toString() ?? "");
                        setMonthlyLimit(w?.monthly_limit?.toString() ?? "");
                        setOpenDialog({ type: "limits", systemId: sys.id });
                      }}
                    >
                      <Settings2 className="h-3.5 w-3.5" /> Limites
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1"
                      onClick={() => {
                        setSelectedSystem(sys);
                        setOpenDialog({ type: "history", systemId: sys.id });
                      }}
                    >
                      <History className="h-3.5 w-3.5" /> Histórico
                    </Button>
                    {sys.status === "active" ? (
                      <Button
                        size="sm" variant="destructive"
                        className="col-span-2 gap-1"
                        onClick={() => setStatus.mutate({ slug: sys.slug, status: "blocked" })}
                      >
                        <Ban className="h-3.5 w-3.5" /> Bloquear sistema
                      </Button>
                    ) : (
                      <Button
                        size="sm" variant="default"
                        className="col-span-2 gap-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => setStatus.mutate({ slug: sys.slug, status: "active" })}
                      >
                        <Play className="h-3.5 w-3.5" /> Ativar sistema
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog: Add credits */}
      <Dialog
        open={openDialog?.type === "add"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Adicionar créditos — {selectedSystem?.name}
            </DialogTitle>
            <DialogDescription>
              Recarregue a carteira deste sistema. A operação é registrada no histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {[100, 500, 1000, 5000].map((v) => (
                <Button
                  key={v}
                  type="button"
                  variant={addAmount === String(v) ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAddAmount(String(v))}
                >
                  +{v.toLocaleString("pt-BR")}
                </Button>
              ))}
            </div>
            <div>
              <Label>Quantidade personalizada</Label>
              <Input
                type="number"
                min="1"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                placeholder="Ex: 250"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => selectedSystem && adjust.mutate({
                slug: selectedSystem.slug,
                amount: Math.abs(Number(addAmount)),
                reason: "admin_topup",
              })}
              disabled={!addAmount || Number(addAmount) <= 0 || adjust.isPending}
            >
              {adjust.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : `Adicionar ${addAmount || 0} créditos`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Remove credits */}
      <Dialog
        open={openDialog?.type === "remove"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Minus className="h-5 w-5 text-destructive" /> Remover créditos — {selectedSystem?.name}
            </DialogTitle>
            <DialogDescription>
              Reduz o saldo disponível. Use para correção manual ou reembolso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Quantidade a remover</Label>
              <Input
                type="number"
                min="1"
                value={removeAmount}
                onChange={(e) => setRemoveAmount(e.target.value)}
                placeholder="Ex: 50"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Disponível: {getWallet(selectedSystem?.id ?? "")?.available_credits ?? 0}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => selectedSystem && adjust.mutate({
                slug: selectedSystem.slug,
                amount: -Math.abs(Number(removeAmount)),
                reason: "admin_deduct",
              })}
              disabled={!removeAmount || Number(removeAmount) <= 0 || adjust.isPending}
            >
              {adjust.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : `Remover ${removeAmount || 0} créditos`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Limits */}
      <Dialog
        open={openDialog?.type === "limits"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" /> Limites de consumo — {selectedSystem?.name}
            </DialogTitle>
            <DialogDescription>
              Define o teto máximo de créditos consumidos por período. Deixe vazio para sem limite.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Limite diário (créditos)</Label>
              <Input
                type="number" min="0"
                value={dailyLimit}
                onChange={(e) => setDailyLimit(e.target.value)}
                placeholder="Ex: 500"
              />
            </div>
            <div>
              <Label>Limite mensal (créditos)</Label>
              <Input
                type="number" min="0"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                placeholder="Ex: 10000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => selectedSystem && updateLimits.mutate({
                slug: selectedSystem.slug,
                daily: dailyLimit ? Number(dailyLimit) : null,
                monthly: monthlyLimit ? Number(monthlyLimit) : null,
              })}
              disabled={updateLimits.isPending}
            >
              {updateLimits.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar limites"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: History */}
      <Dialog
        open={openDialog?.type === "history"}
        onOpenChange={(o) => {
          if (!o) setOpenDialog(null);
          else setHistoryPage(0);
        }}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" /> Histórico de transações — {selectedSystem?.name}
            </DialogTitle>
            <DialogDescription>
              {txsTotal.toLocaleString("pt-BR")} movimentações registradas.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto -mx-6 px-6 flex-1">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Modelo</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Latência</TableHead>
                  <TableHead className="text-right">Créditos</TableHead>
                  <TableHead className="text-right">Custo USD</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txs?.map((t) => {
                  const isDebit = Number(t.amount) < 0;
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(t.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant={isDebit ? "outline" : "default"} className="text-[10px]">
                          {t.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-mono max-w-[180px] truncate">{t.model ?? "—"}</TableCell>
                      <TableCell className="text-xs text-right">
                        {((t.tokens_input ?? 0) + (t.tokens_output ?? 0)).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="text-xs text-right text-muted-foreground">
                        {t.response_time_ms ? `${t.response_time_ms}ms` : "—"}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono font-medium",
                        isDebit ? "text-destructive" : "text-emerald-500",
                      )}>
                        {isDebit ? "" : "+"}{Number(t.amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono">
                        ${Number(t.estimated_cost_usd ?? 0).toFixed(6)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!txs?.length && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                      Nenhuma transação registrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="flex-row items-center justify-between sm:justify-between gap-2 border-t pt-3">
            <div className="text-xs text-muted-foreground">
              Página {historyPage + 1} de {txsPages} · {HISTORY_PAGE_SIZE} por página
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={historyPage === 0}
                onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={historyPage + 1 >= txsPages}
                onClick={() => setHistoryPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function KpiCard({
  icon, label, value, hint, tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "primary" | "success" | "warning";
}) {
  const toneClasses = {
    neutral: "bg-muted/40",
    primary: "bg-primary/5 border-primary/20",
    success: "bg-emerald-500/5 border-emerald-500/20",
    warning: "bg-amber-500/5 border-amber-500/20",
  }[tone];
  const iconTone = {
    neutral: "text-muted-foreground bg-muted",
    primary: "text-primary bg-primary/10",
    success: "text-emerald-500 bg-emerald-500/10",
    warning: "text-amber-500 bg-amber-500/10",
  }[tone];

  return (
    <Card className={cn("border", toneClasses)}>
      <CardContent className="p-4 flex items-start gap-3">
        <div className={cn("p-2 rounded-lg", iconTone)}>{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="text-xs text-muted-foreground truncate">{label}</div>
          <div className="text-xl font-bold leading-tight mt-0.5 truncate">{value}</div>
          {hint && <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
