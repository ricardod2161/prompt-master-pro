import { Store, Cog, Truck, QrCode, Bell, Printer, MessageSquare, Save, Loader2, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingCard } from "./SettingCard";
import { SettingToggleItem } from "./SettingToggleItem";

interface OperationalSettings {
  auto_print_enabled: boolean;
  auto_notify_enabled: boolean;
  delivery_enabled: boolean;
  table_ordering_enabled: boolean;
  counter_ordering_enabled: boolean;
  whatsapp_ordering_enabled: boolean;
  default_preparation_time: number;
}

interface OperationalTabProps {
  settings: OperationalSettings;
  onSettingsChange: (settings: OperationalSettings) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function OperationalTab({ settings, onSettingsChange, onSave, isSaving }: OperationalTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sales Channels */}
      <SettingCard
        icon={Store}
        title="Canais de Venda"
        description="Ative ou desative os canais de atendimento"
        variant="elevated"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <SettingToggleItem
            icon={Truck}
            title="Delivery"
            description="Pedidos para entrega"
            checked={settings.delivery_enabled}
            onCheckedChange={(checked) =>
              onSettingsChange({ ...settings, delivery_enabled: checked })
            }
            iconColor="success"
          />
          <SettingToggleItem
            icon={QrCode}
            title="Mesa / QR Code"
            description="Pedidos via QR na mesa"
            checked={settings.table_ordering_enabled}
            onCheckedChange={(checked) =>
              onSettingsChange({ ...settings, table_ordering_enabled: checked })
            }
            iconColor="accent"
          />
          <SettingToggleItem
            icon={Store}
            title="Balcão"
            description="Atendimento presencial"
            checked={settings.counter_ordering_enabled}
            onCheckedChange={(checked) =>
              onSettingsChange({ ...settings, counter_ordering_enabled: checked })
            }
            iconColor="warning"
          />
          <SettingToggleItem
            icon={MessageSquare}
            title="WhatsApp"
            description="Pedidos via WhatsApp"
            checked={settings.whatsapp_ordering_enabled}
            onCheckedChange={(checked) =>
              onSettingsChange({ ...settings, whatsapp_ordering_enabled: checked })
            }
            iconColor="success"
          />
        </div>
      </SettingCard>

      {/* Automations */}
      <SettingCard
        icon={Cog}
        title="Automações"
        description="Configure ações automáticas do sistema"
        variant="glass"
      >
        <div className="space-y-3">
          <SettingToggleItem
            icon={Printer}
            title="Impressão Automática"
            description="Imprime comanda quando status muda para 'Preparando'"
            checked={settings.auto_print_enabled}
            onCheckedChange={(checked) =>
              onSettingsChange({ ...settings, auto_print_enabled: checked })
            }
            iconColor="primary"
          />
          <SettingToggleItem
            icon={Bell}
            title="Notificação Automática"
            description="Notifica cliente via WhatsApp quando pedido fica pronto"
            checked={settings.auto_notify_enabled}
            onCheckedChange={(checked) =>
              onSettingsChange({ ...settings, auto_notify_enabled: checked })
            }
            iconColor="accent"
          />
        </div>

        <div className="pt-4 border-t border-border/50">
          <div className="space-y-2 max-w-xs">
            <Label htmlFor="prep-time" className="flex items-center gap-2 text-sm font-medium">
              <Timer className="h-4 w-4 text-muted-foreground" />
              Tempo Médio de Preparo (minutos)
            </Label>
            <Input
              id="prep-time"
              type="number"
              min={5}
              max={120}
              value={settings.default_preparation_time}
              onChange={(e) =>
                onSettingsChange({
                  ...settings,
                  default_preparation_time: parseInt(e.target.value) || 30,
                })
              }
              className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
            />
          </div>
        </div>

        <div className="pt-4">
          <Button 
            onClick={onSave} 
            disabled={isSaving} 
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25"
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Configurações Operacionais
          </Button>
        </div>
      </SettingCard>
    </div>
  );
}
