
## Correcao: Prompt do Sistema nao carrega na pagina de Configuracoes

### Problema
Na pagina `/settings`, o componente `AIPromptGenerator` e renderizado sem as props `externalPrompt` e `onPromptChange`. Isso significa que ele usa o estado interno `generatedPrompt`, que inicia vazio (`""`). O componente nunca busca o prompt ja salvo no banco de dados (`whatsapp_settings`), entao mesmo que exista um prompt salvo (como o de 8575 caracteres da Churrascaria Santo Antonio), ele nao aparece.

Na pagina `/whatsapp-settings`, funciona porque o pai carrega o prompt e passa via `externalPrompt`.

### Solucao
Adicionar um `useEffect` no `AIPromptGenerator` que busca o prompt existente da tabela `whatsapp_settings` quando nenhum `externalPrompt` e fornecido.

### Detalhes Tecnicos

**Arquivo: `src/components/settings/AIPromptGenerator.tsx`**

Adicionar um efeito que roda ao montar o componente:

```typescript
// Buscar prompt existente quando nao ha externalPrompt
useEffect(() => {
  if (externalPrompt !== undefined) return; // controlado externamente
  
  const fetchExistingPrompt = async () => {
    const { data } = await supabase
      .from("whatsapp_settings")
      .select("system_prompt")
      .eq("unit_id", unitId)
      .maybeSingle();
    
    if (data?.system_prompt) {
      setGeneratedPrompt(data.system_prompt);
    }
  };
  
  fetchExistingPrompt();
}, [unitId, externalPrompt]);
```

Isso garante que:
- Quando usado em `/settings` (sem `externalPrompt`): carrega o prompt salvo do banco
- Quando usado em `/whatsapp-settings` (com `externalPrompt`): continua funcionando como antes, controlado pelo pai
