
# Plano: Criar Edge Function para Teste de Conexão da Evolution API

## Problema Identificado
O teste de conexão atual (`useTestConnection`) faz uma chamada direta do navegador para a Evolution API. Isso pode falhar por problemas de CORS, já que a Evolution API pode não permitir requisições de origens externas.

## Solução Proposta
Criar uma edge function intermediária que:
1. Recebe os parâmetros de conexão do frontend
2. Faz a requisição para a Evolution API no servidor (sem restrições de CORS)
3. Retorna o resultado para o frontend

## Arquivos a Serem Modificados

### 1. Criar Edge Function `test-evolution-connection`
**Arquivo:** `supabase/functions/test-evolution-connection/index.ts`

A função irá:
- Receber `apiUrl`, `apiToken` e `instanceName` via POST
- Chamar o endpoint `/instance/connectionState/{instanceName}` da Evolution API
- Retornar o status da conexão ou erro detalhado

### 2. Atualizar Hook `useWhatsApp.ts`
**Arquivo:** `src/hooks/useWhatsApp.ts`

Modificar `useTestConnection` para:
- Chamar a nova edge function em vez da Evolution API diretamente
- Manter a mesma interface para o componente

## Detalhes Técnicos

### Edge Function - Estrutura
```text
+----------------+       +------------------------+       +----------------+
|    Frontend    | ----> | test-evolution-conn    | ----> | Evolution API  |
|  (Browser)     |       | (Edge Function)        |       | (External)     |
+----------------+       +------------------------+       +----------------+
      POST                     GET connectionState           Response
  apiUrl, token,              /instance/connectionState      { state: ... }
  instanceName
```

### Endpoint da Evolution API
- **URL:** `{apiUrl}/instance/connectionState/{instanceName}`
- **Header:** `apikey: {apiToken}`
- **Retorno esperado:** `{ instance: { state: "open" | "close" | ... } }`

### Tratamento de Erros
- Conexão recusada ou timeout
- Credenciais inválidas (401/403)
- Instância não encontrada (404)
- Erro interno da API (500)

## Benefícios
1. Elimina problemas de CORS
2. Credenciais da API não ficam expostas na rede do navegador
3. Logs centralizados no servidor para debug
4. Possibilidade de adicionar rate limiting se necessário

## Configuração Necessária
A edge function não requer secrets adicionais - os parâmetros são passados pelo frontend a partir dos campos do formulário.
