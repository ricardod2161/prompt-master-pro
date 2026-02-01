import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, XCircle, Clock, ChefHat } from "lucide-react";

interface ColorPreviewCardProps {
  colors: {
    primary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    sidebar?: string;
  };
}

export function ColorPreviewCard({ colors }: ColorPreviewCardProps) {
  // Convert HSL string to CSS format
  const toHslCss = (hsl: string) => `hsl(${hsl})`;

  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className="text-white py-4"
        style={{ backgroundColor: toHslCss(colors.primary) }}
      >
        <CardTitle className="text-lg">Preview ao Vivo</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Buttons Preview */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Botões</p>
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm"
              style={{ backgroundColor: toHslCss(colors.primary) }}
              className="text-white hover:opacity-90"
            >
              Primário
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              style={{ borderColor: toHslCss(colors.primary), color: toHslCss(colors.primary) }}
            >
              Outline
            </Button>
            <Button 
              size="sm"
              style={{ backgroundColor: toHslCss(colors.accent) }}
              className="text-white hover:opacity-90"
            >
              Destaque
            </Button>
          </div>
        </div>

        {/* Status Badges Preview */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Status</p>
          <div className="flex flex-wrap gap-2">
            <Badge 
              className="text-white"
              style={{ backgroundColor: toHslCss(colors.success) }}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Concluído
            </Badge>
            <Badge 
              className="text-white"
              style={{ backgroundColor: toHslCss(colors.warning) }}
            >
              <Clock className="h-3 w-3 mr-1" />
              Pendente
            </Badge>
            <Badge 
              className="text-white"
              style={{ backgroundColor: toHslCss(colors.error) }}
            >
              <XCircle className="h-3 w-3 mr-1" />
              Erro
            </Badge>
            <Badge 
              className="text-white"
              style={{ backgroundColor: toHslCss(colors.accent) }}
            >
              <ChefHat className="h-3 w-3 mr-1" />
              Preparando
            </Badge>
          </div>
        </div>

        {/* Mini Sidebar Preview */}
        {colors.sidebar && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Sidebar</p>
            <div 
              className="rounded-lg p-3 space-y-2"
              style={{ backgroundColor: toHslCss(colors.sidebar) }}
            >
              <div 
                className="h-2 w-16 rounded"
                style={{ backgroundColor: toHslCss(colors.primary) }}
              />
              <div className="h-2 w-12 rounded bg-muted/50" />
              <div className="h-2 w-14 rounded bg-muted/50" />
            </div>
          </div>
        )}

        {/* Mini Card Preview */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Card de Pedido</p>
          <div className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">#1234</span>
              <Badge 
                className="text-white text-[10px]"
                style={{ backgroundColor: toHslCss(colors.warning) }}
              >
                Preparando
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              2x Hambúrguer • 1x Batata
            </div>
            <Button 
              size="sm" 
              className="w-full h-7 text-xs text-white"
              style={{ backgroundColor: toHslCss(colors.success) }}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Marcar Pronto
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
