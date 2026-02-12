
# Melhorias no Gerador de Prompt com IA

## O Que Ja Existe
O gerador atual tem: 4 secoes (Basica, Operacional, Personalidade, Regras), auto-preenchimento de `unit_settings`, geracao via Gemini 2.5 Flash, edicao manual do prompt e salvamento em `whatsapp_settings`.

## Melhorias Propostas

### 1. Preview em Tempo Real do Prompt (Simulador de Conversa)
Adicionar um botao "Simular Conversa" que envia o prompt gerado para a IA e simula uma interacao de teste (como se fosse um cliente pedindo algo). Isso permite ao usuario ver como o bot vai se comportar ANTES de ativar.

- Botao "Testar Prompt" ao lado do "Gerar Prompt com IA"
- Abre um mini-chat simulado (tipo WhatsApp) onde o usuario pode enviar mensagens de teste
- Usa o prompt gerado como system prompt para responder
- Implementado via edge function `test-bot-chat`

### 2. Historico de Prompts Gerados
Salvar versoes anteriores do prompt para permitir comparacao e rollback.

- Tabela `prompt_history` no banco: `id`, `unit_id`, `prompt_text`, `form_data` (JSON), `created_at`
- Botao "Historico" que abre um Sheet com a lista de prompts anteriores
- Cada item mostra: data, primeiras linhas do prompt, botao "Restaurar"
- Maximo de 10 versoes guardadas por unidade

### 3. Barra de Qualidade do Prompt
Indicador visual que avalia a completude do prompt gerado em tempo real:

- Verificar se contem: saudacao, fluxo de atendimento, formas de pagamento, regras de formatacao, limites, escalacao humana
- Barra de progresso colorida (vermelho -> amarelo -> verde)
- Checklist visual mostrando quais secoes estao presentes e quais faltam
- Calculado no frontend via regex simples no texto do prompt

### 4. Templates Prontos por Tipo de Negocio
Oferecer templates pre-configurados baseados no tipo de negocio selecionado.

- Botao "Usar Template" que aparece quando o tipo de negocio e selecionado
- Templates para: Pizzaria, Hamburgueria, Cafeteria, Padaria, Acaiteria, etc.
- Pre-preenche `businessDescription`, `specialRules`, `voiceTone` e `botName` com valores tipicos
- Usuario pode editar apos aplicar o template

### 5. Copiar Prompt com Um Clique
Botao de copiar ao lado do campo de prompt gerado (atualmente so tem "Salvar").

### 6. Contagem de Tokens Estimada
Exibir estimativa de tokens do prompt (caracteres / 4) para o usuario ter nocao do tamanho.

### 7. Secao de Cardapio Resumido (Nova Secao)
Nova secao colapsavel "Cardapio" que carrega automaticamente os produtos do banco e permite o usuario selecionar quais incluir como contexto no prompt.

- Busca produtos da unidade via `useProducts()`
- Lista com checkboxes para selecionar categorias/produtos
- Gera um resumo do cardapio que e enviado junto ao prompt para a IA
- O bot tera conhecimento dos produtos reais disponíveis

## Arquivos a Serem Criados/Modificados

| Arquivo | Alteracao |
|---|---|
| `supabase/functions/test-bot-chat/index.ts` | Nova edge function para simular conversa com o prompt |
| `src/components/settings/AIPromptGenerator.tsx` | Adicionar simulador, historico, barra de qualidade, templates, copiar, tokens |
| `src/components/settings/ai-prompt/PromptQualityBar.tsx` | Novo componente de barra de qualidade |
| `src/components/settings/ai-prompt/BotSimulator.tsx` | Novo componente de mini-chat simulado |
| `src/components/settings/ai-prompt/PromptHistory.tsx` | Novo componente de historico de prompts |
| `src/components/settings/ai-prompt/MenuContextSection.tsx` | Nova secao de cardapio resumido |
| `src/components/settings/ai-prompt/BusinessTemplates.tsx` | Templates prontos por tipo de negocio |
| Migracao SQL | Tabela `prompt_history` |

## Detalhes Tecnicos

### Simulador de Conversa (BotSimulator)
- Usa streaming via `test-bot-chat` edge function
- Envia o `system_prompt` atual + mensagens do usuario
- Interface tipo WhatsApp (bolhas de chat, verde/cinza)
- Botao "Limpar conversa" para resetar
- Maximo 10 mensagens de teste por sessao

### Barra de Qualidade
Verifica presenca no prompt via regex:
- Saudacao/boas-vindas
- Fluxo de atendimento (etapas numeradas)
- Formas de pagamento
- Regras de formatacao WhatsApp
- Limites e proibicoes
- Escalacao humana
- Tool calling / funcoes

Cada item encontrado = +1 ponto. Score de 0-7 mapeado para cores.

### Templates de Negocio
Dados estaticos no frontend com valores tipicos:
```text
Pizzaria -> botName: "PizzaBot", voiceTone: "descontraido",
            specialRules: "Pedido minimo R$30 para delivery..."
Hamburgueria -> botName: "BurgerBot", voiceTone: "divertido"...
```

### Historico de Prompts (Tabela)
```text
prompt_history
  - id (uuid, PK)
  - unit_id (uuid, FK -> units)
  - prompt_text (text)
  - form_data (jsonb)
  - created_at (timestamptz)
```
RLS: usuarios autenticados podem ler/inserir da propria unidade.

### Secao de Cardapio
- Carrega produtos e categorias existentes
- Gera resumo tipo: "Categorias: Lanches (5 itens), Bebidas (8 itens)..."
- Envia como campo adicional `menuSummary` para a edge function
- O META_PROMPT da edge function sera atualizado para considerar o resumo do cardapio
