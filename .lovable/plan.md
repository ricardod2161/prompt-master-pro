
# Seleção de Forma de Pagamento no Cardápio Digital

## Problema Identificado
O fluxo atual de pedido (`CustomerOrder.tsx`) não inclui seleção de forma de pagamento. O cliente finaliza o pedido sem informar como vai pagar.

## Solução Proposta

### Fase 1: Banco de Dados
Adicionar campo `change_for` na tabela `orders` para armazenar o valor do troco (quando pagamento em dinheiro):

```sql
ALTER TABLE public.orders
ADD COLUMN payment_method TEXT,
ADD COLUMN change_for NUMERIC;
```

### Fase 2: Interface do Cliente
Adicionar seção de pagamento no carrinho (`CustomerOrder.tsx`) antes do botão "Enviar Pedido":

**Design da Seleção:**
- 3 opções visuais com ícones: 💵 Dinheiro | 📱 Pix | 💳 Cartão
- Seleção obrigatória para finalizar pedido
- Animação suave ao selecionar

**Lógica Condicional:**
| Forma Selecionada | Campo Adicional |
|-------------------|-----------------|
| Dinheiro | Input: "Pagar com R$" → Calcula e mostra troco |
| Pix | Nenhum campo extra |
| Cartão | Nenhum campo extra (crédito/débito) |

### Fase 3: Hook de Pedido
Atualizar `useCustomerOrder.ts`:
- Adicionar estado `paymentMethod`
- Adicionar estado `changeFor`
- Incluir campos no insert da order
- Validar que forma de pagamento foi selecionada

### Fase 4: Exibição do Troco
Quando dinheiro selecionado:
```
Pagar com: [R$ ____]
Troco: R$ XX,XX
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| **Migração SQL** | Adicionar colunas `payment_method`, `change_for` |
| `src/hooks/useCustomerOrder.ts` | Estados e lógica de pagamento |
| `src/pages/CustomerOrder.tsx` | UI de seleção e input de troco |

---

## Fluxo do Usuário

```text
1. Cliente adiciona produtos ao carrinho
2. Abre carrinho
3. Preenche nome/telefone (opcional)
4. NOVO → Seleciona forma de pagamento
5. Se DINHEIRO → Informa valor para troco
6. Clica "Enviar Pedido"
7. Redireciona para acompanhamento
```

---

## Detalhes Técnicos

### Componente de Seleção de Pagamento
```tsx
// Novo componente dentro do carrinho
<div className="glass rounded-2xl p-5 space-y-4">
  <p className="font-semibold">Forma de Pagamento</p>
  
  <div className="grid grid-cols-3 gap-3">
    <PaymentOption 
      icon={<Banknote />} 
      label="Dinheiro" 
      selected={paymentMethod === 'cash'}
      onClick={() => setPaymentMethod('cash')}
    />
    <PaymentOption 
      icon={<QrCode />} 
      label="Pix" 
      selected={paymentMethod === 'pix'}
      onClick={() => setPaymentMethod('pix')}
    />
    <PaymentOption 
      icon={<CreditCard />} 
      label="Cartão" 
      selected={paymentMethod === 'credit'}
      onClick={() => setPaymentMethod('credit')}
    />
  </div>
  
  {paymentMethod === 'cash' && (
    <div className="animate-fade-in space-y-3">
      <Input 
        type="number"
        placeholder="Pagar com R$"
        value={changeFor}
        onChange={(e) => setChangeFor(e.target.value)}
      />
      {changeFor > cartTotal && (
        <p className="text-sm">
          Troco: <span className="font-bold text-primary">
            {formatCurrency(changeFor - cartTotal)}
          </span>
        </p>
      )}
    </div>
  )}
</div>
```

### Validação no Submit
```typescript
// Em useCustomerOrder.ts
if (!paymentMethod) {
  throw new Error("Selecione uma forma de pagamento");
}

if (paymentMethod === 'cash' && changeFor && changeFor < cartTotal) {
  throw new Error("Valor insuficiente para pagamento");
}
```

### Insert do Pedido
```typescript
const { data: order } = await supabase
  .from("orders")
  .insert({
    // ... campos existentes
    payment_method: paymentMethod,
    change_for: paymentMethod === 'cash' ? changeFor : null,
  })
```
