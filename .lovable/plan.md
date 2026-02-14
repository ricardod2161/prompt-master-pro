

## Corrigir erro de RLS ao salvar prompt

### Problema
O botao "Salvar Prompt" no gerador de prompt tenta fazer um `upsert` diretamente na tabela `whatsapp_settings`. Quando a linha ainda nao existe, o Supabase tenta um INSERT, que exige permissao de admin/manager. Se o usuario ja tem configuracoes salvas, o `upsert` deveria fazer UPDATE, mas a falta de constraint unica ou permissoes causa o erro de RLS.

### Solucao

**Arquivo:** `src/components/settings/AIPromptGenerator.tsx`

Modificar o `handleSave` (linhas 152-178) para:

1. Primeiro tentar buscar se ja existe uma linha em `whatsapp_settings` para o `unit_id`
2. Se existir, fazer `UPDATE` usando o `id` da linha existente
3. Se nao existir, fazer `INSERT` com o `unit_id`

Isso evita o `upsert` que pode falhar por falta de constraint unica na coluna `unit_id`, e garante que a operacao correta (INSERT ou UPDATE) seja usada.

### Detalhes Tecnicos

Substituir no `handleSave`:

```typescript
// Antes (problemático):
const { error } = await supabase
  .from("whatsapp_settings")
  .upsert({ unit_id: unitId, system_prompt: prompt.trim() }, { onConflict: "unit_id" });

// Depois (corrigido):
// Verificar se já existe configuração
const { data: existing } = await supabase
  .from("whatsapp_settings")
  .select("id")
  .eq("unit_id", unitId)
  .maybeSingle();

let error;
if (existing?.id) {
  // UPDATE na linha existente
  ({ error } = await supabase
    .from("whatsapp_settings")
    .update({ system_prompt: prompt.trim() })
    .eq("id", existing.id));
} else {
  // INSERT nova linha
  ({ error } = await supabase
    .from("whatsapp_settings")
    .insert({ unit_id: unitId, system_prompt: prompt.trim() }));
}
```

### Resultado esperado
- "Salvar Prompt" funciona sem erro de RLS
- Se a linha ja existe, faz UPDATE (sem conflito)
- Se nao existe, faz INSERT normalmente
- Historico de prompts continua sendo salvo apos o sucesso
