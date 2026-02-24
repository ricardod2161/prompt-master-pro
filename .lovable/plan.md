

# Correcao: Cards do Cardapio muito grandes + Build errors

## Problema 1 - Cards muito grandes

Na pagina `/menu`, os cards de produtos estao ocupando muito espaco vertical. A imagem usa `AspectRatio 16/10` que cria uma area muito alta, e o grid so mostra 2 colunas no desktop medio (`lg:grid-cols-3`).

## Problema 2 - Build errors

Dois edge functions tem `error.message` em variavel `error` do tipo `unknown`, causando erro de TypeScript.

---

## Correcoes

### 1. Reduzir tamanho dos cards (ProductCard.tsx)

- Mudar `AspectRatio` de `16/10` para `16/9` (mais compacto)
- Reduzir padding interno de `p-4` para `p-3`
- Reduzir espacamento de `space-y-3` para `space-y-2`
- Reduzir tamanho do preco de `text-lg` para `text-base`

### 2. Aumentar colunas no grid (Menu.tsx)

Mudar o grid de produtos de:
```
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
```
Para:
```
grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5
```

Isso mostra mais produtos por linha e reduz o tamanho individual de cada card.

### 3. Corrigir build errors nos edge functions

- `elevenlabs-tts-preview/index.ts` linha 72: trocar `error.message` por `(error as Error).message`
- `send-whatsapp-message/index.ts` linha 167: trocar `error.message` por `(error as Error).message`

## Arquivos modificados

| Arquivo | Acao |
|---------|------|
| `src/components/menu/ProductCard.tsx` | Reduzir AspectRatio, padding e espacamentos |
| `src/pages/Menu.tsx` | Aumentar colunas do grid |
| `supabase/functions/elevenlabs-tts-preview/index.ts` | Fix tipo `unknown` do error |
| `supabase/functions/send-whatsapp-message/index.ts` | Fix tipo `unknown` do error |
