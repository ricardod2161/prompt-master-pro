
# Marketing Studio - Correcoes e Sistema de Creditos de IA

## Problema 1: Marketing nao aparece no header

O titulo da pagina "Marketing Studio" nao aparece no header porque o mapeamento `pageTitles` em `AppLayout.tsx` (linha 17-33) nao inclui a rota `/marketing`. Isso e uma correcao simples.

## Problema 2: Sistema de Creditos para Geracao de Imagens

### Custo Real por Imagem

Baseado na pesquisa de precos do Google Gemini 3 Pro Image Preview:
- **Input**: ~500-800 tokens por prompt = ~$0.001-0.002
- **Output (imagem)**: ~1290 tokens a $30/M output = ~$0.039 por imagem (1024x1024)
- **Custo total por geracao**: ~$0.04-0.05 USD (~R$ 0.25 por imagem)

Para imagens maiores (4K): ate $0.24 USD por imagem.

### Estrategia de Creditos Proposta

| Item | Valor |
|------|-------|
| Creditos gratuitos (todos os planos) | 3 creditos/mes |
| Custo real por credito | ~R$ 0.25 |
| Preco de venda por credito | R$ 1.50-2.00 |
| Margem por credito | ~85% |

**Pacotes de creditos sugeridos:**

| Pacote | Creditos | Preco | Por credito |
|--------|----------|-------|-------------|
| Basico | 10 | R$ 14,90 | R$ 1,49 |
| Profissional | 30 | R$ 34,90 | R$ 1,16 |
| Ilimitado | 100 | R$ 89,90 | R$ 0,90 |

### Implementacao Tecnica

#### 1. Nova tabela `marketing_credits`

```sql
CREATE TABLE marketing_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id),
  total_credits INTEGER NOT NULL DEFAULT 3,
  used_credits INTEGER NOT NULL DEFAULT 0,
  bonus_credits INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ, -- para reset mensal dos gratuitos
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### 2. Tabela `credit_transactions` (historico)

```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id),
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'usage', 'purchase', 'bonus', 'monthly_reset'
  amount INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### 3. Logica no Edge Function `generate-marketing-image`

Antes de gerar a imagem:
1. Verificar saldo de creditos da unidade
2. Se saldo > 0, debitar 1 credito e gerar
3. Se saldo = 0, retornar erro com link para compra

#### 4. Nova Edge Function `purchase-credits`

Cria sessao de checkout Stripe para compra avulsa de pacotes de creditos (modo `payment`, nao `subscription`).

#### 5. UI no Marketing Studio

- Badge no topo mostrando "3/3 creditos restantes"
- Barra de progresso visual dos creditos
- Quando creditos = 0, botao "Gerar" desabilitado com CTA "Comprar Creditos"
- Modal de compra de creditos com os 3 pacotes

#### 6. Adicionar titulo no header

Atualizar `pageTitles` em `AppLayout.tsx` para incluir `/marketing`.

### Arquivos que serao criados/modificados

- `src/components/layout/AppLayout.tsx` - Adicionar titulo "Marketing Studio" no mapeamento
- `supabase/functions/generate-marketing-image/index.ts` - Adicionar verificacao de creditos antes de gerar
- `supabase/functions/purchase-credits/index.ts` - Nova edge function para compra de creditos via Stripe
- `src/pages/MarketingStudio.tsx` - Adicionar badge de creditos, barra de progresso e modal de compra
- `src/hooks/useMarketingCredits.ts` - Hook para gerenciar estado de creditos
- Migracao SQL para criar tabelas `marketing_credits` e `credit_transactions`

### Fluxo do Usuario

1. Usuario acessa Marketing Studio e ve "3 creditos gratuitos"
2. Gera imagem -- credito debitado, mostra "2 creditos restantes"
3. Usa todos os 3 creditos gratuitos
4. Tenta gerar -- ve modal "Creditos esgotados - Comprar mais"
5. Escolhe pacote (10, 30 ou 100 creditos)
6. Redireciona para checkout Stripe (pagamento unico)
7. Apos pagamento, creditos adicionados automaticamente
8. Todo mes, 3 creditos gratuitos sao restaurados
