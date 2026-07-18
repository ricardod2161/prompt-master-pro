import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Check, Copy, Link } from "lucide-react";

interface WebhookTabProps {
  webhookUrl: string;
  copied: boolean;
  onCopy: () => void;
}

export function WebhookTab({ webhookUrl, copied, onCopy }: WebhookTabProps) {
  const steps = [
    "Acesse o painel da Evolution API",
    "Vá em Configurações da Instância → Webhook",
    "Cole a URL acima no campo de Webhook",
    'Ative os eventos "messages.upsert"',
    "Salve as configurações",
  ];

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Link className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <CardTitle>URL do Webhook</CardTitle>
            <CardDescription>
              Configure este webhook na Evolution API para receber mensagens
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-medium">Webhook URL</Label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 p-4 bg-muted/50 rounded-xl border-2 border-dashed font-mono text-sm break-all">
              {webhookUrl}
            </div>
            <Button
              onClick={onCopy}
              variant="outline"
              className="h-auto sm:h-[60px] px-6 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h4 className="font-medium">Como configurar na Evolution API:</h4>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Importante</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                O webhook deve estar configurado corretamente para que as mensagens sejam
                recebidas e processadas pelo bot. Certifique-se de que a URL está acessível externamente.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
