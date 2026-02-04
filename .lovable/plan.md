
# Correção Profissional do Sistema de Pix

## Problemas Identificados

### 1. Cidade do Comerciante Errada
```typescript
// Código atual em OrderTracking.tsx (linha 133)
merchantCity: unitInfo?.address?.split(",")[0]?.trim() || "BRASIL"
```
Se o endereço é "Rua das Flores, 123", o sistema pega "Rua das Flores" como cidade, o que está ERRADO.

### 2. Nome do Comerciante Inadequado
O nome usado no Pix é o nome da unidade (`unitInfo?.name`), que pode ser diferente do nome registrado para receber Pix.

### 3. Falta de Configuração Dedicada
Não existem campos para configurar o nome e cidade do comerciante Pix de forma independente.

---

## Solução Proposta

### Fase 1: Banco de Dados
Adicionar novos campos na tabela `unit_settings`:
- `pix_merchant_name` - Nome do beneficiário (como aparece no Pix)
- `pix_merchant_city` - Cidade do beneficiário (obrigatório no padrão EMV)

### Fase 2: Interface de Configuração
Atualizar `FinancialTab.tsx` para incluir:
- Campo "Nome do Beneficiário Pix"
- Campo "Cidade do Beneficiário"
- Validações e feedback visual

### Fase 3: Geração do Código Pix
Atualizar `OrderTracking.tsx` para usar os novos campos:
```typescript
// ANTES (errado)
merchantCity: unitInfo?.address?.split(",")[0]?.trim() || "BRASIL"

// DEPOIS (correto)
merchantCity: unitSettings?.pix_merchant_city || "BRASIL"
merchantName: unitSettings?.pix_merchant_name || unitInfo?.name || "RESTAURANTE"
```

### Fase 4: Edge Function
Atualizar `send-order-notification/index.ts` para também usar os novos campos.

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| **Migração SQL** | Adicionar colunas `pix_merchant_name`, `pix_merchant_city` |
| `src/hooks/useUnitSettings.ts` | Adicionar novos campos no tipo `UnitSettings` |
| `src/components/settings/FinancialTab.tsx` | Adicionar inputs para nome e cidade Pix |
| `src/pages/OrderTracking.tsx` | Usar os novos campos para gerar código Pix |
| `src/hooks/useOrderTracking.ts` | Buscar novos campos do banco |
| `supabase/functions/send-order-notification/index.ts` | Usar novos campos |

---

## Resultado Final

O código Pix gerado será:
- **Nome do Beneficiário**: Configurável nas configurações (ex: "JOAO DA SILVA")
- **Cidade**: Configurável nas configurações (ex: "SAO PAULO")
- **Chave Pix**: Como já existe
- **Valor**: Total do pedido

Isso garantirá que o QR Code Pix funcione corretamente em qualquer banco.
