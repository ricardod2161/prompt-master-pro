

# Reduzir fonte e largura da comanda ainda mais

## Problema

Mesmo com divisores de 20 caracteres e fonte 11px/10px, o texto ainda esta sendo cortado na impressora termica de 58mm.

## Solucao

### Arquivo: `src/hooks/usePrintOrder.ts`

**1. Reduzir fontes**:

- Fonte na tela: `11px` para `9px`
- Fonte na impressao: `10px` para `8px`
- Line-height: `1.3` para `1.2`

**2. Reduzir divisores de 20 para 16 caracteres** para garantir que nao ultrapassem a largura:

```text
const divider = "=".repeat(16);
const thinDivider = "-".repeat(16);
```

**3. Ajustar centralizacao dos titulos** para a largura menor.

**4. Reduzir max-width de 48mm para 44mm** para dar mais margem de seguranca contra corte.

Resultado: comanda mais compacta que cabe sem corte no papel de 58mm.

