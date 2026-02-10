

# Corrigir historico contaminado que faz bot repetir "sou assistente de texto"

## Problema Real

O fix do prompt foi aplicado e funciona (os logs confirmam `[TTS] Audio response sent successfully`). Porem, o historico da conversa contem **3 mensagens antigas** onde o bot disse "sou assistente de texto" / "nao consigo enviar audio". Quando a IA carrega as ultimas 20 mensagens, ela ve essas respostas e **repete o mesmo padrao**, ignorando as instrucoes do system prompt.

## Solucao (2 partes)

### 1. Limpar mensagens problematicas do banco

Deletar as 3 mensagens do historico que contem o texto problematico, para que a IA nao as veja mais:

```sql
DELETE FROM whatsapp_messages 
WHERE role = 'assistant' 
AND (content LIKE '%assistente de texto%' 
  OR content LIKE '%apenas por texto%' 
  OR content LIKE '%não consigo enviar mensagens de voz%'
  OR content LIKE '%não consigo te enviar mensagens de voz%');
```

### 2. Filtrar mensagens no webhook antes de enviar para a IA

No `whatsapp-webhook/index.ts`, adicionar um filtro no mapeamento do historico para excluir automaticamente mensagens que contenham esses padroes problematicos. Isso previne que mensagens futuras com esse padrao "contaminem" o contexto.

**No trecho que monta `aiMessages` (linha ~1844):**

```typescript
const filteredMessages = (recentMessages || [])
  .reverse()
  .filter((m: any) => {
    if (m.role === 'assistant') {
      const lower = (m.content || '').toLowerCase();
      if (
        lower.includes('assistente de texto') ||
        lower.includes('apenas por texto') ||
        lower.includes('não consigo enviar mensagens de voz') ||
        lower.includes('nao consigo enviar mensagens de voz') ||
        lower.includes('não consigo te enviar') ||
        lower.includes('nao consigo te enviar')
      ) {
        return false;
      }
    }
    return true;
  })
  .map((m: any) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: m.content,
  }));

const aiMessages = [
  { role: "system", content: systemPrompt },
  ...filteredMessages,
];
```

## Resumo das alteracoes

1. **Migracao SQL**: Deletar mensagens problematicas existentes no banco
2. **whatsapp-webhook/index.ts**: Filtrar mensagens com padrao "assistente de texto" antes de enviar ao LLM
3. **Re-deploy** do webhook

Nenhuma alteracao no frontend ou banco de dados (schema).
