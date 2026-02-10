

# Corrigir corte lateral da comanda na impressora termica

## Problema real identificado pela foto

Analisando a impressao com cuidado, o texto **nao esta largo demais** -- o problema e que a **impressora corta o lado esquerdo**. Na foto:

- "MANDA #46" -- falta "CO" no inicio
- "1: 10/02/2026" -- falta "Data"
- "1l: WHATSAPP" -- falta "Cana"
- "ente: Ricardo" -- falta "Cli"
- "ENDERECO" -- falta espaco e asterisco

Isso acontece porque impressoras termicas de 58mm tem uma margem mecanica a esquerda que "engole" os primeiros caracteres.

## Solucao

### Arquivo: `src/hooks/usePrintOrder.ts`

**1. Adicionar prefixo de 2 espacos em TODAS as linhas de texto** para compensar a margem mecanica da impressora:

```text
"  ================\n"      (2 espacos antes)
"  COMANDA #46\n"            (2 espacos antes)
"  Data: 10/02/...\n"       (2 espacos antes)
"  Canal: WHATSAPP\n"       (2 espacos antes)
```

**2. Reduzir divisores de 16 para 14 caracteres** para que, com os 2 espacos de margem, nao ultrapasse a largura:

```text
const divider = "=".repeat(14);
const thinDivider = "-".repeat(14);
```

**3. Adicionar `padding-left: 2mm` no CSS** como margem de seguranca adicional no fallback do navegador.

**4. Manter fontes em 9px/8px** que ja estao em tamanho adequado -- o problema nunca foi a fonte, era a margem.

### Resultado esperado

O texto tera um recuo a esquerda que compensa a area de corte mecanico da impressora, e todas as palavras aparecerao completas no papel.

