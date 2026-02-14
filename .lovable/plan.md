

## Pix Profissional: Reconciliacao, Validacao e Melhorias

### Visao Geral
Transformar o sistema Pix em uma solucao profissional e completa, com reconciliacao automatizada de pagamentos, validacao inteligente de configuracao, e melhorias de experiencia para o dono do restaurante e para o cliente.

---

### 1. Tabela de Reconciliacao Pix (Nova)

Criar tabela `pix_transactions` para rastrear pagamentos Pix gerados vs confirmados:

```text
pix_transactions
  id (uuid, PK)
  unit_id (uuid, FK -> units)
  order_id (uuid, FK -> orders, nullable)
  table_id (uuid, FK -> tables, nullable)
  transaction_id (text) -- ex: PED64, CONTA5
  pix_code (text) -- codigo EMV gerado
  amount (numeric)
  status (text) -- 'pending', 'confirmed', 'expired', 'cancelled'
  customer_phone (text, nullable)
  customer_name (text, nullable)
  generated_at (timestamptz, default now())
  confirmed_at (timestamptz, nullable)
  expires_at (timestamptz) -- 30min apos geracao
  metadata (jsonb, default '{}')
```

- RLS: staff da unidade pode ler/atualizar; sistema pode inserir
- Publicacao realtime para dashboard ao vivo

### 2. Validacao de Configuracao Pix com Auto-Fix

**Novo componente: `PixConfigValidator`** (na aba Financeiro das configuracoes)

Exibir um painel de "saude" da configuracao Pix com verificacoes:
- Chave Pix preenchida e valida (tipo detectado automaticamente)
- Nome do beneficiario preenchido (nao generico)
- Cidade do beneficiario preenchida
- Chave Pix testada com geracao de codigo EMV de prova
- Aviso se nome usa fallback generico ("RESTAURANTE")

Cada item mostra status (ok/alerta/erro) e botao de "corrigir" que preenche automaticamente:
- Nome do beneficiario: preenche com o nome da unidade se vazio
- Cidade: sugere baseado no endereco cadastrado da unidade
- Chave Pix: indica o formato correto baseado no tipo detectado

### 3. Dashboard de Transacoes Pix (Novo)

**Novo componente na pagina de Caixa/Reports:**

- Lista de Pix gerados com status (pendente/confirmado/expirado)
- Totalizadores: gerados hoje, confirmados, taxa de conversao
- Botao para confirmar manualmente um Pix recebido
- Filtros por periodo, status, pedido

### 4. Melhorias no Webhook WhatsApp

No `confirmarPedido`, ao gerar o codigo Pix:
- Registrar na tabela `pix_transactions` com status 'pending'
- Incluir `expires_at` (30 minutos)
- Permitir que o bot responda a "ja paguei" verificando transacoes pendentes

No `send-order-notification`, mesma logica: registrar Pix gerado.

### 5. Melhorias de UX para o Cliente

- Codigo Pix com instrucoes claras e nome do beneficiario visivel
- No rastreamento do pedido, mostrar status do Pix (aguardando/confirmado)
- Botao "Ja paguei" no tracking que notifica o restaurante

### 6. Trigger de Expiracao Automatica

Cron job (pg_cron) que a cada 5 minutos marca como 'expired' transacoes com `expires_at < now()` e status 'pending'.

---

### Detalhes Tecnicos

**Migracao SQL:**
1. Criar tabela `pix_transactions` com colunas, indices e RLS
2. Habilitar realtime na tabela
3. Criar cron job de expiracao

**Arquivos novos:**
- `src/components/settings/PixConfigValidator.tsx` -- painel de validacao com auto-fix
- `src/components/reports/PixTransactionsDashboard.tsx` -- dashboard de reconciliacao
- `src/hooks/usePixTransactions.ts` -- hook para CRUD de transacoes Pix

**Arquivos modificados:**
- `src/components/settings/FinancialTab.tsx` -- integrar PixConfigValidator
- `src/hooks/useUnitSettings.ts` -- adicionar helper de validacao Pix
- `supabase/functions/whatsapp-webhook/index.ts` -- registrar Pix gerado em pix_transactions
- `supabase/functions/send-order-notification/index.ts` -- registrar Pix gerado em pix_transactions
- `src/pages/OrderTracking.tsx` -- mostrar status Pix e botao "Ja paguei"
- `src/pages/Reports.tsx` -- adicionar aba/secao de reconciliacao Pix
- `src/pages/Cashier.tsx` -- notificacao de Pix pendente para confirmar

**Sequencia de implementacao:**
1. Migracoes de banco (tabela + RLS + cron)
2. Hook `usePixTransactions`
3. `PixConfigValidator` no FinancialTab
4. Registro de transacoes nos Edge Functions
5. Dashboard de reconciliacao
6. UX de tracking com status Pix

