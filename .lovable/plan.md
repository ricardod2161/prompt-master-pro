

# Corrigir tamanho da fonte e texto cortado na impressao

## Problemas identificados

1. **Fonte muito pequena**: O CSS atual usa `font-size: 14px` na tela e reduz para `12px` na impressao -- muito pequeno para leitura rapida na cozinha.
2. **Texto cortado nas laterais**: As linhas com 32 caracteres de divisor (`=` e `-`) podem ultrapassar a largura do papel, cortando o conteudo. O `max-width: 280px` tambem limita demais.
3. **Sem `word-wrap`**: Textos longos (enderecos, nomes de produtos) nao quebram linha e sao cortados.

## Solucao

### Arquivo: `src/hooks/usePrintOrder.ts`

**1. Reduzir largura dos divisores** de 32 para 28 caracteres para caber melhor no papel termico de 58mm:

```text
const divider = "=".repeat(28);
const thinDivider = "-".repeat(28);
```

**2. Aumentar fonte e corrigir CSS do fallback do navegador**:

- Fonte na tela: `14px` para `16px`
- Fonte na impressao: `12px` para `14px`
- Adicionar `word-wrap: break-word` no `pre` para evitar corte
- Remover `max-width` restritivo e usar `width: 100%`
- Adicionar `white-space: pre-wrap` para permitir quebra de linha automatica
- Adicionar margens de pagina zeradas no `@media print`

**3. CSS atualizado**:

```css
body {
  font-family: 'Courier New', monospace;
  font-size: 16px;
  line-height: 1.5;
  padding: 8px;
  margin: 0 auto;
  width: 100%;
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
  @page { margin: 2mm; }
  body {
    padding: 0;
    font-size: 14px;
  }
}
```

Essas mudancas garantem que o texto fique maior, legivel e nunca seja cortado, independentemente do tamanho do papel termico (58mm ou 80mm).

