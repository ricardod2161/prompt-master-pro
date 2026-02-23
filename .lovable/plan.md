
# Correcao da Galeria do Marketing Studio

## Problema Identificado

A imagem foi gerada e salva corretamente no banco de dados (confirmei que o registro existe e as permissoes RLS estao corretas). O problema e que a galeria nao atualiza apos a geracao porque `invalidateQueries` apenas marca a query como "stale" - ela so refaz a busca quando o componente re-renderiza ou quando a janela ganha foco. Em alguns casos, isso nao acontece imediatamente.

## Correcao

### Arquivo: `src/pages/MarketingStudio.tsx`

1. Trocar `invalidateQueries` por `refetchQueries` com `await` para forcar a atualizacao imediata da galeria apos gerar a imagem
2. Mover o `toast.success` para depois do refetch, garantindo que o usuario veja a imagem na galeria quando a notificacao aparecer

```typescript
// ANTES
queryClient.invalidateQueries({ queryKey: ["marketing-images"] });
toast.success("Imagem gerada com sucesso!");

// DEPOIS
await queryClient.refetchQueries({ queryKey: ["marketing-images", selectedUnit?.id] });
toast.success("Imagem gerada com sucesso!");
```

Essa mudanca garante que a galeria sempre mostre a imagem recem-gerada imediatamente, sem depender de re-renderizacoes ou foco da janela.
