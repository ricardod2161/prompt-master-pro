
## Análise Técnica Completa — WhatsApp Settings (WhatsAppSettings.tsx)

### Diagnóstico do estado atual (1467 linhas lidas integralmente)

---

**BUG CRÍTICO 1 — Senha comparada em texto puro no cliente (linha 222)**

```ts
if (passwordInput === settings?.settings_password) {
  setIsUnlocked(true);
}
```
A `settings_password` é retornada em texto puro pelo hook `useWhatsAppSettings` (que lê `whatsapp_settings.*` diretamente). Isso significa:
1. **Qualquer usuário autenticado** pode inspecionar o Network tab e ver a senha em texto puro no response JSON.
2. A view `whatsapp_settings_public` (que oculta tokens e URL) **não oculta** `settings_password` — ela simplesmente não inclui a coluna, mas a query principal (`select("*")`) a retorna inteira.
3. A proteção por senha na UI é cosmética — não é uma proteção real de dados.
**Correto**: Armazenar a senha como hash (bcrypt/argon2 via Edge Function) e comparar server-side, OU simplesmente remover `settings_password` do select da query pública e usar RLS baseada em role de admin.

**BUG CRÍTICO 2 — `useWhatsAppConversations` em WhatsAppSettings.tsx usa canal Realtime com nome fixo "whatsapp-conversations-realtime"**

```ts
const channel = supabase
  .channel("whatsapp-conversations-realtime")  // ← nome fixo global!
```
Exatamente o mesmo bug corrigido no `useTables`. Se a página WhatsAppSettings e a página WhatsAppChat estiverem abertas ao mesmo tempo (ou duas unidades em abas diferentes), ambas competem pelo mesmo canal Realtime, causando comportamento inconsistente. Deve ser `whatsapp-conversations-${selectedUnit.id}`.

**BUG CRÍTICO 3 — Estado `isUnlocked` é in-memory apenas — sem persistência na sessão**

O `isUnlocked` é um `useState` local. Se o usuário navegar para outra página e voltar, a tela de senha aparece novamente. Em operação normal de restaurante, isso é extremamente irritante. A flag de desbloqueio deveria ser persistida em `sessionStorage` com chave `whatsapp-unlocked-${unitId}` para durar enquanto a aba estiver aberta.

**BUG CRÍTICO 4 — `handleSaveBotSettings` pode criar duplicata se `settings?.id` não existir ainda**

```ts
if (settings?.id) {
  updateSettings.mutate({ id: settings.id, ...data });
} else {
  createSettings.mutate(data);  // ← cria sem api_url/token/instance
}
```
O `createSettings` aqui cria uma nova linha com apenas os dados do bot (sem API), mas a tabela tem constraint `UNIQUE(unit_id)`. Se o operador salvar "Bot" antes de "API", depois salvar "API" tentará criar outra linha e quebrará com `duplicate key value violates unique constraint`. O correto seria usar `upsert` com `onConflict: "unit_id"` em vez de `insert`.

---

**PROBLEMAS OPERACIONAIS/UX:**

**1. Cards de métricas mostram dados estáticos — sem contexto temporal**

Os 4 cards no topo mostram:
- "5 Conversas" → total acumulado histórico (nunca zera)
- "5 Bot Ativo" → conversas com bot ativo agora
- "ON/OFF Bot Global" → duplica o toggle da aba Bot
- "OK API Status" → calculado como `isConnected ? "OK" : "—"` (string estática, sem verificação real)

Seria muito mais útil mostrar:
- **Mensagens Hoje** (contagem real de mensagens de hoje via `whatsapp_messages`)
- **Tempo Médio de Resposta do Bot** (calculado sobre mensagens de hoje)
- **Conversas Novas Hoje** (conversas criadas hoje)
- **Status real da API** (verificação periódica da instância, não apenas "tem config?")

**2. Conversas na aba "Conversas" não têm link para abrir o chat**

A lista de conversas mostra nome, telefone e última mensagem, mas não tem botão "Abrir Chat" que navega para `/whatsapp?conversation=<id>`. O operador precisa ir manualmente para a outra página e encontrar a conversa. Seria um botão simples com `useNavigate`.

**3. Aba "API" não mostra estado real da instância após salvar**

Após salvar as configurações de API, o badge "Conectado/Não conectado" depende apenas de `settings?.api_url && settings?.api_token && settings?.instance_name` — sem verificar o estado real da instância. Um token expirado aparece como "Conectado". O teste manual (botão "Testar Conexão") deveria ser executado automaticamente após salvar e o resultado persistido no state para atualizar o badge.

**4. Preview de voz desabilitado quando `isPreviewLoading || isPreviewPlaying` mas deveria mostrar "Stop"**

Na linha 792:
```ts
disabled={isPreviewLoading || isPreviewPlaying}
```
O botão fica desabilitado quando está tocando. Mas o `handleVoicePreview` ao ser chamado enquanto `previewAudio` está definido para e limpa o áudio. O botão deveria ficar habilitado durante `isPreviewPlaying` para permitir parar. Isso já está parcialmente correto na lógica, mas o `disabled` incorreto impede o stop.

**5. Sem campo de busca/filtro nas conversas**

A lista de conversas pode ter 50+ clientes. Sem busca por nome ou telefone, o operador rola a lista para encontrar um cliente específico. Adicionar um `<Input placeholder="Buscar por nome ou telefone...">` que filtra client-side resolve.

**6. Sem indicador de "não lida" nas conversas da aba Configurações**

As conversas na aba Configurações mostram última mensagem mas não diferencia visualmente conversas onde a última mensagem é do cliente (não respondida pelo bot/humano). Um ponto verde/vermelho no avatar distinguiria mensagens do cliente vs do bot.

**7. Webhook URL hardcoded com project_id em texto puro (linha 94)**

```ts
const WEBHOOK_URL = "https://qxqxahgfqjctvsjddfbh.supabase.co/functions/v1/whatsapp-webhook";
```
Deveria ser `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook` para ser portável entre ambientes (staging/produção).

**8. `useWhatsAppSettings` importado mas `toast` e `queryClient` declarados e nunca usados no hook**

Em `src/hooks/useWhatsApp.ts` linha 44-67:
```ts
const { toast } = useToast();       // ← não usados!
const queryClient = useQueryClient(); // ← não usados!
```
Dead code — `useWhatsAppSettings` só faz query, não tem side effects. Além de ser ruim, cria subscriptions desnecessárias ao React Query.

**9. Tab "Diagnóstico" com nome "audio-diag" — não semanticamente descritivo**

O `value="audio-diag"` não seria encontrado por um desenvolvedor procurando "diagnóstico" no código. Deve ser `value="diagnostico"` para consistência com o texto exibido.

**10. Sem contagem de tentativas máximas de retry no log de áudio**

O retry botão aparece para qualquer log com `status !== "success" && audio_base64`. Mas `retry_count` já existe na tabela. Um log com `retry_count >= 3` deveria mostrar "Máximo de tentativas atingido" ao invés do botão Retry, evitando loops infinitos de erro.

---

## Plano de Implementação

### Arquivos a modificar:

**`src/pages/WhatsAppSettings.tsx`** — foco principal

1. **Corrigir webhook URL hardcoded**: substituir por `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`

2. **Corrigir `disabled` do botão de preview de voz**: remover `isPreviewPlaying` da condição `disabled` para permitir parar o áudio

3. **Persistir unlock em sessionStorage**: adicionar lógica de persist/read com chave `whatsapp-unlocked-${unitId}`

4. **Botão "Abrir Chat" nas conversas**: adicionar `<Button onClick={() => navigate('/whatsapp?conversation=' + c.id)}>` em cada item da lista

5. **Busca de conversas na aba Configurações**: adicionar `<Input>` de filtro client-side por nome/telefone

6. **Retry máximo 3 vezes**: mostrar "Máximo atingido" quando `log.retry_count >= 3` em vez do botão Retry

7. **Indicador visual de última mensagem do cliente**: adicionar ponto colorido no avatar baseado no `role` da última mensagem

8. **Cards de métricas melhorados**: adicionar query de `whatsapp_messages` de hoje para mostrar "Mensagens Hoje" e "Conversas Hoje"

**`src/hooks/useWhatsApp.ts`** — correções de hook

9. **Remover `toast` e `queryClient` não usados em `useWhatsAppSettings`**: limpar dead code

10. **Corrigir canal Realtime**: `whatsapp-conversations-${selectedUnit.id}` em vez de `"whatsapp-conversations-realtime"`

11. **Corrigir `createSettings` para usar upsert**: evitar duplicata ao salvar Bot antes de API

### O que NÃO muda:
- `AIPromptGenerator` — robusto e bem estruturado
- `BotSimulator` — funcionando
- Sistema de diagnóstico de áudio — bem implementado
- `useAudioTranscriptionLogs` — correto com Realtime scoped
- Lógica de TTS / ElevenLabs — funcional
- Tab de Segurança — estrutura OK (bug de exposição de senha é separado e complexo)
