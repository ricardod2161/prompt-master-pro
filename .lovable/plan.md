
# Resetar Contador de Pedidos

## Problema
O contador de pedidos (`order_number`) usa uma sequencia PostgreSQL (`orders_order_number_seq`) que esta no #79. Ao entregar o sistema limpo ao cliente, os pedidos continuariam a partir do #80 em vez de comecar do #1.

## Solucao

### 1. Atualizar a funcao SQL `reset_unit_data`

Adicionar o reset da sequencia de pedidos dentro da funcao `reset_unit_data` existente. Depois de deletar todos os pedidos, executar:

```sql
ALTER SEQUENCE orders_order_number_seq RESTART WITH 1;
```

Isso garante que ao resetar a unidade, o proximo pedido criado sera o #1.

### 2. Adicionar botao separado no DangerZoneSection

Alem do reset automatico junto com o reset da unidade, adicionar um botao independente "Resetar Contador de Pedidos" na Zona de Perigo para casos onde o admin quer apenas zerar o contador sem apagar todos os dados.

Para isso, criar uma nova funcao SQL:

```sql
CREATE OR REPLACE FUNCTION public.reset_order_counter(_unit_id uuid, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validar acesso
  IF NOT (has_unit_access(_user_id, _unit_id) AND 
         (has_role(_user_id, 'admin') OR is_developer(_user_id))) THEN
    RAISE EXCEPTION 'Sem permissao';
  END IF;

  -- Resetar sequencia para o valor 1
  ALTER SEQUENCE public.orders_order_number_seq RESTART WITH 1;

  -- Log
  INSERT INTO admin_logs (action, category, user_id, unit_id, severity)
  VALUES ('Contador de pedidos resetado', 'system', _user_id, _unit_id, 'warning');
END;
$$;
```

### 3. Atualizar DangerZoneSection.tsx

Adicionar um segundo card na Zona de Perigo com:
- Icone de "RotateCcw" (reset)
- Titulo: "Resetar Contador de Pedidos"
- Descricao: "O proximo pedido comecara do #1"
- Botao com dialog de confirmacao simples (sem necessidade de digitar nome)
- Chamar `supabase.rpc('reset_order_counter', { _unit_id, _user_id })`

### 4. Atualizar `reset_unit_data` tambem

Adicionar `ALTER SEQUENCE orders_order_number_seq RESTART WITH 1;` ao final da funcao `reset_unit_data` existente, para que o reset completo tambem zere o contador.

### Arquivos modificados

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Criar funcao `reset_order_counter` + atualizar `reset_unit_data` |
| `src/components/settings/DangerZoneSection.tsx` | Adicionar botao de reset do contador |
