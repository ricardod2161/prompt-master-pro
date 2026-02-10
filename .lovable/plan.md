

# Aumentar margem e fonte da comanda

## Problema
Mesmo com 2 espacos de recuo, o texto ainda esta sendo cortado na esquerda. Alem disso, a fonte ficou pequena demais apos as reducoes anteriores.

## Solucao

### Arquivo: `src/hooks/usePrintOrder.ts`

**1. Aumentar prefixo de 2 para 3 espacos**:
```text
const P = "   "; // 3 espacos
```

**2. Reduzir divisores de 14 para 12 caracteres** para compensar o espaco extra e nao ultrapassar a largura:
```text
const divider = P + "=".repeat(12);
const thinDivider = P + "-".repeat(12);
```

**3. Aumentar fontes**:
- Preview: `9px` para `12px`
- Impressao: `8px` para `11px`
- Line-height: `1.2` para `1.3`

**4. Aumentar padding-left no CSS** de `2mm` para `3mm`.

### Resultado esperado
Texto mais afastado da borda esquerda (sem corte) e letras maiores e mais legiveis.

