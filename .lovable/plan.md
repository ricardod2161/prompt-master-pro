
## Correcao: Pedidos Duplicados e Pix Invalido

### Problema 1: Pedidos Duplicados
O bot da IA esta chamando a ferramenta `confirmar_pedido` repetidamente a cada mensagem do cliente apos a confirmacao inicial. Quando o cliente disse "Pix" (19:04:58), "Sim" (19:05:25), e "O brigado envi o pix" (19:06:05), a IA criou um pedido novo em cada uma dessas mensagens - totalizando 4 pedidos (#64, #65, #66, #67) quando deveria ter criado apenas 1.

**Causa raiz**: Nao existe nenhum mecanismo de protecao contra pedidos duplicados. A funcao `confirmarPedido` cria um novo pedido toda vez que e chamada, sem verificar se ja existe um pedido recente para o mesmo cliente.

**Solucao**: Adicionar uma verificacao anti-duplicidade na funcao `confirmarPedido` que checa se ja existe um pedido pendente do mesmo telefone criado nos ultimos 2 minutos. Se existir, retorna uma mensagem informando o pedido ja existente em vez de criar outro.

### Problema 2: Pix Invalido
Os campos `pix_key`, `pix_merchant_name` e `pix_merchant_city` estao **TODOS NULL** na tabela `unit_settings` para a Churrascaria Santo Antonio. Sem a chave Pix configurada, o codigo EMV nao pode ser gerado corretamente.

**Solucao**: O codigo ja trata o caso de `pix_key` nulo (nao gera o codigo). Porem, a IA esta dizendo ao cliente para pagar via Pix sem ter os dados configurados. Vamos adicionar uma verificacao no `confirmarPedido` que, quando o pagamento e Pix mas nao ha chave configurada, avisa isso na mensagem de confirmacao.

### Detalhes Tecnicos

**Arquivo: `supabase/functions/whatsapp-webhook/index.ts`**

1. Na funcao `confirmarPedido` (linha ~740), adicionar antes de criar o pedido:

```typescript
// Anti-duplicate: check if same customer has a pending order in last 2 minutes
const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
const { data: recentOrder } = await supabase
  .from("orders")
  .select("id, order_number")
  .eq("unit_id", unitId)
  .eq("customer_phone", customerPhone)
  .eq("status", "pending")
  .gte("created_at", twoMinutesAgo)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();

if (recentOrder) {
  return `⚠️ Voce ja tem um pedido recente em andamento! Pedido #${recentOrder.order_number}. Aguarde o preparo ou fale conosco se precisar de algo mais.`;
}
```

2. Apos gerar o codigo Pix (linha ~903), adicionar aviso quando chave nao esta configurada:

```typescript
// Se pagamento e pix mas nao tem chave configurada, avisar
if (pagamento.forma === "pix" && !pixPaymentCode) {
  // Nao gerar codigo, mas avisar no resultado
}
```

E na montagem da mensagem de confirmacao, quando `pagamento.forma === "pix"` e `pixPaymentCode` e null, incluir instrucao para solicitar chave Pix ao estabelecimento.

3. Alem disso, limpar os 3 pedidos duplicados do banco (manter apenas o #64 como o pedido real):

```sql
-- Deletar pedidos duplicados #65, #66, #67
DELETE FROM order_payments WHERE order_id IN ('82330224-...', '4320a661-...', 'e781a2e9-...');
DELETE FROM order_items WHERE order_id IN ('82330224-...', '4320a661-...', 'e781a2e9-...');
DELETE FROM delivery_orders WHERE order_id IN ('82330224-...', '4320a661-...', 'e781a2e9-...');
DELETE FROM orders WHERE id IN ('82330224-...', '4320a661-...', 'e781a2e9-...');
```

### Arquivos Modificados
- `supabase/functions/whatsapp-webhook/index.ts` - Adicionar protecao anti-duplicidade e aviso de Pix nao configurado
- Limpeza de dados duplicados no banco
