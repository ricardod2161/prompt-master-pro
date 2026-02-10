

# Ajustar impressao: fonte equilibrada e sem corte

## Problema atual

A fonte de 16px na tela e 14px na impressao ficou grande demais para papel termico de 58mm, fazendo o texto ultrapassar a largura do papel e ser cortado. Os divisores de 28 caracteres com fonte grande tambem excedem a area imprimivel.

## Solucao

### Arquivo: `src/hooks/usePrintOrder.ts`

**1. Reduzir divisores para 24 caracteres** -- tamanho seguro para 58mm com fonte legivel:

```text
const divider = "=".repeat(24);
const thinDivider = "-".repeat(24);
```

**2. Centralizar titulos com menos espacos** para acompanhar a largura menor dos divisores.

**3. Ajustar CSS para tamanho equilibrado**:

- Fonte na tela: `16px` para `13px` -- tamanho ideal para preview sem corte
- Fonte na impressao: `14px` para `12px` -- legivel em papel termico sem ultrapassar a largura
- Largura maxima: `width: 100%` para `max-width: 48mm` -- respeita a area util do papel de 58mm (descontando margens mecanicas)
- Manter `pre-wrap` e `word-wrap` para textos longos quebrarem linha

```css
body {
  font-family: 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.4;
  padding: 4px;
  margin: 0 auto;
  max-width: 48mm;
  box-sizing: border-box;
}
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  margin: 0;
  font-size: inherit;
}
@media print {
  @page { margin: 1mm; }
  body {
    padding: 0;
    font-size: 12px;
    max-width: 100%;
  }
}
```

Essas mudancas equilibram legibilidade com o espaco disponivel no papel termico, garantindo que nenhum texto seja cortado e a comanda fique com aparencia profissional.

