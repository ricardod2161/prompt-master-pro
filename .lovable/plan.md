
# Funcionalidade: Dividir Conta / Pagamento Parcial

## Resumo do Teste Realizado

O fluxo de "Fechar Conta" foi testado com sucesso:
- Ver Conta mostra todos os pedidos acumulados corretamente
- Total calculado corretamente (R$ 69,40 no teste)
- Campo de telefone aparece ao clicar em "Fechar Conta"
- Notificação WhatsApp enviada com sucesso
- Pedidos atualizados para status "delivered"
- Mesa liberada para status "free"
- Sheet fecha automaticamente após 3 segundos

---

## Nova Funcionalidade: Dividir Conta

### Visão Geral

Permitir que clientes dividam a conta entre múltiplas pessoas, com três opções de divisão:

```text
┌─────────────────────────────────────┐
│         DIVIDIR CONTA               │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐
│  │  ÷ N    │  │ Pedidos │  │  R$ X   │
│  │ Pessoas │  │Separados│  │ Valor   │
│  └─────────┘  └─────────┘  └─────────┘
│                                     │
│  Total: R$ 120,00                   │
│  ─────────────────────────          │
│  Dividir por 3 pessoas              │
│  Cada um paga: R$ 40,00             │
│                                     │
│  [   Pagar Minha Parte   ]          │
│                                     │
└─────────────────────────────────────┘
```

### Opções de Divisão

1. **Dividir por Pessoas**: Cliente informa número de pessoas, sistema calcula valor por pessoa
2. **Dividir por Pedidos**: Cada pessoa seleciona os pedidos que quer pagar
3. **Valor Personalizado**: Cliente informa o valor que deseja pagar

### Fluxo do Usuário

```text
Ver Conta → Dividir Conta → Selecionar Método → Informar Valor/Qtd → Pagar Parte → Receber Comprovante
```

---

## Alterações Técnicas

### 1. Novo Componente: `SplitBillSheet.tsx`

Interface para configurar a divisão:
- Seletor de método de divisão (tabs ou botões)
- Input para número de pessoas ou valor
- Preview do valor a pagar
- Lista de pedidos com checkbox (para divisão por pedido)
- Saldo restante da conta

### 2. Atualização: `TableBillSheet.tsx`

Adicionar botão "Dividir Conta" no footer:
- Aparece ao lado de "Fechar Conta"
- Abre o SplitBillSheet como sub-sheet ou modal

### 3. Novo Hook: `useSplitBill.ts`

Lógica para divisão:
- Calcular valor por pessoa
- Rastrear pagamentos parciais
- Atualizar saldo restante
- Enviar comprovante individual via WhatsApp

### 4. Atualização no Banco de Dados

Nova tabela `bill_payments` para rastrear pagamentos parciais:
- `id`: UUID
- `table_id`: UUID (referência à mesa)
- `amount`: numeric (valor pago)
- `customer_phone`: text
- `payment_method`: text (pix, cash, credit)
- `created_at`: timestamp

### 5. Atualização: Edge Function

Modificar `send-order-notification` para:
- Suportar tipo "partial_payment"
- Enviar comprovante individual com valor pago
- Mostrar saldo restante quando houver

---

## Interface do Usuário

### Estados do Footer

**Estado Normal:**
```
┌─────────────────────────────────────┐
│  Total da Conta      R$ 120,00      │
│                                     │
│  [ Dividir Conta ] [ Fechar Conta ] │
└─────────────────────────────────────┘
```

**Após Pagamento Parcial:**
```
┌─────────────────────────────────────┐
│  Total: R$ 120,00                   │
│  Pago: R$ 40,00 (1 pessoa)          │
│  Restante: R$ 80,00                 │
│                                     │
│  [ Dividir Conta ] [ Fechar Conta ] │
└─────────────────────────────────────┘
```

### Componente SplitBillSheet

```text
┌─────────────────────────────────────┐
│  Dividir Conta - Mesa 5             │
├─────────────────────────────────────┤
│                                     │
│  Como deseja dividir?               │
│                                     │
│  [Por Pessoas] [Por Pedido] [Valor] │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  Quantas pessoas?                   │
│  [ - ]    3    [ + ]                │
│                                     │
│  ─────────────────────────────────  │
│  Total: R$ 120,00                   │
│  Sua parte: R$ 40,00                │
│  ─────────────────────────────────  │
│                                     │
│  Telefone: (00) 00000-0000          │
│                                     │
│  [    Pagar Minha Parte    ]        │
│                                     │
└─────────────────────────────────────┘
```

---

## Mensagem WhatsApp (Pagamento Parcial)

```
💳 *Pagamento Parcial - Mesa 5*

Olá João!

Você pagou sua parte da conta:

💰 Valor pago: *R$ 40,00*
📋 Divisão: 3 pessoas

━━━━━━━━━━━━━━━━
📊 Status da Conta:
• Total: R$ 120,00
• Pago: R$ 40,00
• Restante: R$ 80,00
━━━━━━━━━━━━━━━━

📱 *Pague via Pix:*
Copie o código abaixo:

```00020126360014br.gov.bcb.pix...```

Obrigado! 💚
```

---

## Validações

- Não permitir pagamento parcial maior que o saldo restante
- Mínimo de 2 pessoas para dividir por pessoas
- Telefone obrigatório para receber comprovante
- Quando saldo restante for R$ 0, fechar conta automaticamente

---

## Resumo dos Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/customer-order/SplitBillSheet.tsx` | Criar |
| `src/components/customer-order/TableBillSheet.tsx` | Atualizar |
| `src/hooks/useSplitBill.ts` | Criar |
| `src/hooks/useTableBill.ts` | Atualizar |
| `supabase/functions/send-order-notification/index.ts` | Atualizar |
| Migração SQL para `bill_payments` | Criar |
