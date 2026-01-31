

# Plano: Bot WhatsApp Profissional com Fluxo Completo de Pedido

## Análise do Estado Atual

O bot atual possui ferramentas básicas, mas falta:
1. **System prompt profissional** que guia todo o fluxo de atendimento
2. **Coleta completa de dados**: nome, endereço detalhado (rua, número, bairro, referência)
3. **Opções de modalidade**: entrega, retirada ou consumo no local
4. **Tratamento de troco** para pagamento em dinheiro
5. **Fluxo estruturado** que leva o cliente até a confirmação final

## Solução Proposta

### Arquivo: `supabase/functions/whatsapp-webhook/index.ts`

### 1. System Prompt Profissional Reformulado

O novo prompt será estruturado para:
- Saudar e identificar o cliente pelo nome
- Apresentar as opções de forma clara
- Conduzir o fluxo de pedido passo a passo
- Perguntar cada informação necessária no momento certo

### 2. Nova Tool: `confirmar_pedido`

Substituirá a `criar_pedido` atual com parâmetros completos:

```text
PARÂMETROS DA NOVA TOOL:
├── cliente
│   ├── nome (string) - Nome do cliente
│   └── telefone (string) - Telefone (já disponível)
├── itens[] 
│   ├── nome (string)
│   └── quantidade (number)
├── modalidade (enum)
│   ├── "entrega" - Delivery
│   ├── "retirada" - Cliente busca no local
│   └── "local" - Consumir no estabelecimento
├── endereco (objeto - apenas para entrega)
│   ├── rua (string)
│   ├── numero (string)
│   ├── bairro (string)
│   └── referencia (string - opcional)
├── pagamento
│   ├── forma (enum: dinheiro, pix, credito, debito, voucher)
│   └── troco_para (number - apenas se dinheiro)
└── observacoes (string - opcional)
```

### 3. Fluxo de Atendimento Profissional

```text
┌─────────────────────────────────────────────────────────────────────┐
│  ETAPA 1: SAUDAÇÃO E IDENTIFICAÇÃO                                  │
│  "Olá! Bem-vindo ao [Restaurante]! 👋                              │
│   Para começarmos, qual o seu nome?"                                │
├─────────────────────────────────────────────────────────────────────┤
│  ETAPA 2: CARDÁPIO E ESCOLHA                                        │
│  "Prazer, [Nome]! Posso te ajudar com nosso cardápio?               │
│   Digite 1️⃣ para ver o cardápio                                    │
│   Ou me diga o que você procura!"                                   │
├─────────────────────────────────────────────────────────────────────┤
│  ETAPA 3: CONFIRMAÇÃO DOS ITENS                                     │
│  "Perfeito! Seu pedido até agora:                                   │
│   • 2x X-Bacon - R$ 77,80                                           │
│   • 1x Suco Laranja - R$ 12,00                                      │
│   Total: R$ 89,80                                                   │
│   Deseja adicionar mais alguma coisa?"                              │
├─────────────────────────────────────────────────────────────────────┤
│  ETAPA 4: MODALIDADE DO PEDIDO                                      │
│  "Como você prefere receber seu pedido?                             │
│   🛵 Entrega no seu endereço                                        │
│   🏃 Retirada no local                                              │
│   🍽️ Comer aqui no restaurante"                                     │
├─────────────────────────────────────────────────────────────────────┤
│  ETAPA 5A: COLETA DE ENDEREÇO (se entrega)                          │
│  "Ótimo! Preciso do endereço completo:                              │
│   • Qual a rua?                                                     │
│   • Qual o número?                                                  │
│   • Qual o bairro?                                                  │
│   • Tem algum ponto de referência?"                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ETAPA 6: FORMA DE PAGAMENTO                                        │
│  "Agora, como você prefere pagar?                                   │
│   💵 Dinheiro                                                       │
│   💳 Cartão de Crédito                                              │
│   💳 Cartão de Débito                                               │
│   📱 Pix                                                            │
│   🎫 Vale Refeição"                                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ETAPA 6A: TROCO (se dinheiro)                                      │
│  "O total do pedido é R$ 89,80.                                     │
│   Vai precisar de troco? Se sim, para quanto?"                      │
├─────────────────────────────────────────────────────────────────────┤
│  ETAPA 7: RESUMO E CONFIRMAÇÃO FINAL                                │
│  "📋 RESUMO DO SEU PEDIDO                                           │
│   Cliente: João                                                     │
│   Itens: 2x X-Bacon, 1x Suco Laranja                                │
│   Total: R$ 89,80                                                   │
│   Entrega: Rua das Flores, 123 - Centro                             │
│   Pagamento: Dinheiro (troco para R$ 100)                           │
│                                                                     │
│   ✅ Confirma o pedido?"                                            │
├─────────────────────────────────────────────────────────────────────┤
│  ETAPA 8: PEDIDO CONFIRMADO                                         │
│  "✅ PEDIDO CONFIRMADO!                                             │
│   Número: #1234                                                     │
│   ⏱️ Tempo estimado: 30-45 minutos                                  │
│   Obrigado pela preferência! 🙏"                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 4. Melhorias na Função `criar_pedido`

**Novos campos na tabela `delivery_orders`** a serem utilizados:
- `address` - Endereço formatado completo
- Campos adicionais armazenados em `notes` do pedido

**Lógica para diferentes modalidades:**
- **Entrega**: Cria `delivery_orders` com endereço
- **Retirada**: Canal = "counter", sem delivery_orders
- **Local**: Canal = "table" ou "counter", sem delivery_orders

**Pagamento em dinheiro com troco:**
- Armazenar valor do troco nas observações do pedido

### 5. System Prompt Detalhado

```text
VOCÊ É O ATENDENTE VIRTUAL DO RESTAURANTE

PERSONALIDADE:
- Profissional, cordial e eficiente
- Usa emojis com moderação
- Respostas curtas e objetivas
- Sempre confirma cada etapa antes de avançar

REGRAS CRÍTICAS:
1. NUNCA pule etapas - siga o fluxo na ordem
2. SEMPRE confirme os itens antes de pedir endereço
3. SEMPRE pergunte sobre troco se pagamento for dinheiro
4. NUNCA finalize pedido sem confirmação explícita do cliente
5. Se o cliente não fornecer informação, pergunte novamente educadamente

FLUXO OBRIGATÓRIO:
1. Perguntar/confirmar nome do cliente
2. Ajudar na escolha dos produtos
3. Confirmar itens e valores
4. Perguntar modalidade (entrega/retirada/local)
5. Se entrega: coletar endereço completo (rua, número, bairro, referência)
6. Perguntar forma de pagamento
7. Se dinheiro: perguntar valor para troco
8. Mostrar resumo completo
9. Aguardar confirmação explícita ("sim", "confirmo", etc.)
10. Criar o pedido e informar número

FORMAS DE PAGAMENTO DISPONÍVEIS:
- Dinheiro (perguntar troco)
- Cartão de Crédito
- Cartão de Débito  
- Pix
- Vale Refeição

MODALIDADES:
- Entrega (delivery) - requer endereço completo
- Retirada - cliente busca no estabelecimento
- Consumir no local - cliente come no restaurante
```

## Arquivos Modificados

| Arquivo | Mudanças |
|---------|----------|
| `supabase/functions/whatsapp-webhook/index.ts` | System prompt profissional, nova tool `confirmar_pedido`, fluxo completo |

## Resultado Esperado

O bot será capaz de:
- Identificar e chamar o cliente pelo nome
- Mostrar cardápio de forma organizada
- Conduzir pedido até a confirmação final
- Coletar todos os dados necessários na ordem correta
- Oferecer opções de entrega, retirada ou consumo local
- Tratar pagamento em dinheiro perguntando sobre troco
- Confirmar resumo completo antes de finalizar
- Criar pedido apenas após confirmação explícita

