
## Bug: `ReferenceError: normalizeProductName is not defined`

### Root Cause (confirmed via logs)
```
ERROR AI processing error: ReferenceError: normalizeProductName is not defined
  at confirmarPedido (index.ts:830:32)
```

The function `normalizeProductName` is called **42 times** in the file but its definition was accidentally deleted during a previous edit. Every call to `confirmarPedido`, `findBestProductMatch`, and `buscarProduto` crashes with this error — which is why the client gets the generic "Desculpe, tive um problema" message.

### Fix

**Single file:** `supabase/functions/whatsapp-webhook/index.ts`

**Action:** Insert the `normalizeProductName` function definition at line 627 (right before `findBestProductMatch` which uses it):

```typescript
function normalizeProductName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[-_]/g, ' ')           // hyphens/underscores → space
    .replace(/\s+/g, ' ')            // collapse whitespace
    .trim();
}
```

This is the standard normalization pattern already used by `getProductKeyword` (lines 619-622) — it lowercases, strips accents, normalizes spaces. Restoring it unblocks `confirmarPedido`, `findBestProductMatch`, `buscarProduto`, and `calcularTotal` simultaneously.

Then deploy the function immediately.
