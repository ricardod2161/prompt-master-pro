
# Reset de Unidade + Botao de Compra de Creditos Visivel

## 1. Botao de Reset do Restaurante (Configuracoes)

### Problema
Nao existe forma de limpar todos os dados de uma unidade para entregar "zerada" ao cliente. Hoje seria necessario deletar manualmente cada registro.

### Solucao
Adicionar uma nova aba "Avancado" nas Configuracoes (ou uma secao no final da aba "Unidade") com um botao "Resetar Unidade" que apaga todos os dados operacionais mantendo apenas a unidade e o usuario.

**O que sera apagado:**
- Pedidos (orders, order_items, order_payments, delivery_orders)
- Transacoes PIX (pix_transactions)
- Mesas (tables)
- Produtos e categorias (products, product_variations, product_addons, product_ingredients, categories)
- Estoque (inventory_items, inventory_movements)
- Conversas WhatsApp (whatsapp_messages, whatsapp_conversations)
- Notificacoes (notifications)
- Logs (admin_logs)
- Imagens de marketing (marketing_images)
- Creditos de marketing (marketing_credits, credit_transactions)
- Configuracoes da unidade (unit_settings) -- sera recriado com defaults
- Configuracoes WhatsApp (whatsapp_settings)

**O que NAO sera apagado:**
- A unidade em si (units)
- Associacao usuario-unidade (user_units)
- Roles do usuario (user_roles)
- Perfil do usuario (profiles)

### Implementacao Tecnica

1. **Nova funcao SQL `reset_unit_data`** (SECURITY DEFINER) que recebe `_unit_id` e `_user_id`, valida acesso (apenas admin ou developer), e deleta todos os dados da unidade em cascata dentro de uma transacao.

2. **Novo componente `src/components/settings/DangerZoneSection.tsx`** com:
   - Card vermelho (variant "destructive") com icone de alerta
   - Botao "Resetar Unidade"
   - Dialog de confirmacao com campo de texto onde o usuario deve digitar o nome da unidade para confirmar
   - Segundo dialog de confirmacao final ("Tem certeza absoluta?")

3. **Adicionar ao Settings.tsx** uma nova aba "Avancado" com icone `AlertTriangle` contendo o componente DangerZone.

## 2. Botao de Compra de Creditos Sempre Visivel

### Problema
O botao "Comprar" so aparece quando os creditos chegam a zero. O cliente nao tem como comprar creditos preventivamente.

### Solucao
Tornar o botao de compra sempre visivel no Marketing Studio, independente do saldo de creditos.

### Mudancas no MarketingStudio.tsx (linhas 289-306)
- Remover a condicao `credits.available <= 0` do botao "Comprar"
- O botao "Comprar Creditos" ficara sempre visivel ao lado do badge de creditos
- Manter o modal de compra existente (ja funciona)

## Detalhes Tecnicos

### Migracao SQL - Funcao `reset_unit_data`

```sql
CREATE OR REPLACE FUNCTION public.reset_unit_data(_unit_id uuid, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validar acesso: apenas admin da unidade ou developer
  IF NOT (has_unit_access(_user_id, _unit_id) AND 
         (has_role(_user_id, 'admin') OR is_developer(_user_id))) THEN
    RAISE EXCEPTION 'Sem permissao para resetar esta unidade';
  END IF;

  -- Deletar dados em ordem (respeitando foreign keys)
  DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE unit_id = _unit_id);
  DELETE FROM order_payments WHERE order_id IN (SELECT id FROM orders WHERE unit_id = _unit_id);
  DELETE FROM delivery_orders WHERE order_id IN (SELECT id FROM orders WHERE unit_id = _unit_id);
  DELETE FROM pix_transactions WHERE unit_id = _unit_id;
  DELETE FROM orders WHERE unit_id = _unit_id;
  DELETE FROM product_variations WHERE product_id IN (SELECT id FROM products WHERE unit_id = _unit_id);
  DELETE FROM product_addons WHERE product_id IN (SELECT id FROM products WHERE unit_id = _unit_id);
  DELETE FROM product_ingredients WHERE product_id IN (SELECT id FROM products WHERE unit_id = _unit_id);
  DELETE FROM products WHERE unit_id = _unit_id;
  DELETE FROM categories WHERE unit_id = _unit_id;
  DELETE FROM inventory_movements WHERE inventory_item_id IN (SELECT id FROM inventory_items WHERE unit_id = _unit_id);
  DELETE FROM inventory_items WHERE unit_id = _unit_id;
  DELETE FROM tables WHERE unit_id = _unit_id;
  DELETE FROM whatsapp_messages WHERE conversation_id IN (SELECT id FROM whatsapp_conversations WHERE unit_id = _unit_id);
  DELETE FROM whatsapp_typing_status WHERE conversation_id IN (SELECT id FROM whatsapp_conversations WHERE unit_id = _unit_id);
  DELETE FROM whatsapp_conversations WHERE unit_id = _unit_id;
  DELETE FROM whatsapp_settings WHERE unit_id = _unit_id;
  DELETE FROM notifications WHERE unit_id = _unit_id;
  DELETE FROM admin_logs WHERE unit_id = _unit_id;
  DELETE FROM marketing_images WHERE unit_id = _unit_id;
  DELETE FROM credit_transactions WHERE unit_id = _unit_id;
  DELETE FROM marketing_credits WHERE unit_id = _unit_id;
  DELETE FROM cash_movements WHERE cash_register_id IN (SELECT id FROM cash_registers WHERE unit_id = _unit_id);
  DELETE FROM cash_registers WHERE unit_id = _unit_id;
  DELETE FROM unit_settings WHERE unit_id = _unit_id;

  -- Registrar log do reset (em outra unidade ou sem unit_id)
  INSERT INTO admin_logs (action, category, user_id, severity, description)
  VALUES ('Reset completo de unidade', 'system', _user_id, 'warning', 
          'Unidade ' || _unit_id || ' foi resetada');
END;
$$;
```

### Arquivos a criar/modificar

| Arquivo | Acao |
|---------|------|
| `src/components/settings/DangerZoneSection.tsx` | Criar - Card com botao reset + dialogs de confirmacao |
| `src/pages/Settings.tsx` | Modificar - Adicionar aba "Avancado" com DangerZone |
| `src/pages/MarketingStudio.tsx` | Modificar - Remover condicao do botao Comprar (linha 300) |
| Migracao SQL | Criar funcao `reset_unit_data` |

### Fluxo de Reset

1. Usuario vai em Configuracoes > aba "Avancado"
2. Ve card vermelho "Zona de Perigo" com aviso claro
3. Clica "Resetar Unidade"
4. Dialog pede para digitar o nome da unidade como confirmacao
5. Segundo dialog: "Tem certeza absoluta? Esta acao e irreversivel"
6. Executa `supabase.rpc('reset_unit_data', { _unit_id, _user_id })`
7. Refaz queries, mostra toast de sucesso
8. Redireciona para o Dashboard

### Fluxo de Compra de Creditos

1. No Marketing Studio, botao "Comprar Creditos" sempre visivel ao lado do saldo
2. Ao clicar, abre modal com os 3 pacotes (10, 30, 100 creditos)
3. Ao escolher pacote, redireciona para Stripe Checkout
4. Apos pagamento, creditos adicionados via callback na URL
