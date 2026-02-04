
# Funcionalidade "Fechar Conta" para Mesas

## Objetivo

Permitir que clientes de mesa vejam todos os pedidos acumulados durante o consumo e fechem a conta, recebendo o valor total via WhatsApp com código Pix para pagamento.

## Fluxo do Cliente

```text
┌─────────────────────┐
│  Cliente na Mesa    │
│  (CustomerOrder)    │
└─────────┬───────────┘
          │
          ├──► Faz pedido 1 (R$ 35,00)
          ├──► Faz pedido 2 (R$ 22,50)
          ├──► Faz pedido 3 (R$ 18,00)
          │
          ▼
┌─────────────────────┐
│  Clica "Ver Conta"  │
│  (Botão no header)  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Modal com resumo   │──► Lista de pedidos
│  de todos pedidos   │──► Total acumulado
└─────────┬───────────┘
          │
          ▼ Clica "Fechar Conta"
┌─────────────────────┐
│  Preenche telefone  │
│  (se não informou)  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  WhatsApp enviado   │──► Total + Pix
│  Mesa liberada      │
└─────────────────────┘
```

## Componentes da Interface

### 1. Botão "Ver Conta" no Header

Aparece no canto direito do header quando a mesa tem pedidos ativos:

- Badge com quantidade de pedidos
- Ícone de conta/recibo
- Contador do total acumulado

### 2. Modal/Sheet "Minha Conta"

Design profissional com:

- Lista de todos os pedidos da sessão
- Para cada pedido: número, horário, itens, valor
- Separador visual entre pedidos
- Total acumulado destacado
- Código Pix exibido em área copiável
- Botão "Fechar Conta e Receber no WhatsApp"

### 3. Mensagem WhatsApp

```
🧾 *Conta Fechada - Mesa 5*

Olá Maria! Aqui está o resumo da sua conta:

📋 *Pedido #42* (14:30)
• 2x Hambúrguer Artesanal - R$ 70,00
• 1x Batata Frita - R$ 18,00
Subtotal: R$ 88,00

📋 *Pedido #45* (15:15)
• 2x Refrigerante - R$ 14,00
Subtotal: R$ 14,00

━━━━━━━━━━━━━━━━
💰 *TOTAL: R$ 102,00*
━━━━━━━━━━━━━━━━

📱 *Pague via Pix:*
Copie o código abaixo:

```00020126360014br.gov.bcb.pix...```

Agradecemos a preferência! 💚
```

## Alterações Técnicas

### 1. Novo Hook: `useTableBill`

Busca e gerencia os pedidos da mesa:

- Buscar pedidos ativos da mesa (status não finalizado)
- Calcular total acumulado
- Função para fechar conta (enviar WhatsApp + atualizar mesa)

### 2. Atualização: `src/pages/CustomerOrder.tsx`

- Importar novo hook
- Adicionar botão "Ver Conta" no header
- Adicionar Sheet/Modal com resumo da conta
- Integrar com envio de WhatsApp

### 3. Atualização: `src/hooks/useCustomerOrder.ts`

- Adicionar função `closeBill` que:
  - Busca todos os pedidos da mesa
  - Calcula total
  - Invoca edge function com dados consolidados
  - Atualiza status da mesa para "free"

### 4. Atualização: Edge Function `send-order-notification`

- Adicionar suporte para tipo "bill_close"
- Gerar mensagem formatada com todos os pedidos
- Incluir código Pix do total

## Estados de Pedidos Considerados

Para o cálculo da conta, incluir pedidos com status:
- `pending` - Aguardando
- `preparing` - Em preparo
- `ready` - Pronto
- `delivered` - Entregue (consumido, mas não pago)

Excluir:
- `cancelled` - Cancelado

## Responsividade

- Sheet abre de baixo em mobile (90vh)
- Lista de pedidos com scroll interno
- Botões de ação sempre visíveis no footer
- Área do Pix com destaque e botão de copiar
- Feedback visual ao copiar código

## Segurança

- Validar que os pedidos pertencem à mesa
- Não permitir fechar conta se não houver pedidos
- Manter histórico de pedidos após fechamento
