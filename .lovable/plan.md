## Corrigir conta que nao limpa apos fechamento

### Problema

A consulta de "Ver Conta" busca pedidos com status `["pending", "preparing", "ready", "delivered"]`. Quando a conta e fechada, os pedidos sao marcados como `"delivered"` -- que ainda esta no filtro. Resultado: os pedidos nunca somem, e o badge "5" fica permanente.

Na base de dados, existem 5 pedidos antigos (de 4 a 9 de fevereiro) com status "delivered" nessa mesa que aparecem eternamente.

### Solucao

**Parte 1: Migracao de banco de dados**

Adicionar o valor `"completed"` ao enum `order_status`. Este status representa "conta fechada/finalizada", diferente de "delivered" (comida entregue na mesa).

```sql
ALTER TYPE order_status ADD VALUE 'completed';
```

**Parte 2: Atualizar `useTableBill.ts**`

No `closeBillMutation`, alterar o status dos pedidos de `"delivered"` para `"completed"`:

- Linha 102: `.update({ status: "completed" })` em vez de `"delivered"`

Isso faz com que os pedidos fechados saiam do filtro da consulta (`["pending", "preparing", "ready", "delivered"]`) e nao aparecam mais.

**Parte 3: Limpar dados existentes**

Executar uma consulta para marcar os 5 pedidos antigos como "completed", limpando a mesa imediatamente:

```sql
UPDATE orders SET status = 'completed' 
WHERE table_id = '324160fb-52c7-4f88-be83-6b93035e50ab' 
AND status = 'delivered';
```

**Parte 4: Atualizar referencias no sistema**

Nos arquivos que filtram ou exibem pedidos, garantir que "completed" seja tratado corretamente:

- `src/hooks/useDashboard.ts` - excluir "completed" dos calculos (similar a "cancelled")
- `src/pages/Dashboard.tsx` - adicionar label/cor para "completed" 
- `src/pages/Tables.tsx` - ja exclui "delivered", confirmar que "completed" tambem fica fora
- `src/components/shared/StatusBadge.tsx` - adicionar estilo para "completed"

### Resultado

- Apos fechar a conta, pedidos viram "completed" e somem da consulta
- O badge "Ver Conta" mostra 0 e o botao desaparece
- Pedidos entregues na mesa ("delivered") continuam visiveis ate o fechamento da conta
- Historico de pedidos "completed" fica disponivel para relatorios, e veja quais as melhorias que voce colocaria?