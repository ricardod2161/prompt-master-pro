

# Correção: Botão "Falar com Vendas" do Enterprise

## Problema

O botão atualmente usa `window.open('mailto:...')` que resulta em página em branco para usuários sem cliente de email configurado.

## Solução Proposta

Substituir o `mailto:` por um link do **WhatsApp**, que é mais acessível e comum no Brasil.

## Alteração

**Arquivo:** `src/components/subscription/PricingCard.tsx`

**De:**
```typescript
onClick={() => window.open('mailto:contato@restaurantos.com.br?subject=Interesse no Plano Enterprise', '_blank')}
```

**Para:**
```typescript
onClick={() => window.open('https://wa.me/5511999999999?text=Olá! Tenho interesse no Plano Enterprise do RestaurantOS', '_blank')}
```

---

## Pergunta

Qual número de WhatsApp você quer usar para o contato de vendas? Me passe o número com DDD (ex: 11999999999) para eu implementar.

