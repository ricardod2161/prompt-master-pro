
## Corrigir Rastreamento de Pedido no Celular

### Problema
O pedido aparece como "nao encontrado" porque:

1. Apos fazer um pedido, o app redireciona para `/track/{order_id}` (UUID interno)
2. Porem, as regras de seguranca do banco de dados so permitem acesso publico via `tracking_token`
3. A consulta busca pelo campo `id`, mas o usuario anonimo nao tem permissao para ler por esse campo
4. O botao "Voltar ao inicio" funciona corretamente no codigo (`navigate("/")`), mas como o pedido nao e encontrado, o botao mostrado e o da tela de erro

### Solucao (3 arquivos)

**1. `src/hooks/useCustomerOrder.ts`**
- Apos criar o pedido, salvar o `tracking_token` retornado (em vez de so o `id`)
- Redirecionar para `/track/{tracking_token}` em vez de `/track/{order_id}`

**2. `src/hooks/useOrderTracking.ts`**
- Alterar a consulta principal para buscar por `tracking_token` em vez de `id`
- `.eq("tracking_token", token)` no lugar de `.eq("id", orderId)`

**3. `src/pages/OrderTracking.tsx`**
- Renomear o parametro de rota de `orderId` para `token` para maior clareza
- Manter o botao "Voltar" funcional (ja funciona, o problema era so o pedido nao ser encontrado)

### Resultado
- O link de rastreamento usara o token seguro em vez do UUID interno
- O pedido sera encontrado corretamente no celular
- A privacidade dos dados e mantida (sem expor IDs internos)
- O botao "Voltar" voltara a funcionar pois o pedido sera carregado normalmente
