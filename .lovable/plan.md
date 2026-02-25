
## Diagnóstico do Problema

Nos prints enviados:
1. Cliente: "Oi bom dia já está aberto" → Bot corretamente informa que está FECHADO e pergunta se quer deixar pedido anotado ✅
2. Cliente: "Sim" → Bot deveria mostrar o cardápio e seguir o fluxo completo, MAS em vez disso:
   - Perguntou o endereço **sem perguntar o nome, sem mostrar cardápio, sem coletar os itens**
   - Confirmou o pedido **sem itens e sem forma de pagamento**

## Causa Raiz

Na linha 2262 do webhook, a instrução diz:
```
- Se o cliente quiser fazer pedido com o restaurante fechado, aceite normalmente após informar
```

O LLM está interpretando "aceite normalmente" de forma incorreta — ele aceita o "Sim" do cliente e pula direto para etapas avançadas do fluxo (endereço/confirmação) sem passar pelas etapas obrigatórias: **cardápio → itens → modalidade → pagamento**.

## Correção

Vou substituir a instrução vaga por uma instrução explícita e detalhada:

```
- Se o cliente quiser fazer pedido com o restaurante fechado e responder "Sim" (ou equivalente):
  → OBRIGATÓRIO: Reinicie o fluxo completo do pedido a partir da ETAPA 2 (cardápio)
  → NÃO pule etapas! Siga: ETAPA 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10
  → Diga algo como: "Ótimo! Vou anotar seu pedido para quando abrirmos. Posso te mostrar nosso cardápio?"
  → Use listar_cardapio para mostrar as opções ao cliente
  → Só confirme o pedido após coletar: itens + modalidade + endereço (se entrega) + forma de pagamento
```

## Arquivo Modificado

| Arquivo | Linha | Ação |
|---------|-------|------|
| `supabase/functions/whatsapp-webhook/index.ts` | ~2262 | Corrigir instrução de "loja fechada + aceitar pedido" para redirecionar explicitamente ao fluxo completo |
