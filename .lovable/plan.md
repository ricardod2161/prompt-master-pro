
# Plano: Corrigir Bot e Redesenhar Página WhatsApp

## Problemas Identificados

### 1. Bot Retornando JSON Bruto
O segundo screenshot mostra que o bot está respondendo com JSON técnico ao invés de texto natural:
```json
{
  "action": "buscar_produto",
  "action_input": "{\"nome\":\"Suco Natural Laranja\"}"
}
```
**Causa:** O modelo Gemini às vezes retorna formato ReAct/LangChain (action/action_input) no `content` ao invés de usar `tool_calls` corretamente.

### 2. Página de Configurações Básica
A interface atual é funcional mas precisa de um visual mais profissional e moderno.

---

## Solução Parte 1: Correção do Bot

### Arquivo: `supabase/functions/whatsapp-webhook/index.ts`

**Mudanças:**
1. **Detectar e tratar JSON no content** - Quando o modelo retornar JSON no formato action/action_input, extrair e executar a tool manualmente
2. **Melhorar o system prompt** - Instruções mais claras para evitar respostas em JSON
3. **Sanitização de resposta** - Remover qualquer JSON residual antes de enviar ao cliente
4. **Logging aprimorado** - Para debug futuro

```text
FLUXO CORRIGIDO:
┌─────────────────────────────────────────────────────────────┐
│  IA responde com tool_calls?                                │
│    SIM → Executar tools normalmente                         │
│    NÃO → Verificar se content contém JSON de action         │
│           SIM → Extrair, executar tool, pedir nova resposta │
│           NÃO → Retornar content como resposta final        │
└─────────────────────────────────────────────────────────────┘
```

---

## Solução Parte 2: Redesign da Página WhatsApp

### Arquivo: `src/pages/WhatsAppSettings.tsx`

**Melhorias Visuais:**
1. **Header redesenhado** - Com gradiente verde característico do WhatsApp
2. **Cards modernos** - Com bordas sutis, sombras e ícones coloridos
3. **Status de conexão visual** - Badge animado com indicador de conexão
4. **URL do Webhook** - Campo de fácil cópia para configurar na Evolution API
5. **Grid responsivo** - Adapta de 3 colunas para 1 em mobile
6. **Tabela de conversas melhorada** - Com avatares, status e ações
7. **Estados vazios mais amigáveis** - Com ilustrações e CTAs claros

**Layout Proposto:**

```text
┌────────────────────────────────────────────────────────────────┐
│ ┌──────────────────────────────────────────────────────────┐   │
│ │     🟢 WhatsApp Business                    [Conectado]  │   │
│ │     Atendimento automatizado com IA                      │   │
│ └──────────────────────────────────────────────────────────┘   │
│                                                                │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│ │ 156      │  │ 12       │  │ 45s      │                      │
│ │ Mensagens│  │ Conversas│  │ Tempo Med│                      │
│ └──────────┘  └──────────┘  └──────────┘                      │
│                                                                │
│ [API] [Bot] [Conversas] [Webhook]                             │
│                                                                │
│ ┌─────────────────────────────────────────────────────────┐   │
│ │  Configuração da API                                     │   │
│ │  ─────────────────────────────────────────               │   │
│ │  URL da API: [________________________]                  │   │
│ │  Instância:  [________________________]                  │   │
│ │  Token:      [••••••••••••••••••••••••]                  │   │
│ │                                                          │   │
│ │  📋 URL do Webhook (copiar):                             │   │
│ │  https://xxx.supabase.co/functions/v1/whatsapp-webhook  │   │
│ │                                                          │   │
│ │  [Testar Conexão]  [Salvar]                             │   │
│ └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

---

## Detalhes Técnicos

### Nova Função: `parseActionFromContent`
```typescript
// Detecta JSON de action no content e extrai
function parseActionFromContent(content: string): { action: string; input: any } | null {
  try {
    const match = content.match(/\{[\s\S]*"action"[\s\S]*"action_input"[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return { action: parsed.action, input: JSON.parse(parsed.action_input) };
    }
  } catch {}
  return null;
}
```

### System Prompt Otimizado
- Instrução explícita para NUNCA retornar JSON
- Exemplos de respostas corretas
- Limitação de caracteres para evitar respostas muito longas

### Componentes Novos para UI
- `WebhookUrlDisplay` - Campo com botão de copiar
- `ConnectionStatusBadge` - Badge animado com ping
- `StatsCards` - Cards com métricas rápidas
- Melhor responsividade com Tailwind breakpoints

---

## Arquivos Modificados

| Arquivo | Tipo de Mudança |
|---------|-----------------|
| `supabase/functions/whatsapp-webhook/index.ts` | Correção do function calling |
| `src/pages/WhatsAppSettings.tsx` | Redesign completo da UI |

---

## Resultado Esperado

**Bot:**
- Nunca mais retornar JSON técnico ao cliente
- Respostas sempre em linguagem natural e amigável
- Processamento robusto de tool calls

**Interface:**
- Visual profissional e moderno
- Responsivo em todos os dispositivos
- Fácil configuração com URL do webhook visível
- Melhor experiência do usuário
