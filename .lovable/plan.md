
# Plano: Simplificar Contatos e Botão Enterprise

## Mudanças Solicitadas

### 1. Plano Enterprise - Botão "Assinar Agora"
Remover a lógica especial de "Falar com Vendas" e usar o mesmo botão "Assinar Agora" dos outros planos.

**Arquivo**: `src/components/subscription/PricingCard.tsx`

**De (linhas 125-144)**:
```typescript
) : tier === 'enterprise' ? (
  <Button ... onClick={() => { /* lógica de email */ }}>
    <Crown className="h-4 w-4" />
    Falar com Vendas
  </Button>
) : (
```

**Para**:
```typescript
) : (
  // Remove toda a condição especial do enterprise
  // Usa o mesmo botão "Assinar Agora" para todos
```

### 2. Seção de Contato - Exibir Informações Visíveis
Substituir os botões que não funcionam por informações de contato visíveis.

**Arquivo**: `src/pages/Pricing.tsx`

**De (linhas 168-209)**:
```typescript
<div className="flex flex-col sm:flex-row gap-3 justify-center">
  <Button onClick={...}>Falar com Suporte</Button>
  <Button onClick={...}>Enviar Email</Button>
</div>
```

**Para**:
```typescript
<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border">
    <Mail className="h-5 w-5 text-primary" />
    <span className="font-medium">ricardodelima1988@gmail.com</span>
  </div>
  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border">
    <Phone className="h-5 w-5 text-green-500" />
    <span className="font-medium">(98) 98254-9505</span>
  </div>
</div>
```

## Resultado Visual

```text
┌─────────────────────────────────────────────┐
│          Ainda tem dúvidas?                 │
│  Nossa equipe está pronta para ajudar...    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 📧 ricardodelima1988@gmail.com      │    │
│  └─────────────────────────────────────┘    │
│  ┌─────────────────────────────────────┐    │
│  │ 📱 (98) 98254-9505                  │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/subscription/PricingCard.tsx` | Remover condição especial do Enterprise, usar "Assinar Agora" |
| `src/pages/Pricing.tsx` | Trocar botões por texto visível com email e WhatsApp |

## Benefícios
- Clientes podem copiar diretamente o email/telefone
- Funciona em qualquer navegador ou dispositivo
- Sem dependência de links mailto: ou wa.me
- Mais simples e direto
