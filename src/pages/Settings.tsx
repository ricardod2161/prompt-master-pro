import { useState } from "react";
import {
  Settings as SettingsIcon,
  Building2,
  Cog,
  DollarSign,
  Clock,
  Users,
  User,
  Store,
  Truck,
  QrCode,
  Printer,
  Bell,
  CreditCard,
  Banknote,
  Wallet,
  LogOut,
  Save,
  Loader2,
  Palette,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnit } from "@/contexts/UnitContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUnitSettings, OpeningHours, PaymentMethods } from "@/hooks/useUnitSettings";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { AppearanceTab } from "@/components/settings/AppearanceTab";

const DAYS_OF_WEEK = [
  { key: "monday", label: "Segunda-feira" },
  { key: "tuesday", label: "Terça-feira" },
  { key: "wednesday", label: "Quarta-feira" },
  { key: "thursday", label: "Quinta-feira" },
  { key: "friday", label: "Sexta-feira" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
] as const;

const TIMEZONES = [
  { value: "America/Sao_Paulo", label: "Brasília (GMT-3)" },
  { value: "America/Manaus", label: "Manaus (GMT-4)" },
  { value: "America/Belem", label: "Belém (GMT-3)" },
  { value: "America/Fortaleza", label: "Fortaleza (GMT-3)" },
  { value: "America/Recife", label: "Recife (GMT-3)" },
  { value: "America/Cuiaba", label: "Cuiabá (GMT-4)" },
  { value: "America/Porto_Velho", label: "Porto Velho (GMT-4)" },
  { value: "America/Rio_Branco", label: "Rio Branco (GMT-5)" },
];

function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { selectedUnit, refetchUnits } = useUnit();
  const { user, signOut } = useAuth();
  const { settings, isLoading: isLoadingSettings, saveSettings, isSaving } = useUnitSettings();
  const { profile, isLoading: isLoadingProfile, updateProfile, updatePassword, isUpdating } = useProfile();
  
  const [activeTab, setActiveTab] = useState("unit");
  
  // Unit form state
  const [unitForm, setUnitForm] = useState({
    name: selectedUnit?.name || "",
    cnpj: selectedUnit?.cnpj || "",
    address: selectedUnit?.address || "",
    phone: selectedUnit?.phone || "",
  });
  
  // Operational settings state
  const [operationalSettings, setOperationalSettings] = useState({
    auto_print_enabled: settings?.auto_print_enabled ?? true,
    auto_notify_enabled: settings?.auto_notify_enabled ?? true,
    delivery_enabled: settings?.delivery_enabled ?? true,
    table_ordering_enabled: settings?.table_ordering_enabled ?? true,
    counter_ordering_enabled: settings?.counter_ordering_enabled ?? true,
    whatsapp_ordering_enabled: settings?.whatsapp_ordering_enabled ?? true,
    default_preparation_time: settings?.default_preparation_time ?? 30,
  });
  
  // Financial settings state
  const [financialSettings, setFinancialSettings] = useState({
    service_fee_percentage: settings?.service_fee_percentage ?? 0,
    delivery_fee: settings?.delivery_fee ?? 0,
    min_delivery_order: settings?.min_delivery_order ?? 0,
    payment_methods: settings?.payment_methods ?? {
      cash: true,
      credit: true,
      debit: true,
      pix: true,
      voucher: false,
    },
  });
  
  // Hours settings state
  const [hoursSettings, setHoursSettings] = useState<{
    opening_hours: OpeningHours;
    timezone: string;
  }>({
    opening_hours: settings?.opening_hours ?? {
      monday: { open: "08:00", close: "22:00", closed: false },
      tuesday: { open: "08:00", close: "22:00", closed: false },
      wednesday: { open: "08:00", close: "22:00", closed: false },
      thursday: { open: "08:00", close: "22:00", closed: false },
      friday: { open: "08:00", close: "23:00", closed: false },
      saturday: { open: "10:00", close: "23:00", closed: false },
      sunday: { open: "10:00", close: "20:00", closed: false },
    },
    timezone: settings?.timezone ?? "America/Sao_Paulo",
  });
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: profile?.full_name || "",
    newPassword: "",
    confirmPassword: "",
  });
  
  // Update form state when data loads
  useState(() => {
    if (selectedUnit) {
      setUnitForm({
        name: selectedUnit.name || "",
        cnpj: selectedUnit.cnpj || "",
        address: selectedUnit.address || "",
        phone: selectedUnit.phone || "",
      });
    }
  });

  useState(() => {
    if (settings) {
      setOperationalSettings({
        auto_print_enabled: settings.auto_print_enabled,
        auto_notify_enabled: settings.auto_notify_enabled,
        delivery_enabled: settings.delivery_enabled,
        table_ordering_enabled: settings.table_ordering_enabled,
        counter_ordering_enabled: settings.counter_ordering_enabled,
        whatsapp_ordering_enabled: settings.whatsapp_ordering_enabled,
        default_preparation_time: settings.default_preparation_time,
      });
      setFinancialSettings({
        service_fee_percentage: settings.service_fee_percentage,
        delivery_fee: settings.delivery_fee,
        min_delivery_order: settings.min_delivery_order,
        payment_methods: settings.payment_methods,
      });
      setHoursSettings({
        opening_hours: settings.opening_hours,
        timezone: settings.timezone,
      });
    }
  });

  useState(() => {
    if (profile) {
      setProfileForm((prev) => ({ ...prev, full_name: profile.full_name || "" }));
    }
  });

  const handleSaveUnit = async () => {
    if (!selectedUnit) return;
    
    const { error } = await supabase
      .from("units")
      .update(unitForm)
      .eq("id", selectedUnit.id);
    
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Unidade atualizada", description: "Os dados foram salvos com sucesso." });
      refetchUnits();
    }
  };

  const handleSaveOperational = async () => {
    await saveSettings(operationalSettings);
  };

  const handleSaveFinancial = async () => {
    await saveSettings(financialSettings);
  };

  const handleSaveHours = async () => {
    await saveSettings(hoursSettings);
  };

  const handleSaveProfile = async () => {
    await updateProfile({ full_name: profileForm.full_name });
  };

  const handleChangePassword = async () => {
    if (profileForm.newPassword !== profileForm.confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    if (profileForm.newPassword.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    await updatePassword(profileForm.newPassword);
    setProfileForm((prev) => ({ ...prev, newPassword: "", confirmPassword: "" }));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!selectedUnit) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <SettingsIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">Selecione uma unidade para configurar.</p>
      </div>
    );
  }

  if (isLoadingSettings || isLoadingProfile) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
            <SettingsIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Configurações</h1>
            <p className="text-muted-foreground">{selectedUnit.name}</p>
          </div>
        </div>
        <SettingsLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
          <SettingsIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">{selectedUnit.name}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="unit" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Unidade</span>
          </TabsTrigger>
          <TabsTrigger value="operational" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Cog className="h-4 w-4" />
            <span className="hidden sm:inline">Operacional</span>
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2 data-[state=active]:bg-background">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Financeiro</span>
          </TabsTrigger>
          <TabsTrigger value="hours" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Horários</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2 data-[state=active]:bg-background">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2 data-[state=active]:bg-background">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Aparência</span>
          </TabsTrigger>
        </TabsList>

        {/* Unit Tab */}
        <TabsContent value="unit" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dados da Unidade
              </CardTitle>
              <CardDescription>Informações cadastrais do estabelecimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="unit-name">Nome do Estabelecimento</Label>
                  <Input
                    id="unit-name"
                    value={unitForm.name}
                    onChange={(e) => setUnitForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Nome do restaurante"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit-cnpj">CNPJ</Label>
                  <Input
                    id="unit-cnpj"
                    value={unitForm.cnpj}
                    onChange={(e) => setUnitForm((prev) => ({ ...prev, cnpj: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-address">Endereço Completo</Label>
                <Input
                  id="unit-address"
                  value={unitForm.address}
                  onChange={(e) => setUnitForm((prev) => ({ ...prev, address: e.target.value }))}
                  placeholder="Rua, número, bairro, cidade - UF"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit-phone">Telefone Principal</Label>
                <Input
                  id="unit-phone"
                  value={unitForm.phone}
                  onChange={(e) => setUnitForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <Button onClick={handleSaveUnit} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                Salvar Dados da Unidade
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operational Tab */}
        <TabsContent value="operational" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Canais de Venda
              </CardTitle>
              <CardDescription>Ative ou desative os canais de atendimento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Delivery</p>
                    <p className="text-sm text-muted-foreground">Pedidos para entrega</p>
                  </div>
                </div>
                <Switch
                  checked={operationalSettings.delivery_enabled}
                  onCheckedChange={(checked) =>
                    setOperationalSettings((prev) => ({ ...prev, delivery_enabled: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <QrCode className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Mesa / QR Code</p>
                    <p className="text-sm text-muted-foreground">Pedidos via QR na mesa</p>
                  </div>
                </div>
                <Switch
                  checked={operationalSettings.table_ordering_enabled}
                  onCheckedChange={(checked) =>
                    setOperationalSettings((prev) => ({ ...prev, table_ordering_enabled: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Store className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Balcão</p>
                    <p className="text-sm text-muted-foreground">Atendimento presencial</p>
                  </div>
                </div>
                <Switch
                  checked={operationalSettings.counter_ordering_enabled}
                  onCheckedChange={(checked) =>
                    setOperationalSettings((prev) => ({ ...prev, counter_ordering_enabled: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">WhatsApp</p>
                    <p className="text-sm text-muted-foreground">Pedidos via WhatsApp</p>
                  </div>
                </div>
                <Switch
                  checked={operationalSettings.whatsapp_ordering_enabled}
                  onCheckedChange={(checked) =>
                    setOperationalSettings((prev) => ({ ...prev, whatsapp_ordering_enabled: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cog className="h-5 w-5" />
                Automações
              </CardTitle>
              <CardDescription>Configure ações automáticas do sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Printer className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Impressão Automática</p>
                    <p className="text-sm text-muted-foreground">
                      Imprime comanda quando status muda para "Preparando"
                    </p>
                  </div>
                </div>
                <Switch
                  checked={operationalSettings.auto_print_enabled}
                  onCheckedChange={(checked) =>
                    setOperationalSettings((prev) => ({ ...prev, auto_print_enabled: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Notificação Automática</p>
                    <p className="text-sm text-muted-foreground">
                      Notifica cliente via WhatsApp quando pedido fica pronto
                    </p>
                  </div>
                </div>
                <Switch
                  checked={operationalSettings.auto_notify_enabled}
                  onCheckedChange={(checked) =>
                    setOperationalSettings((prev) => ({ ...prev, auto_notify_enabled: checked }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prep-time">Tempo Médio de Preparo (minutos)</Label>
                <Input
                  id="prep-time"
                  type="number"
                  min={5}
                  max={120}
                  value={operationalSettings.default_preparation_time}
                  onChange={(e) =>
                    setOperationalSettings((prev) => ({
                      ...prev,
                      default_preparation_time: parseInt(e.target.value) || 30,
                    }))
                  }
                />
              </div>
              <Button onClick={handleSaveOperational} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Configurações Operacionais
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Taxas
              </CardTitle>
              <CardDescription>Configure taxas de serviço e entrega</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="service-fee">Taxa de Serviço (%)</Label>
                  <Input
                    id="service-fee"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={financialSettings.service_fee_percentage}
                    onChange={(e) =>
                      setFinancialSettings((prev) => ({
                        ...prev,
                        service_fee_percentage: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delivery-fee">Taxa de Entrega (R$)</Label>
                  <Input
                    id="delivery-fee"
                    type="number"
                    min={0}
                    step={0.5}
                    value={financialSettings.delivery_fee}
                    onChange={(e) =>
                      setFinancialSettings((prev) => ({
                        ...prev,
                        delivery_fee: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min-order">Pedido Mínimo Delivery (R$)</Label>
                  <Input
                    id="min-order"
                    type="number"
                    min={0}
                    step={1}
                    value={financialSettings.min_delivery_order}
                    onChange={(e) =>
                      setFinancialSettings((prev) => ({
                        ...prev,
                        min_delivery_order: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Métodos de Pagamento
              </CardTitle>
              <CardDescription>Ative ou desative formas de pagamento aceitas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-muted-foreground" />
                    <span>Dinheiro</span>
                  </div>
                  <Switch
                    checked={financialSettings.payment_methods.cash}
                    onCheckedChange={(checked) =>
                      setFinancialSettings((prev) => ({
                        ...prev,
                        payment_methods: { ...prev.payment_methods, cash: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>Crédito</span>
                  </div>
                  <Switch
                    checked={financialSettings.payment_methods.credit}
                    onCheckedChange={(checked) =>
                      setFinancialSettings((prev) => ({
                        ...prev,
                        payment_methods: { ...prev.payment_methods, credit: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>Débito</span>
                  </div>
                  <Switch
                    checked={financialSettings.payment_methods.debit}
                    onCheckedChange={(checked) =>
                      setFinancialSettings((prev) => ({
                        ...prev,
                        payment_methods: { ...prev.payment_methods, debit: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span>PIX</span>
                  </div>
                  <Switch
                    checked={financialSettings.payment_methods.pix}
                    onCheckedChange={(checked) =>
                      setFinancialSettings((prev) => ({
                        ...prev,
                        payment_methods: { ...prev.payment_methods, pix: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span>Voucher</span>
                  </div>
                  <Switch
                    checked={financialSettings.payment_methods.voucher}
                    onCheckedChange={(checked) =>
                      setFinancialSettings((prev) => ({
                        ...prev,
                        payment_methods: { ...prev.payment_methods, voucher: checked },
                      }))
                    }
                  />
                </div>
              </div>
              <Button onClick={handleSaveFinancial} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Configurações Financeiras
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horário de Funcionamento
              </CardTitle>
              <CardDescription>Configure os horários de abertura e fechamento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fuso Horário</Label>
                <Select
                  value={hoursSettings.timezone}
                  onValueChange={(value) => setHoursSettings((prev) => ({ ...prev, timezone: value }))}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-3">
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day.key}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border"
                  >
                    <div className="flex items-center justify-between sm:w-40">
                      <span className="font-medium">{day.label}</span>
                      <Switch
                        checked={!hoursSettings.opening_hours[day.key].closed}
                        onCheckedChange={(checked) =>
                          setHoursSettings((prev) => ({
                            ...prev,
                            opening_hours: {
                              ...prev.opening_hours,
                              [day.key]: { ...prev.opening_hours[day.key], closed: !checked },
                            },
                          }))
                        }
                      />
                    </div>
                    {!hoursSettings.opening_hours[day.key].closed ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          type="time"
                          value={hoursSettings.opening_hours[day.key].open}
                          onChange={(e) =>
                            setHoursSettings((prev) => ({
                              ...prev,
                              opening_hours: {
                                ...prev.opening_hours,
                                [day.key]: { ...prev.opening_hours[day.key], open: e.target.value },
                              },
                            }))
                          }
                          className="w-32"
                        />
                        <span className="text-muted-foreground">até</span>
                        <Input
                          type="time"
                          value={hoursSettings.opening_hours[day.key].close}
                          onChange={(e) =>
                            setHoursSettings((prev) => ({
                              ...prev,
                              opening_hours: {
                                ...prev.opening_hours,
                                [day.key]: { ...prev.opening_hours[day.key], close: e.target.value },
                              },
                            }))
                          }
                          className="w-32"
                        />
                      </div>
                    ) : (
                      <Badge variant="secondary" className="w-fit">
                        Fechado
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              <Button onClick={handleSaveHours} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Horários
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>Gerencie suas informações de perfil</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Nome Completo</Label>
                <Input
                  id="profile-name"
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input id="profile-email" value={user?.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
              </div>
              <Button onClick={handleSaveProfile} disabled={isUpdating} className="w-full sm:w-auto">
                {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Salvar Perfil
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alterar Senha</CardTitle>
              <CardDescription>Atualize sua senha de acesso</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova Senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={profileForm.newPassword}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar Senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={profileForm.confirmPassword}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={!profileForm.newPassword || !profileForm.confirmPassword}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Alterar Senha
              </Button>
            </CardContent>
          </Card>

          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive">Sair da Conta</CardTitle>
              <CardDescription>Encerre sua sessão atual</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleSignOut} variant="destructive" className="w-full sm:w-auto">
                <LogOut className="h-4 w-4 mr-2" />
                Sair da Conta
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-6">
          <AppearanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
