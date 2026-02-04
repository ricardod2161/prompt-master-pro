
# Plano: Adicionar Keywords de Escalação para Dono/Proprietário

## Situação Atual
O sistema já possui:
- Função `detectHumanEscalation()` que detecta palavras-chave de escalação
- Função `escalateToHuman()` que desativa o bot e cria notificação
- Notificação já é enviada para a tabela `notifications` com categoria "whatsapp"

## Problema
Faltam palavras-chave importantes:
- "dono" (owner)
- "proprietário" / "proprietario"
- "chefe"
- "falar com o dono"
- "quero falar com o dono"
- "cadê o dono"
- "chama o dono"

## Solução

### Arquivo a Modificar
`supabase/functions/whatsapp-webhook/index.ts`

### Alteração
Adicionar as seguintes palavras-chave na lista `escalationKeywords` (linhas 124-166):

```typescript
const escalationKeywords = [
  // Palavras existentes...
  
  // NOVAS - Pedido de dono/proprietário
  'dono',
  'proprietario',
  'chefe',
  'falar com dono',
  'quero o dono',
  'chama o dono',
  'cade o dono',
  'onde esta o dono',
  'dono do restaurante',
  'dono da loja',
  'falar com o chefe',
  'quero falar com chefe',
];
```

## Resultado
Quando o cliente enviar mensagens como:
- "Quero falar com o dono"
- "Chama o chefe"
- "Cadê o proprietário?"

O sistema irá:
1. Desativar o bot para essa conversa
2. Criar notificação na central de notificações
3. Enviar mensagem ao cliente informando que será transferido

## Notificação Criada
```
🆘 Atendimento Humano Solicitado
Cliente [Nome] ([Telefone]) solicitou atendimento humano.
Motivo: [mensagem do cliente]
```
