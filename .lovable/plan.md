
# Plano: Implementar Bot WhatsApp Profissional com Function Calling

## Problema Identificado

O bot está respondendo "Desculpe, não consegui processar sua mensagem" porque:

1. **O system_prompt configurado menciona ferramentas** como "Listar Cardápio", "Calculator", "func_anotar_pedido"
2. **Essas ferramentas NÃO estão implementadas** no código atual
3. A API de IA é chamada **sem nenhuma tool configurada**
4. Quando o cliente pede o cardápio, a IA não consegue executar a ação e retorna resposta vazia/inválida

## Solução Proposta

Implementar **function calling** real com ferramentas que buscam dados do banco de dados, permitindo que o bot:
- Liste o cardápio completo do restaurante
- Busque produtos específicos
- Calcule valores de pedidos
- Crie pedidos no sistema

## Arquivos a Serem Modificados

### 1. Refatorar Edge Function `whatsapp-webhook`
**Arquivo:** `supabase/functions/whatsapp-webhook/index.ts`

Mudanças:
- Adicionar definição de tools para function calling
- Implementar lógica para executar cada tool quando chamada pela IA
- Adicionar loop de conversação para processar múltiplas chamadas de ferramentas
- Melhorar logging para debug
- Tratamento de erros profissional com mensagens amigáveis

### Tools a Implementar

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUXO DE FUNCTION CALLING                        │
├─────────────────────────────────────────────────────────────────────┤
│  Cliente: "Quero ver o cardápio"                                    │
│     ↓                                                               │
│  IA detecta intenção → Chama tool "listar_cardapio"                 │
│     ↓                                                               │
│  Edge Function executa query no banco (products + categories)       │
│     ↓                                                               │
│  Retorna dados formatados para a IA                                 │
│     ↓                                                               │
│  IA gera resposta profissional com cardápio                         │
│     ↓                                                               │
│  Envia resposta ao cliente via WhatsApp                             │
└─────────────────────────────────────────────────────────────────────┘
```

#### Tool 1: `listar_cardapio`
- Busca todos os produtos disponíveis da unidade
- Agrupa por categoria
- Retorna nome, preço e descrição

#### Tool 2: `buscar_produto`
- Busca produto específico por nome
- Retorna detalhes e preço

#### Tool 3: `calcular_total`
- Recebe lista de itens e quantidades
- Calcula valor total do pedido

#### Tool 4: `criar_pedido`
- Cria pedido no sistema
- Registra itens, cliente, endereço e pagamento
- Retorna número do pedido

## Detalhes Técnicos

### Estrutura do Function Calling (OpenAI-compatible)

```typescript
const tools = [
  {
    type: "function",
    function: {
      name: "listar_cardapio",
      description: "Lista o cardápio completo do restaurante com todos os produtos disponíveis, organizados por categoria",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function", 
    function: {
      name: "buscar_produto",
      description: "Busca um produto específico pelo nome",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome do produto a buscar" }
        },
        required: ["nome"]
      }
    }
  },
  // ... demais tools
];
```

### Loop de Processamento

```text
┌──────────────────────────────────────────────────────────────┐
│  1. Recebe mensagem do cliente                               │
│  2. Envia para IA com tools disponíveis                      │
│  3. Se IA retornar tool_calls:                               │
│     - Executa cada tool                                      │
│     - Adiciona resultados às mensagens                       │
│     - Chama IA novamente com resultados                      │
│  4. Repete até IA retornar resposta final (sem tool_calls)   │
│  5. Envia resposta ao cliente                                │
└──────────────────────────────────────────────────────────────┘
```

### Otimizações para Economia de Créditos

1. **Cache do cardápio**: Armazenar cardápio formatado para evitar queries repetidas
2. **Limite de iterações**: Máximo 5 chamadas de tools por mensagem
3. **Modelo eficiente**: Usar `google/gemini-3-flash-preview` (rápido e econômico)
4. **Resposta padrão**: Se falhar, responder de forma útil em vez de erro genérico

### Tratamento de Erros Profissional

Em caso de falha, o bot responderá:
- **Erro de API**: "No momento estamos com um pequeno problema técnico. Por favor, aguarde um momento ou entre em contato pelo telefone [X]."
- **Rate limit**: Aguarda e tenta novamente automaticamente
- **Timeout**: Resposta de contingência com informações básicas do restaurante

## Resultado Esperado

Após implementação, o bot será capaz de:
- Mostrar cardápio completo quando solicitado
- Buscar produtos específicos ("tem pizza?", "quanto custa o suco?")
- Calcular total do pedido
- Registrar pedidos no sistema
- Responder de forma profissional e contextualizada

## Estimativa

- Arquivos modificados: 1 (whatsapp-webhook/index.ts)
- Linhas de código: ~300 novas linhas
- Complexidade: Média-Alta
