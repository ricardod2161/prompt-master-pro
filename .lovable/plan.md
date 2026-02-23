

# Correcao: Marketing nao aparece no sidebar

## Diagnostico

Analisei todo o codigo e identifiquei que:

1. **O item Marketing EXISTE no codigo do sidebar** (linha 110 do `AppSidebar.tsx`) - esta no grupo "Analises" entre "Relatorios" e "Configuracoes"
2. **A rota existe** no `App.tsx` (linha 98)
3. **O titulo existe** no `AppLayout.tsx` (linha 33)

### Causa Raiz

O problema e um **conflito de espaco vertical no sidebar**. O footer do sidebar e muito grande (SubscriptionBadge + Super Admin + Planos + Trocar Unidade), e em telas menores, o item Marketing fica escondido na area de scroll sem indicacao visual clara de que ha mais itens. O usuario simplesmente nao ve que precisa rolar.

## Solucao

Vou aplicar duas correcoes:

### 1. Mover "Configuracoes" para o footer do sidebar

Configuracoes nao precisa estar no grupo "Analises" - faz mais sentido no footer junto com "Planos" e "Trocar Unidade". Isso libera espaco no grupo e deixa Marketing mais visivel.

### 2. Reorganizar o grupo "Analises"

Renomear para separar melhor. Marketing ficara mais proeminente:

**Antes:**
```
ANALISES
  Relatorios
  Marketing        <-- escondido pelo scroll
  Configuracoes
```

**Depois:**
```
ANALISES
  Relatorios
  Marketing

FOOTER (fixo, sempre visivel):
  Configuracoes    <-- movido para ca
  Planos
  Trocar Unidade
```

### 3. Garantir rebuild limpo

Fazer uma pequena alteracao no componente para forcar o rebuild e invalidar qualquer cache.

## Arquivos modificados

| Arquivo | Acao |
|---------|------|
| `src/components/layout/AppSidebar.tsx` | Mover Configuracoes do grupo Analises para o footer; manter Marketing no grupo |

## Resultado esperado

- Marketing ficara visivel no grupo "Analises" sem necessidade de scroll
- Configuracoes ficara no footer junto com os outros links fixos
- O sidebar ficara mais organizado e intuitivo

