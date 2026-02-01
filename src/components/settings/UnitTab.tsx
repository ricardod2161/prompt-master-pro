import { Building2, Save, Store, Phone, MapPin, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingCard } from "./SettingCard";
import { LogoUpload } from "./LogoUpload";
import { Separator } from "@/components/ui/separator";

interface UnitFormData {
  name: string;
  cnpj: string;
  address: string;
  phone: string;
}

interface UnitTabProps {
  unitForm: UnitFormData;
  unitId: string;
  logoUrl?: string | null;
  onFormChange: (form: UnitFormData) => void;
  onLogoChange: (url: string | null) => void;
  onSave: () => void;
}

export function UnitTab({ 
  unitForm, 
  unitId, 
  logoUrl, 
  onFormChange, 
  onLogoChange, 
  onSave 
}: UnitTabProps) {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Logo Section */}
      <SettingCard
        icon={Sparkles}
        title="Identidade Visual"
        description="Personalize sua marca com logo e identidade"
        variant="elevated"
      >
        <LogoUpload 
          unitId={unitId} 
          currentLogoUrl={logoUrl} 
          onLogoChange={onLogoChange} 
        />
      </SettingCard>

      {/* Unit Data Section */}
      <SettingCard
        icon={Building2}
        title="Dados da Unidade"
        description="Informações cadastrais do estabelecimento"
        variant="elevated"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="unit-name" className="flex items-center gap-2 text-sm font-medium">
              <Store className="h-4 w-4 text-muted-foreground" />
              Nome do Estabelecimento
            </Label>
            <Input
              id="unit-name"
              value={unitForm.name}
              onChange={(e) => onFormChange({ ...unitForm, name: e.target.value })}
              placeholder="Nome do restaurante"
              className="h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="unit-cnpj" className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4 text-muted-foreground" />
              CNPJ
            </Label>
            <Input
              id="unit-cnpj"
              value={unitForm.cnpj}
              onChange={(e) => onFormChange({ ...unitForm, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
              className="h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="unit-address" className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            Endereço Completo
          </Label>
          <Input
            id="unit-address"
            value={unitForm.address}
            onChange={(e) => onFormChange({ ...unitForm, address: e.target.value })}
            placeholder="Rua, número, bairro, cidade - UF"
            className="h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
          />
        </div>
        
        <div className="space-y-2 md:w-1/2">
          <Label htmlFor="unit-phone" className="flex items-center gap-2 text-sm font-medium">
            <Phone className="h-4 w-4 text-muted-foreground" />
            Telefone Principal
          </Label>
          <Input
            id="unit-phone"
            value={unitForm.phone}
            onChange={(e) => onFormChange({ ...unitForm, phone: e.target.value })}
            placeholder="(00) 00000-0000"
            className="h-11 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
          />
        </div>
        
        <Separator className="my-4" />
        
        <div className="flex justify-end">
          <Button 
            onClick={onSave} 
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Dados da Unidade
          </Button>
        </div>
      </SettingCard>
    </div>
  );
}
