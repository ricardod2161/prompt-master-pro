
# Correção: Links de Email não Abrem o Gmail

## Problema
Os botões de contato estão usando `window.open('mailto:...', '_blank')` que abre uma nova aba em branco em vez de abrir o cliente de email (Gmail).

## Solução
Trocar `window.open()` por `window.location.href` para os links `mailto:`. Isso faz o navegador abrir o cliente de email padrão corretamente.

## Arquivos a Modificar

### 1. `src/components/subscription/PricingCard.tsx`
**Linha 132** - Botão "Falar com Vendas" do plano Enterprise:
```typescript
// DE:
onClick={() => window.open('Ricardo:ricardodelima1988@gmail.com?subject=...', '_blank')}

// PARA:
onClick={() => window.location.href = 'Ricardo:ricardodelima1988@gmail.com?subject=...'}
```

### 2. `src/pages/Pricing.tsx`
**Linha 180** - Botão "Falar com Suporte":
```typescript
// DE:
onClick={() => window.open('Ricardo:suporte@restaurantos.com.br', '_blank')}

// PARA:
onClick={() => window.location.href = 'Ricardo:suporte@restaurantos.com.br'}
```

**Linha 187** - Botão "WhatsApp" (que na verdade deveria ser Email):
```typescript
// DE:
onClick={() => window.open('Ricardo:ricardodelima1988@gmail.com?subject=...', '_blank')}

// PARA:
onClick={() => window.location.href = 'Ricardo:ricardodelima1988@gmail.com?subject=...'}
```

Também vou trocar o texto do botão de "WhatsApp" para "Email" já que agora é por email.

## Resultado Esperado
Ao clicar nos botões, o Gmail (ou cliente de email padrão) será aberto com o assunto e corpo pré-preenchidos.
