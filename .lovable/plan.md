
# Corrigir Pedidos do WhatsApp Aparecendo com Canal Errado

## Problema Identificado

Investigacao detalhada revelou que os pedidos feitos pelo WhatsApp **estao sendo criados** no banco de dados, porem com o **canal errado**. Por exemplo, pedidos #39, #40, #41 foram feitos via WhatsApp (telefone 559882549505) mas estao salvos como `channel: "delivery"` em vez de `channel: "whatsapp"`.

### Causa Raiz

Na funcao `confirmarPedido` dentro do webhook do WhatsApp (`supabase/functions/whatsapp-webhook/index.ts`, linhas 768-773), o canal e mapeado pela modalidade de entrega:

```text
"entrega" -> "delivery"
"retirada" -> "counter"
"local" -> "table"
fallback -> "whatsapp"
```

Isso significa que apenas pedidos onde a IA nao consegue mapear a modalidade recebem o canal `"whatsapp"`. Na pratica, pedidos de entrega ficam como `"delivery"`, retirada como `"counter"`, etc. O canal deveria ser **sempre** `"whatsapp"` para pedidos vindos do WhatsApp.

## Solucao

### 1. Corrigir o canal na funcao `confirmarPedido` (whatsapp-webhook)

Forcar o canal como `"whatsapp"` para todos os pedidos criados pelo webhook, independente da modalidade. A modalidade (entrega/retirada/local) sera salva nas notas do pedido, nao no canal:

```text
channel = "whatsapp" (sempre)
notes = inclui informacao da modalidade
```

### 2. Corrigir pedidos existentes no banco

Atualizar os pedidos que foram criados pelo WhatsApp mas estao com canal errado. Identificar pela presenca de `customer_phone` com formato de WhatsApp (prefixo 55) e sem associacao com mesa/usuario autenticado.

### 3. Garantir que delivery_orders seja criado para entregas

Manter a criacao do registro em `delivery_orders` para pedidos de entrega via WhatsApp, pois isso e necessario para o fluxo de entregas.

## Resultado Esperado

- Todos os pedidos vindos do WhatsApp aparecerao com a badge "WhatsApp" na lista de pedidos
- O filtro por canal "WhatsApp" mostrara todos os pedidos corretamente
- O realtime ja corrigido anteriormente garantira que aparecem sem recarregar a pagina
