import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Shield,
} from "lucide-react";

interface SecurityTabProps {
  enablePasswordProtection: boolean;
  onEnableChange: (enabled: boolean) => void;
  hasPasswordProtection: boolean;
  newPassword: string;
  onNewPasswordChange: (v: string) => void;
  showNewPassword: boolean;
  onToggleShowNewPassword: () => void;
  confirmPassword: string;
  onConfirmPasswordChange: (v: string) => void;
  showConfirmPassword: boolean;
  onToggleShowConfirmPassword: () => void;
  onSave: () => void;
  saving: boolean;
}

export function SecurityTab({
  enablePasswordProtection,
  onEnableChange,
  hasPasswordProtection,
  newPassword,
  onNewPasswordChange,
  showNewPassword,
  onToggleShowNewPassword,
  confirmPassword,
  onConfirmPasswordChange,
  showConfirmPassword,
  onToggleShowConfirmPassword,
  onSave,
  saving,
}: SecurityTabProps) {
  const infoItems = [
    { title: "Proteção por sessão", desc: "O desbloqueio persiste enquanto a aba estiver aberta — sem redigitar a cada troca de página" },
    { title: "Sem recuperação", desc: "Se esquecer a senha, você precisará acessar o banco de dados para removê-la" },
    { title: "Compartilhamento", desc: "Compartilhe a senha apenas com pessoas autorizadas a configurar o WhatsApp" },
    { title: "Alteração", desc: "Você pode alterar ou remover a senha a qualquer momento nesta aba" },
  ];

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Shield className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <CardTitle>Proteção por Senha</CardTitle>
              <CardDescription>
                Proteja as configurações do WhatsApp com uma senha de acesso
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-xl border-2 p-5 transition-colors hover:bg-muted/30">
            <div className="space-y-1">
              <Label htmlFor="enable-password" className="text-base font-medium">
                Ativar Proteção por Senha
              </Label>
              <p className="text-sm text-muted-foreground">
                Quando ativado, será necessário digitar uma senha para acessar esta página
              </p>
            </div>
            <Switch
              id="enable-password"
              checked={enablePasswordProtection}
              onCheckedChange={onEnableChange}
              className="data-[state=checked]:bg-orange-600"
            />
          </div>

          {enablePasswordProtection && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium">
                    {hasPasswordProtection ? "Nova Senha" : "Senha"}
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Digite a senha"
                      value={newPassword}
                      onChange={(e) => onNewPasswordChange(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={onToggleShowNewPassword}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Mínimo de 4 caracteres</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">
                    Confirmar Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirme a senha"
                      value={confirmPassword}
                      onChange={(e) => onConfirmPasswordChange(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={onToggleShowConfirmPassword}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          <Button
            onClick={onSave}
            disabled={saving}
            className="h-11 bg-orange-600 hover:bg-orange-700"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar Configurações de Segurança
          </Button>
        </CardContent>
      </Card>

      <Card className="border shadow-sm bg-muted/30">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-blue-500" />
            Informações sobre a proteção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {infoItems.map((item) => (
              <div key={item.title} className="space-y-1">
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
