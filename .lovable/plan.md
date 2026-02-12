
# Auto-Preenchimento dos Campos Operacionais no Gerador de Prompt com IA

## Situação Atual

O componente `AIPromptGenerator.tsx` inicializa o formulário com dados padrão (`defaultFormData`), mas **não carrega** os dados já cadastrados em `unit_settings`. Isso significa que o usuário precisa preencher tudo novamente, mesmo que já tenha configurado horários, formas de pagamento e delivery nas configurações gerais da unidade.

## O Que Precisa Acontecer

Quando o `AIPromptGenerator` for aberto, deve:
1. Usar o hook `useUnitSettings()` para carregar as configurações existentes
2. Mapear os campos de `unit_settings` para os campos do formulário (`PromptFormData`)
3. Pré-preencher o formulário com dados reais da unidade
4. Permitir que o usuário edite ou mantenha os dados carregados

## Mapeamento de Campos

| Campo `PromptFormData` | Fonte em `UnitSettings` | Transformação |
|---|---|---|
| `operatingHours` | `opening_hours.monday.open/close` | Usar segunda como padrão, ou média |
| `paymentMethods` | `payment_methods` (object com booleans) | Converter para array: `["pix", "credito", ...]` |
| `pixKey` | `pix_key` | Usar valor direto |
| `hasDelivery` | `delivery_enabled` | Usar valor direto |
| `deliveryFee` | `delivery_fee` | Converter número para string |
| `hasPickup` | (inferir de regras operacionais) | Padrão `true` |
| `avgPrepTime` | `default_preparation_time` | Converter minutos para string (ex: "30 min") |

## Arquivos a Serem Modificados

1. **`src/components/settings/AIPromptGenerator.tsx`**:
   - Importar `useUnitSettings` hook
   - Adicionar `useEffect` para carregar dados de `unit_settings` quando o componente montar
   - Mapear dados do `UnitSettings` para `PromptFormData`
   - Pré-preencher o estado `formData` com dados carregados
   - Adicionar indicador de carregamento (`isLoading`)
   - Adicionar estado que rastreie se os dados foram carregados pela primeira vez (para não sobrescrever edições do usuário)

2. **`src/components/settings/ai-prompt/types.ts`** (opcional):
   - Pode adicionar uma função auxiliar `mapUnitSettingsToPromptFormData()` para melhor organização e reutilização

## Fluxo de Implementação

### Passo 1: Criar Função de Mapeamento
Na `types.ts`, adicionar:
```typescript
export function mapUnitSettingsToPromptFormData(
  settings: UnitSettings | null,
  restaurantName: string
): Partial<PromptFormData> {
  if (!settings) return {};
  
  // Converter payment_methods object para array
  const paymentMethods: string[] = [];
  if (settings.payment_methods.pix) paymentMethods.push("pix");
  if (settings.payment_methods.credit) paymentMethods.push("credito");
  if (settings.payment_methods.debit) paymentMethods.push("debito");
  if (settings.payment_methods.cash) paymentMethods.push("dinheiro");
  if (settings.payment_methods.voucher) paymentMethods.push("vale_refeicao");
  
  // Extrair horário da segunda-feira como padrão
  const mondayHours = settings.opening_hours.monday;
  
  return {
    operatingHours: {
      open: mondayHours.open,
      close: mondayHours.close,
    },
    paymentMethods,
    pixKey: settings.pix_key || "",
    hasDelivery: settings.delivery_enabled,
    deliveryFee: settings.delivery_fee?.toString() || "0",
    avgPrepTime: settings.default_preparation_time 
      ? `${settings.default_preparation_time} min`
      : "",
  };
}
```

### Passo 2: Integrar no AIPromptGenerator
- Importar `useUnitSettings`
- Usar `useEffect` para carregar dados quando `unitId` mudar
- Combinar `defaultFormData` com dados mapeados de `unit_settings`
- Mostrar estado de carregamento enquanto busca dados
- Permitir edição normal após carregamento

## Estado Adicional Necessário

```typescript
const [dataLoaded, setDataLoaded] = useState(false);
const { settings, isLoading: isLoadingSettings } = useUnitSettings();
```

Usar `dataLoaded` para evitar sobrescrever dados quando o usuário edita o formulário.

## Benefícios

- ✅ UX melhorada: dados já aparecem preenchidos
- ✅ Menos digitação: usa informações já cadastradas
- ✅ Consistência: garante que o prompt reflete a configuração real da unidade
- ✅ Edição fácil: usuário pode ajustar se necessário antes de gerar

## Casos Extremos

1. **Unit Settings vazio**: Usa `defaultFormData` normalmente
2. **Alguns campos vazios em unit_settings**: Usa valor padrão (ex: delivery_fee = "0")
3. **Usuário faz edições manuais**: Respeita as edições (não sobrescreve)
4. **Clica em Resetar**: Volta aos dados de `unit_settings` ou aos padrões

