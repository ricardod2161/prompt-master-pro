
# Correção: Número do WhatsApp Enterprise

## Problema Identificado
O número do WhatsApp na linha 132 ainda está com o placeholder `5511999999999`, causando redirecionamento incorreto.

## Solução

### Alteração Única
**Arquivo:** `src/components/subscription/PricingCard.tsx` (linha 132)

**De:**
```typescript
onClick={() => window.open('https://wa.me/5511999999999?text=Olá! Tenho interesse no Plano Enterprise do RestaurantOS', '_blank')}
```

**Para:**
```typescript
onClick={() => window.open('https://wa.me/5598982549505?text=Olá! Tenho interesse no Plano Enterprise do RestaurantOS', '_blank')}
```

---

## Resultado Esperado
Ao clicar em "Falar com Vendas" no plano Enterprise (R$ 200), o usuário será redirecionado diretamente para o WhatsApp com o número correto, pronto para iniciar conversa com a equipe de vendas.
