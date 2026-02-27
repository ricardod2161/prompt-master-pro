
## Diagnóstico Completo

**Estado atual:**
- `[AUDIO-TRANSCRIPTION-FAIL]` é logado apenas no `console.log()` — não persiste em banco, não é visualizável na UI
- Webhook tem `transcription` field em `whatsapp_messages` mas mensagens com falha ficam com `transcription = null`
- WhatsAppSettings.tsx tem 5 tabs: API, Bot, Conversas, Webhook, Segurança

**Plano:**

### 1 — Migration: tabela `audio_transcription_logs`
Nova tabela para persistir falhas de transcrição:
```sql
CREATE TABLE audio_transcription_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL,
  conversation_id uuid REFERENCES whatsapp_conversations(id),
  message_id text,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'failed', -- 'failed' | 'retried' | 'success'
  failure_reason text,
  mimetype text,
  file_size integer,
  transcription_result text,
  retry_count integer DEFAULT 0,
  audio_base64 text, -- guardar temporariamente para retry (TTL 24h)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- RLS: apenas usuários com acesso à unidade
```

### 2 — Webhook: persistir falhas em vez de apenas console.log
Em `whatsapp-webhook/index.ts`, nas 2 ocorrências de `[AUDIO-TRANSCRIPTION-FAIL]`:
- Inserir registro na tabela `audio_transcription_logs` com unit_id, phone, mimetype, file_size, reason
- Salvar `audio_base64` para possibilitar retry posterior
- Manter `console.log` existente para compatibilidade

### 3 — Edge Function: `retry-audio-transcription`
Nova edge function que:
- Recebe `log_id` 
- Busca o registro em `audio_transcription_logs`
- Re-executa a transcrição com o `audio_base64` salvo
- Se sucesso: atualiza `whatsapp_messages` com a transcrição + marca log como `success`
- Se falha: incrementa `retry_count`, atualiza `updated_at`

### 4 — UI: nova aba "Diagnóstico de Áudio" em WhatsAppSettings.tsx
Nova aba com 3 seções:

**Seção A — Estatísticas do dia (cards)**
- Total de áudios recebidos hoje
- Transcrições com sucesso (verde)
- Falhas de transcrição (vermelho)
- Taxa de sucesso % (progress bar)

**Seção B — Logs em tempo real (tabela com realtime)**
Colunas: Horário | Telefone | Motivo | Mime | Tamanho | Status | Ações
- Badge colorido por status: `failed`(vermelho) / `retried`(amarelo) / `success`(verde)
- Botão "Retry" por linha: dispara a edge function, muda status para retrying com spinner

**Seção C — Histórico por dia (últimos 7 dias)**
- Gráfico de barras simples: success vs failed por dia
- Usando recharts (já instalado)

### 5 — Hook `useAudioTranscriptionLogs`
Novo hook em `src/hooks/useAudioTranscriptionLogs.ts`:
- Query com Supabase Realtime para atualizações em tempo real
- Mutation para retry
- Estatísticas calculadas no cliente

### Arquivos modificados
| Arquivo | Mudança |
|---------|---------|
| `supabase/migrations/` | Nova tabela `audio_transcription_logs` com RLS |
| `supabase/functions/whatsapp-webhook/index.ts` | Persistir falhas no banco |
| `supabase/functions/retry-audio-transcription/index.ts` | Nova edge function |
| `src/hooks/useAudioTranscriptionLogs.ts` | Novo hook |
| `src/pages/WhatsAppSettings.tsx` | Nova aba "Diagnóstico" com grid=6 tabs |
