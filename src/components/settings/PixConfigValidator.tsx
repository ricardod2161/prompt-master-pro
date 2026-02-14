import { useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Wrench,
  QrCode,
  User,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { detectPixKeyType, isValidPixKey, generatePixCode } from "@/lib/pix-generator";

interface PixConfigValidatorProps {
  pixKey: string | null | undefined;
  merchantName: string | null | undefined;
  merchantCity: string | null | undefined;
  unitName: string;
  unitAddress: string | null | undefined;
  onAutoFix: (field: string, value: string) => void;
}

interface ValidationItem {
  id: string;
  label: string;
  status: "ok" | "warning" | "error";
  message: string;
  icon: React.ElementType;
  fixAction?: { label: string; field: string; value: string };
}

export function PixConfigValidator({
  pixKey,
  merchantName,
  merchantCity,
  unitName,
  unitAddress,
  onAutoFix,
}: PixConfigValidatorProps) {
  const validations = useMemo<ValidationItem[]>(() => {
    const items: ValidationItem[] = [];

    // 1. Pix key check
    if (!pixKey) {
      items.push({
        id: "pix_key",
        label: "Chave Pix",
        status: "error",
        message: "Nenhuma chave Pix configurada",
        icon: QrCode,
      });
    } else if (!isValidPixKey(pixKey)) {
      items.push({
        id: "pix_key",
        label: "Chave Pix",
        status: "error",
        message: "Formato de chave inválido",
        icon: QrCode,
      });
    } else {
      const type = detectPixKeyType(pixKey);
      const typeLabels: Record<string, string> = {
        cpf: "CPF", cnpj: "CNPJ", phone: "Telefone", email: "Email", random: "Chave Aleatória",
      };
      items.push({
        id: "pix_key",
        label: "Chave Pix",
        status: "ok",
        message: `Chave válida (${typeLabels[type] || type})`,
        icon: QrCode,
      });
    }

    // 2. Merchant name
    if (!merchantName) {
      items.push({
        id: "merchant_name",
        label: "Nome do Beneficiário",
        status: "error",
        message: "Nome não preenchido — será usado fallback genérico",
        icon: User,
        fixAction: unitName
          ? { label: "Usar nome da unidade", field: "pix_merchant_name", value: unitName.toUpperCase().substring(0, 25) }
          : undefined,
      });
    } else if (
      merchantName.toUpperCase() === "RESTAURANTE" ||
      merchantName.toUpperCase() === "LOJA"
    ) {
      items.push({
        id: "merchant_name",
        label: "Nome do Beneficiário",
        status: "warning",
        message: `Nome genérico "${merchantName}" — substitua pelo nome real`,
        icon: User,
        fixAction: unitName
          ? { label: "Usar nome da unidade", field: "pix_merchant_name", value: unitName.toUpperCase().substring(0, 25) }
          : undefined,
      });
    } else {
      items.push({
        id: "merchant_name",
        label: "Nome do Beneficiário",
        status: "ok",
        message: merchantName,
        icon: User,
      });
    }

    // 3. Merchant city
    if (!merchantCity) {
      // Try to extract city from address
      const suggestedCity = extractCityFromAddress(unitAddress);
      items.push({
        id: "merchant_city",
        label: "Cidade do Beneficiário",
        status: "error",
        message: "Cidade não preenchida — obrigatório no padrão EMV",
        icon: MapPin,
        fixAction: suggestedCity
          ? { label: `Usar "${suggestedCity}"`, field: "pix_merchant_city", value: suggestedCity }
          : undefined,
      });
    } else {
      items.push({
        id: "merchant_city",
        label: "Cidade do Beneficiário",
        status: "ok",
        message: merchantCity,
        icon: MapPin,
      });
    }

    // 4. EMV test generation
    if (pixKey && isValidPixKey(pixKey) && merchantName && merchantCity) {
      try {
        generatePixCode({
          pixKey,
          merchantName,
          merchantCity,
          amount: 1.0,
          transactionId: "TESTE",
        });
        items.push({
          id: "emv_test",
          label: "Geração de Código EMV",
          status: "ok",
          message: "Código de teste gerado com sucesso",
          icon: ShieldCheck,
        });
      } catch {
        items.push({
          id: "emv_test",
          label: "Geração de Código EMV",
          status: "error",
          message: "Falha ao gerar código de teste",
          icon: ShieldCheck,
        });
      }
    }

    return items;
  }, [pixKey, merchantName, merchantCity, unitName, unitAddress]);

  const overallStatus = validations.some((v) => v.status === "error")
    ? "error"
    : validations.some((v) => v.status === "warning")
      ? "warning"
      : "ok";

  const statusConfig = {
    ok: { label: "Configuração OK", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: CheckCircle2 },
    warning: { label: "Atenção Necessária", color: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: AlertTriangle },
    error: { label: "Configuração Incompleta", color: "bg-destructive/10 text-destructive border-destructive/30", icon: XCircle },
  };

  const config = statusConfig[overallStatus];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-4">
      {/* Overall status badge */}
      <div className={cn("flex items-center gap-3 p-4 rounded-xl border", config.color)}>
        <StatusIcon className="h-5 w-5 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-sm">{config.label}</p>
          <p className="text-xs opacity-80">
            {overallStatus === "ok"
              ? "Todos os campos estão preenchidos e válidos para gerar códigos Pix."
              : "Corrija os itens abaixo para garantir que os pagamentos Pix funcionem corretamente."}
          </p>
        </div>
        {overallStatus === "ok" && <Sparkles className="h-5 w-5 text-emerald-500" />}
      </div>

      {/* Validation items */}
      <div className="space-y-2">
        {validations.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border transition-all",
                item.status === "ok" && "bg-card/50 border-border/50",
                item.status === "warning" && "bg-amber-500/5 border-amber-500/20",
                item.status === "error" && "bg-destructive/5 border-destructive/20"
              )}
            >
              <Icon className={cn(
                "h-4 w-4 shrink-0",
                item.status === "ok" && "text-emerald-500",
                item.status === "warning" && "text-amber-500",
                item.status === "error" && "text-destructive"
              )} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground truncate">{item.message}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-2",
                    item.status === "ok" && "border-emerald-500/30 text-emerald-600",
                    item.status === "warning" && "border-amber-500/30 text-amber-600",
                    item.status === "error" && "border-destructive/30 text-destructive"
                  )}
                >
                  {item.status === "ok" ? "OK" : item.status === "warning" ? "Alerta" : "Erro"}
                </Badge>
                {item.fixAction && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={() => onAutoFix(item.fixAction!.field, item.fixAction!.value)}
                  >
                    <Wrench className="h-3 w-3" />
                    {item.fixAction.label}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function extractCityFromAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  // Try to find city pattern like "City - State" or "City/State"
  const parts = address.split(/[-/,]/).map((p) => p.trim());
  // Usually city is the second-to-last part or has state abbreviation nearby
  for (let i = parts.length - 1; i >= 0; i--) {
    const part = parts[i].toUpperCase().replace(/\d/g, "").trim();
    if (part.length >= 3 && part.length <= 15 && !/^\d+$/.test(parts[i])) {
      return part
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .substring(0, 15);
    }
  }
  return null;
}
