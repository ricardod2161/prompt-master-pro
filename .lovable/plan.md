

# Reduzir mais o tamanho da impressao

## Problema

Mesmo apos os ajustes anteriores, o texto ainda esta um pouco grande para o papel termico de 58mm.

## Solucao

### Arquivo: `src/hooks/usePrintOrder.ts`

**1. Reduzir divisores de 24 para 20 caracteres**:

```text
const divider = "=".repeat(20);
const thinDivider = "-".repeat(20);
```

**2. Ajustar centralizacao dos titulos** para acompanhar a largura menor.

**3. Reduzir fontes no CSS**:

- Fonte na tela: `13px` para `11px`
- Fonte na impressao: `12px` para `10px`
- Reduzir padding de `4px` para `2px`
- Manter `max-width: 48mm` e todas as regras de quebra de linha

Resultado: texto mais compacto, sem corte, mantendo a legibilidade.

