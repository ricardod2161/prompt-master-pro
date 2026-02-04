
# Plano: Acompanhamento de Pedido em Tempo Real + QR Code de Pagamento Pix

## Visão Geral

Implementar duas funcionalidades principais:
1. **Acompanhamento em tempo real**: Cliente vê o status do pedido atualizar automaticamente
2. **QR Code Pix**: Gerar código Pix para pagamento exibido na tela e enviado via WhatsApp

---

## Fluxo Proposto

```text
┌─────────────────────────────────────────────────────────────────┐
│  1. CLIENTE FAZ PEDIDO                                          │
│     └→ Envia pedido para cozinha                                │
│     └→ Recebe tela de acompanhamento com QR Code Pix            │
├─────────────────────────────────────────────────────────────────┤
│  2. ACOMPANHAMENTO EM TEMPO REAL                                │
│     └→ Status atualiza automaticamente via Realtime             │
│     └→ Pendente → Preparando → Pronto                           │
│     └→ Animações e feedback visual a cada mudança               │
├─────────────────────────────────────────────────────────────────┤
│  3. QR CODE PIX NA TELA                                         │
│     └→ Gerado dinamicamente com valor do pedido                 │
│     └→ Cliente escaneia e paga pelo app do banco                │
│     └→ Botão "Copiar código Pix"                                │
├─────────────────────────────────────────────────────────────────┤
│  4. NOTIFICAÇÃO WHATSAPP                                        │
│     └→ Recebe mensagem com QR Code Pix em anexo                 │
│     └→ Código Pix copia e cola na mensagem                      │
│     └→ Segunda mensagem quando pedido estiver pronto            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Alterações Necessárias

### 1. Banco de Dados

**Adicionar campo `pix_key` na tabela `unit_settings`:**

```sql
ALTER TABLE public.unit_settings
ADD COLUMN pix_key TEXT;

COMMENT ON COLUMN public.unit_settings.pix_key IS 'Chave Pix para recebimento de pagamentos';
```

### 2. Nova Página de Acompanhamento

**Arquivo:** `src/pages/OrderTracking.tsx` (novo)

Funcionalidades:
- Recebe o `orderId` como parâmetro da URL
- Exibe status atual do pedido com ícones animados
- Timeline visual mostrando progresso (Pendente > Preparando > Pronto)
- Atualização em tempo real via Supabase Realtime
- QR Code Pix com valor do pedido
- Botão para copiar código Pix
- Tempo estimado de preparo

### 3. Novo Hook de Acompanhamento

**Arquivo:** `src/hooks/useOrderTracking.ts` (novo)

Funcionalidades:
- Query para buscar dados do pedido
- Subscription Realtime para atualizações de status
- Busca configurações da unidade (chave Pix)
- Geração do código Pix (EMV format)

### 4. Modificar CustomerOrder

**Arquivo:** `src/pages/CustomerOrder.tsx`

Mudanças:
- Após criar pedido, redirecionar para `/track/:orderId`
- Armazenar `orderId` no state para navegação
- Remover tela de sucesso estática

### 5. Adicionar Rota

**Arquivo:** `src/App.tsx`

Nova rota pública: `/track/:orderId`

### 6. Atualizar Edge Function

**Arquivo:** `supabase/functions/send-order-notification/index.ts`

Mudanças:
- Buscar chave Pix da unidade
- Gerar código Pix copia e cola
- Incluir código na mensagem de confirmação do pedido
- Nova mensagem quando status mudar para "ready"

### 7. Configurações - Aba Financeira

**Arquivo:** `src/components/settings/FinancialTab.tsx`

Adicionar:
- Campo para cadastrar chave Pix
- Validação do formato (CPF, CNPJ, email, telefone, chave aleatória)
- Preview do QR Code gerado

---

## Componentes Visuais

### Tela de Acompanhamento (Mobile-First)

```text
┌────────────────────────────────┐
│  ← Voltar       Mesa 5         │
├────────────────────────────────┤
│                                │
│     ┌──────────────────┐       │
│     │   PEDIDO #127    │       │
│     └──────────────────┘       │
│                                │
│    ○ ─────── ● ─────── ○       │
│  Pendente  Preparando  Pronto  │
│                                │
│     🍳 Preparando...           │
│     Tempo estimado: 15 min     │
│                                │
├────────────────────────────────┤
│  💳 PAGAMENTO                  │
│  ┌────────────────────────┐    │
│  │                        │    │
│  │     [QR CODE PIX]      │    │
│  │                        │    │
│  └────────────────────────┘    │
│                                │
│  Total: R$ 45,90               │
│                                │
│  ┌────────────────────────┐    │
│  │  📋 Copiar código Pix  │    │
│  └────────────────────────┘    │
│                                │
│  Itens do pedido:              │
│  • 2x Hambúrguer Clássico      │
│  • 1x Batata Frita             │
│  • 2x Refrigerante             │
│                                │
└────────────────────────────────┘
```

---

## Geração do Código Pix

O código Pix será gerado no formato EMV (padrão brasileiro), contendo:
- Chave Pix do estabelecimento
- Valor do pedido
- Identificador da transação (número do pedido)
- Nome do beneficiário

A biblioteca `qrcode.react` já está instalada no projeto e será reutilizada.

---

## Mensagem WhatsApp com Pix

**Mensagem de confirmação do pedido:**
```
✅ *Pedido Confirmado!*

Olá João! Seu pedido *#127* na *Mesa 5* foi recebido!

💰 *Valor Total: R$ 45,90*

📱 *Pague via Pix:*
Copie o código abaixo e cole no seu app de banco:

00020126580014BR.GOV.BCB.PIX0136abc123-...

⏱️ Tempo estimado: 15-20 min

Acompanhe seu pedido em tempo real:
https://seusite.com/track/abc123
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/migrations/new.sql` | Criar | Adicionar coluna pix_key |
| `src/pages/OrderTracking.tsx` | Criar | Página de acompanhamento |
| `src/hooks/useOrderTracking.ts` | Criar | Hook com realtime |
| `src/lib/pix-generator.ts` | Criar | Utilitário geração Pix |
| `src/pages/CustomerOrder.tsx` | Modificar | Redirecionar após pedido |
| `src/App.tsx` | Modificar | Adicionar rota /track |
| `src/components/settings/FinancialTab.tsx` | Modificar | Campo chave Pix |
| `supabase/functions/send-order-notification/index.ts` | Modificar | Incluir código Pix |

---

## Resultado Esperado

- Cliente acompanha status do pedido em tempo real
- QR Code Pix funcional para pagamento imediato
- Código Pix enviado via WhatsApp junto com confirmação
- Experiência premium e profissional para o cliente
- Redução de tempo de atendimento (cliente já pagou antes de receber)

---

## Considerações de Segurança

- Chave Pix armazenada de forma segura no banco
- Políticas RLS para leitura pública apenas de pedidos de mesa
- Código Pix gerado no servidor (edge function) para maior segurança
- Validação do formato da chave Pix antes de salvar
