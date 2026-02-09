
# Adicionar Gerador de Prompt com IA na aba Bot do WhatsApp Settings

## Problema

A pagina de configuracoes do WhatsApp (aba Bot) ainda usa um gerador inline antigo, onde o nome do restaurante aparece desabilitado e nao e editavel. O componente compartilhado `AIPromptGenerator` (que ja existe e funciona nas Configuracoes) nao esta sendo usado aqui.

## Solucao

Substituir o bloco inline do gerador de prompt (linhas 642-703) pelo componente `AIPromptGenerator`, conectando-o ao estado `systemPrompt` da pagina para que o fluxo de salvar configuracoes do bot continue funcionando.

## O que muda

### `src/pages/WhatsAppSettings.tsx`

1. Importar o componente `AIPromptGenerator`
2. Remover o bloco inline do gerador (bordas dashed, input desabilitado do nome, input de descricao, botao gerar)
3. Remover o textarea separado do "Prompt do Sistema (IA)"
4. Adicionar o `AIPromptGenerator` no lugar, passando:
   - `unitName={selectedUnit.name}`
   - `unitId={selectedUnit.id}`
   - `externalPrompt={systemPrompt}` para manter sincronizado com o estado local
   - `onPromptChange={setSystemPrompt}` para atualizar o estado quando o prompt for editado/gerado
5. Manter o botao "Salvar Configuracoes do Bot" existente (que salva welcome message + bot enabled + system prompt junto)

### Resultado

- Nome do restaurante editavel no gerador
- Mesmo componente visual nas Configuracoes e no WhatsApp Settings
- O prompt gerado sincroniza com o estado da pagina para salvar junto com as demais configs do bot
