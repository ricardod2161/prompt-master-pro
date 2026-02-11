

# Cardapio Digital Publico + Integracao de Pagamento Pix/Stripe via WhatsApp

## Situacao Atual

O sistema **ja possui** as seguintes funcionalidades implementadas e funcionando:

| Funcionalidade | Status |
|---|---|
| Cardapio digital publico (`/order/:tableId`) | Implementado |
| QR Code por mesa com impressao de ticket | Implementado |
| Seletor de pagamento (Dinheiro, Pix, Cartao) | Implementado |
| Gerador de codigo Pix EMV (copia e cola) | Implementado |
| Notificacao WhatsApp com Pix automatico | Implementado |
| Rastreamento de pedidos (`/track/:orderId`) | Implementado |
| Stripe (assinaturas do sistema) | Implementado |

## O que Falta Configurar

### 1. Chave Pix da Churrascaria Santo Antonio
A chave Pix nao esta cadastrada nas configuracoes da unidade (`pix_key`, `pix_merchant_name`, `pix_merchant_city` estao vazios). Sem isso, o QR Code Pix nao e gerado nas notificacoes WhatsApp nem no cardapio digital.

**Acao:** Adicionar campo de QR Code Pix visivel no cardapio digital apos o pedido, e garantir que a tela de configuracoes permita salvar a chave Pix.

### 2. QR Code Pix na Tela de Sucesso do Pedido
Quando o cliente faz um pedido via cardapio digital e seleciona "Pix", ele e redirecionado para a pagina de rastreamento sem ver o QR Code Pix. Precisamos adicionar o QR Code Pix na pagina de rastreamento.

### 3. Stripe para Pagamentos de Pedidos via WhatsApp
Atualmente o Stripe e usado apenas para assinaturas do sistema (Starter/Pro/Enterprise). Para aceitar pagamentos online de pedidos via WhatsApp, sera necessario criar um fluxo de pagamento avulso (one-time payment) por pedido.

## Plano de Implementacao

### Etapa 1 - QR Code Pix no Rastreamento do Pedido
Adicionar na pagina `/track/:orderId` (`OrderTracking.tsx`) a exibicao do QR Code Pix quando:
- O metodo de pagamento for "pix"
- A unidade tiver chave Pix configurada
- O pedido ainda estiver pendente

Isso permite que o cliente escaneie o QR Code Pix direto pelo celular apos fazer o pedido.

### Etapa 2 - Link de Pagamento Stripe via WhatsApp
Criar uma edge function `create-order-payment` que gera um link de pagamento Stripe (Checkout Session em modo `payment`) para um pedido especifico. O link sera enviado automaticamente pelo WhatsApp quando o bot finalizar um pedido.

### Etapa 3 - Integrar Pagamento Stripe no Webhook do WhatsApp
Atualizar a funcao `whatsapp-webhook` para, apos criar um pedido, gerar automaticamente o link de pagamento Stripe e envia-lo na mensagem de confirmacao junto com o codigo Pix.

## Detalhes Tecnicos

### Arquivos Alterados

| Arquivo | Alteracao |
|---|---|
| `src/pages/OrderTracking.tsx` | Adicionar componente de QR Code Pix com codigo copia-e-cola quando pagamento for Pix |
| `supabase/functions/create-order-payment/index.ts` | **Novo** - Edge function que cria Stripe Checkout Session (mode: payment) para um pedido |
| `supabase/functions/send-order-notification/index.ts` | Adicionar link de pagamento Stripe na mensagem de confirmacao (alem do Pix) |
| `supabase/functions/whatsapp-webhook/index.ts` | Apos criar pedido, chamar `create-order-payment` e incluir link na resposta |
| `supabase/config.toml` | Registrar nova funcao `create-order-payment` com `verify_jwt = false` |

### Edge Function `create-order-payment`
- Recebe `orderId` e `unitId`
- Busca dados do pedido no banco
- Cria um produto Stripe temporario com nome "Pedido #X - Churrascaria"
- Cria Checkout Session com `mode: "payment"` e valor do pedido
- Retorna URL do checkout
- Success URL redireciona para `/track/:orderId`

### Mensagem WhatsApp Atualizada
A mensagem de confirmacao de pedido incluira:
1. Detalhes do pedido (itens, total)
2. Codigo Pix copia-e-cola (se configurado)
3. Link de pagamento online Stripe (cartao de credito/debito)
4. Link de rastreamento do pedido

### QR Code Pix no OrderTracking
- Usa `qrcode.react` (ja instalado) para renderizar QR Code visual
- Exibe codigo copia-e-cola com botao de copiar
- So aparece quando `payment_method = 'pix'` e status e pendente
- Busca `unit_settings` para obter chave Pix e gerar codigo EMV

