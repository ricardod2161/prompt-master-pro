

## Revisao e Melhoria do Prompt do Sistema WhatsApp

### Problemas Identificados no Prompt Atual

**1. Conflito de formatacao com regras injetadas**
O prompt salvo usa listas numeradas no fluxo (1. 2. 3. ...), mas as regras injetadas automaticamente (formattingRules) proibem listas numeradas. Isso gera conflito e confunde a IA.

**2. Exposicao de dados internos**
O prompt expoe o `user_id` real do sistema (`99f8d442-a32b-4b88-be56-d618d360dbe2`) diretamente no texto. Isso e desnecessario porque a tool `func_anotar_pedido` ja recebe o user_id automaticamente pelo backend.

**3. Chave Pix hardcoded como CPF**
A chave Pix esta escrita diretamente no prompt (`38734543864`). Se mudar nas configuracoes da unidade, o prompt fica desatualizado. O ideal e instruir o bot a buscar da configuracao.

**4. Instrucoes redundantes e contraditórias**
- O prompt diz "1. Entrega | 2. Retirada | 3. Comer no Local" (formato proibido pelas regras injetadas)
- Usa "**negrito**" com dois asteriscos (Markdown) ao inves de "*negrito*" com um asterisco (WhatsApp)
- Menciona "use a ferramenta Calculator" que nao existe no sistema atual

**5. Falta de variacao e humanizacao**
O prompt nao instrui sobre variacoes de linguagem nem empatia, tornando o bot repetitivo.

**6. Regra de "apenas 1x por conversa" para cardapio**
Limitar listar_cardapio a 1x por conversa e ruim. O cliente pode querer ver novamente.

**7. Falta de instrucao sobre horario de funcionamento**
Nao ha instrucao clara para o bot informar quando o restaurante esta fechado.

---

### Mudancas Propostas

#### 1. Melhorar o META_PROMPT (generate-prompt edge function)

**Arquivo:** `supabase/functions/generate-prompt/index.ts`

Ajustes no META_PROMPT:
- Remover referencia a "Calculator" (ferramenta inexistente) na secao 5
- Adicionar instrucao para NUNCA usar formatacao Markdown (`**negrito**`), sempre usar `*negrito*` do WhatsApp
- Reforcar que o fluxo de atendimento NAO deve usar listas numeradas (1. 2. 3.)
- Adicionar secao de VARIACOES DE LINGUAGEM obrigatoria (confirmacoes, transicoes, empatia)
- Adicionar instrucao para NUNCA expor IDs internos, chaves de API ou dados tecnicos no prompt
- Adicionar instrucao sobre tratamento de horario de funcionamento
- Remover limite de "1x por conversa" para cardapio
- Adicionar instrucao sobre o tratamento humanizado de mensagens de audio transcritas

#### 2. Atualizar o prompt padrao (getDefaultSystemPrompt)

**Arquivo:** `supabase/functions/whatsapp-webhook/index.ts`

Pequenos ajustes no prompt padrao:
- Trocar `**negrito**` por `*negrito*` onde ainda existir
- Garantir que o fluxo de etapas use emojis como bullets em vez de numeros

#### 3. Melhorar as regras injetadas (formattingRules)

**Arquivo:** `supabase/functions/whatsapp-webhook/index.ts`

Adicionar nas formattingRules:
- Regra contra usar `**negrito**` (Markdown) — instruir a usar `*negrito*` (WhatsApp)
- Regra para nunca revelar que e uma IA ou que esta seguindo um roteiro
- Regra para variar expressoes e nao repetir a mesma frase duas vezes seguidas

#### 4. Gerar novo prompt para o restaurante

Apos as melhorias no META_PROMPT, o usuario podera clicar em "Gerar Prompt com IA" novamente para obter um prompt atualizado, corrigido e mais humano.

---

### Detalhes Tecnicos

**Arquivo 1: `supabase/functions/generate-prompt/index.ts`**

Alteracoes no META_PROMPT (linhas 8-102):
- Secao 2 (Fluxo): Substituir lista numerada por descricao com emojis e reforcar "uma pergunta por vez"
- Secao 3 (Formatacao): Adicionar proibicao de `**texto**` e instrucao para usar `*texto*`
- Secao 5 (Tool Calling): Remover referencia a "Calculator", manter apenas func_anotar_pedido, listar_cardapio e buscar_produto
- Nova secao: Variacoes de linguagem (confirmar, transicionar, empatizar)
- Nova regra: NUNCA expor user_id, chaves, dados internos
- Regra de cardapio: Remover limite de "1x por conversa"

**Arquivo 2: `supabase/functions/whatsapp-webhook/index.ts`**

Alteracoes nas formattingRules (linhas 1956-1995):
- Adicionar regra contra formatacao Markdown (dois asteriscos)
- Adicionar regra de variacao de linguagem obrigatoria
- Adicionar regra para nunca revelar ser IA quando nao perguntado

Alteracoes no getDefaultSystemPrompt (linhas 2190-2402):
- Corrigir usos de `**negrito**` para `*negrito*`
- Manter consistencia com as regras injetadas

### Resultado Esperado

- Prompt gerado sem listas numeradas, com emojis como bullets
- Sem exposicao de dados internos (user_id, chaves)
- Tom mais humano com variacoes de linguagem obrigatorias
- Formatacao consistente com WhatsApp (`*negrito*`, nao `**negrito**`)
- Sem referencia a ferramentas inexistentes (Calculator)
- Bot mais inteligente ao lidar com audio, horario e escalacao

