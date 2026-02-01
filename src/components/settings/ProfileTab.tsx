import { User, Mail, Lock, LogOut, Save, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingCard } from "./SettingCard";
import { toast } from "@/hooks/use-toast";

interface ProfileFormData {
  full_name: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileTabProps {
  email: string;
  profileForm: ProfileFormData;
  onFormChange: (form: ProfileFormData) => void;
  onSaveProfile: () => void;
  onChangePassword: () => void;
  onSignOut: () => void;
  isUpdating: boolean;
}

export function ProfileTab({
  email,
  profileForm,
  onFormChange,
  onSaveProfile,
  onChangePassword,
  onSignOut,
  isUpdating,
}: ProfileTabProps) {
  const handlePasswordChange = () => {
    if (profileForm.newPassword !== profileForm.confirmPassword) {
      toast({ title: "Erro", description: "As senhas não coincidem.", variant: "destructive" });
      return;
    }
    if (profileForm.newPassword.length < 6) {
      toast({ title: "Erro", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
      return;
    }
    onChangePassword();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Personal Data */}
      <SettingCard
        icon={User}
        title="Dados Pessoais"
        description="Gerencie suas informações de perfil"
        variant="elevated"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name" className="flex items-center gap-2 text-sm font-medium">
              <User className="h-4 w-4 text-muted-foreground" />
              Nome Completo
            </Label>
            <Input
              id="profile-name"
              value={profileForm.full_name}
              onChange={(e) => onFormChange({ ...profileForm, full_name: e.target.value })}
              placeholder="Seu nome completo"
              className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="profile-email" className="flex items-center gap-2 text-sm font-medium">
              <Mail className="h-4 w-4 text-muted-foreground" />
              Email
            </Label>
            <Input 
              id="profile-email" 
              value={email} 
              disabled 
              className="h-11 bg-muted/50 border-border/30 text-muted-foreground" 
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Shield className="h-3 w-3" />
              O email não pode ser alterado por segurança
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-border/50">
          <Button 
            onClick={onSaveProfile} 
            disabled={isUpdating} 
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/25"
          >
            {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Perfil
          </Button>
        </div>
      </SettingCard>

      {/* Change Password */}
      <SettingCard
        icon={Lock}
        title="Alterar Senha"
        description="Atualize sua senha de acesso"
        variant="glass"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-sm font-medium">
              Nova Senha
            </Label>
            <Input
              id="new-password"
              type="password"
              value={profileForm.newPassword}
              onChange={(e) => onFormChange({ ...profileForm, newPassword: e.target.value })}
              placeholder="••••••••"
              className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-medium">
              Confirmar Senha
            </Label>
            <Input
              id="confirm-password"
              type="password"
              value={profileForm.confirmPassword}
              onChange={(e) => onFormChange({ ...profileForm, confirmPassword: e.target.value })}
              placeholder="••••••••"
              className="h-11 bg-background/50 border-border/50 focus:border-primary/50"
            />
          </div>
        </div>

        <Button
          onClick={handlePasswordChange}
          disabled={!profileForm.newPassword || !profileForm.confirmPassword}
          variant="outline"
          className="w-full sm:w-auto"
        >
          <Lock className="h-4 w-4 mr-2" />
          Alterar Senha
        </Button>
      </SettingCard>

      {/* Sign Out */}
      <SettingCard
        icon={LogOut}
        title="Sair da Conta"
        description="Encerre sua sessão atual"
        variant="destructive"
      >
        <Button 
          onClick={onSignOut} 
          variant="destructive" 
          className="w-full sm:w-auto shadow-lg shadow-destructive/25"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair da Conta
        </Button>
      </SettingCard>
    </div>
  );
}
