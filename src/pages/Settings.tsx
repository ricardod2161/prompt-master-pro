import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Building2,
  Cog,
  DollarSign,
  Clock,
  User,
  Palette,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnit } from "@/contexts/UnitContext";
import { useAuth } from "@/contexts/AuthContext";
import { useUnitSettings, OpeningHours, PaymentMethods } from "@/hooks/useUnitSettings";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// Settings components
import { SettingsHeader } from "@/components/settings/SettingsHeader";
import { UnitTab } from "@/components/settings/UnitTab";
import { OperationalTab } from "@/components/settings/OperationalTab";
import { FinancialTab } from "@/components/settings/FinancialTab";
import { HoursTab } from "@/components/settings/HoursTab";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { AppearanceTab } from "@/components/settings/AppearanceTab";
import { cn } from "@/lib/utils";

function SettingsLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-14 w-full max-w-2xl rounded-xl" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}

const TAB_ITEMS = [
  { value: "unit", label: "Unidade", icon: Building2 },
  { value: "operational", label: "Operacional", icon: Cog },
  { value: "financial", label: "Financeiro", icon: DollarSign },
  { value: "hours", label: "Horários", icon: Clock },
  { value: "profile", label: "Perfil", icon: User },
  { value: "appearance", label: "Aparência", icon: Palette },
];

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
  
  // Logo state
  const [logoUrl, setLogoUrl] = useState<string | null>(
    (selectedUnit as any)?.logo_url || null
  );
  
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
  useEffect(() => {
    if (selectedUnit) {
      setUnitForm({
        name: selectedUnit.name || "",
        cnpj: selectedUnit.cnpj || "",
        address: selectedUnit.address || "",
        phone: selectedUnit.phone || "",
      });
      setLogoUrl((selectedUnit as any)?.logo_url || null);
    }
  }, [selectedUnit]);

  useEffect(() => {
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
  }, [settings]);

  useEffect(() => {
    if (profile) {
      setProfileForm((prev) => ({ ...prev, full_name: profile.full_name || "" }));
    }
  }, [profile]);

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
    await updatePassword(profileForm.newPassword);
    setProfileForm((prev) => ({ ...prev, newPassword: "", confirmPassword: "" }));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!selectedUnit) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center p-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
          <div className="relative p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <SettingsIcon className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mt-6 mb-2">Configurações</h1>
        <p className="text-muted-foreground">Selecione uma unidade para configurar.</p>
      </div>
    );
  }

  if (isLoadingSettings || isLoadingProfile) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <SettingsHeader unitName={selectedUnit.name} />
        <SettingsLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <SettingsHeader unitName={selectedUnit.name} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1.5 bg-card/50 backdrop-blur-sm border border-border/50 p-2 rounded-xl shadow-sm mb-6">
          {TAB_ITEMS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300",
                "data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-primary/90",
                "data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/25",
                "data-[state=inactive]:hover:bg-muted/50"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline font-medium">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Unit Tab */}
        <TabsContent value="unit" className="mt-0">
          <UnitTab
            unitForm={unitForm}
            unitId={selectedUnit.id}
            logoUrl={logoUrl}
            onFormChange={setUnitForm}
            onLogoChange={setLogoUrl}
            onSave={handleSaveUnit}
          />
        </TabsContent>

        {/* Operational Tab */}
        <TabsContent value="operational" className="mt-0">
          <OperationalTab
            settings={operationalSettings}
            onSettingsChange={setOperationalSettings}
            onSave={handleSaveOperational}
            isSaving={isSaving}
          />
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="mt-0">
          <FinancialTab
            settings={financialSettings}
            onSettingsChange={setFinancialSettings}
            onSave={handleSaveFinancial}
            isSaving={isSaving}
          />
        </TabsContent>

        {/* Hours Tab */}
        <TabsContent value="hours" className="mt-0">
          <HoursTab
            settings={hoursSettings}
            onSettingsChange={setHoursSettings}
            onSave={handleSaveHours}
            isSaving={isSaving}
          />
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-0">
          <ProfileTab
            email={user?.email || ""}
            profileForm={profileForm}
            onFormChange={setProfileForm}
            onSaveProfile={handleSaveProfile}
            onChangePassword={handleChangePassword}
            onSignOut={handleSignOut}
            isUpdating={isUpdating}
          />
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-0">
          <AppearanceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
