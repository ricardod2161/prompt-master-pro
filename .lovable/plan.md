
# Fase 4: Triggers Automaticos e IA nos Logs

## Visao Geral

Esta fase implementara automacao inteligente no sistema atraves de:
1. **Triggers de banco** para notificacoes automaticas
2. **Sistema de IA** para analise e resolucao de problemas nos logs

---

## Parte 1: Triggers de Notificacoes Automaticas

### 1.1 Trigger para Novos Pedidos

Sera criada uma funcao de trigger que dispara automaticamente quando um pedido e inserido:

```text
[Pedido Criado] --> [Trigger AFTER INSERT] --> [Notificacao Criada]
                                           --> [Log Admin Criado]
```

**Logica:**
- Detecta canal do pedido (delivery, counter, table, whatsapp)
- Cria notificacao com tipo "order" e categoria apropriada
- Registra log na tabela admin_logs

### 1.2 Trigger para Estoque Baixo

Funcao de trigger monitorando atualizacoes na tabela `inventory_items`:

```text
[Estoque Atualizado] --> [Verifica current_stock <= min_stock]
                              |
                    [SIM] --> [Cria Notificacao de Alerta]
                              [Registra Log de Warning]
```

**Logica:**
- Compara `current_stock` com `min_stock`
- Evita duplicatas com verificacao de notificacao recente (24h)
- Severidade baseada no nivel de estoque (warning vs error)

### 1.3 Trigger para Mudanca de Status do Pedido

Monitora transicoes de status importantes:
- `pending` -> `preparing` (em preparo)
- `preparing` -> `ready` (pronto)
- `ready` -> `delivering` (saiu para entrega)
- `*` -> `cancelled` (cancelado)

---

## Parte 2: Sistema de IA para Analise de Logs

### 2.1 Edge Function: `analyze-logs`

Nova funcao serverless usando Lovable AI (google/gemini-3-flash-preview):

**Funcionalidades:**
- Analisa ultimos N logs com erros/warnings
- Identifica padroes e causas raiz
- Sugere correcoes especificas
- Gera relatorio de saude do sistema

### 2.2 Interface de Analise no Admin

Novo componente `AILogAnalyzer` com:
- Botao "Analisar com IA"
- Visualizacao de insights
- Sugestoes de correcao acionaveis
- Historico de analises

### 2.3 Fluxo de Analise

```text
[Admin clica Analisar] --> [Frontend busca logs recentes]
                               |
                       [Envia para Edge Function]
                               |
                       [IA processa e classifica]
                               |
                       [Retorna insights + sugestoes]
                               |
                       [Exibe no painel com acoes]
```

---

## Detalhes Tecnicos

### Migracao SQL

```sql
-- Trigger para novos pedidos
CREATE FUNCTION notify_new_order()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (unit_id, title, message, type, category, metadata)
  VALUES (
    NEW.unit_id,
    'Novo pedido #' || NEW.order_number,
    'Pedido de ' || COALESCE(NEW.customer_name, 'Cliente') || ' - R$ ' || NEW.total_price,
    'info',
    'order',
    jsonb_build_object('order_id', NEW.id, 'channel', NEW.channel)
  );
  
  INSERT INTO admin_logs (action, category, unit_id, metadata, severity)
  VALUES (
    'Novo pedido criado',
    'order',
    NEW.unit_id,
    jsonb_build_object('order_id', NEW.id, 'order_number', NEW.order_number),
    'info'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para estoque baixo
CREATE FUNCTION check_low_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_stock <= COALESCE(NEW.min_stock, 0) THEN
    -- Verificar se ja existe notificacao recente
    IF NOT EXISTS (
      SELECT 1 FROM notifications
      WHERE category = 'stock'
      AND metadata->>'item_id' = NEW.id::text
      AND created_at > NOW() - INTERVAL '24 hours'
    ) THEN
      INSERT INTO notifications (...)
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Edge Function: analyze-logs

```typescript
// Estrutura basica
serve(async (req) => {
  const { logs, analysisType } = await req.json();
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(logs) }
      ],
      tools: [{ type: "function", function: analyzeLogsSchema }]
    })
  });
  
  return Response.json(result);
});
```

### Componente AILogAnalyzer

- Card de "Analise Inteligente" no topo dos logs
- Indicadores de saude: OK/Warning/Critical
- Lista de problemas detectados com severidade
- Botoes de acao rapida para cada sugestao
- Loading state com animacao durante analise

---

## Arquivos a Criar/Modificar

### Novos Arquivos:
1. `supabase/migrations/xxx_notification_triggers.sql` - Triggers SQL
2. `supabase/functions/analyze-logs/index.ts` - Edge function IA
3. `src/components/admin/AILogAnalyzer.tsx` - Componente de analise
4. `src/hooks/useLogAnalysis.ts` - Hook para chamar a IA

### Arquivos a Modificar:
1. `src/components/admin/AdminActivityLogs.tsx` - Integrar AILogAnalyzer
2. `supabase/config.toml` - Registrar nova edge function
3. `src/hooks/useAdminLogs.ts` - Adicionar funcao de analise

---

## Beneficios

1. **Automacao Total**: Notificacoes criadas sem intervencao manual
2. **Proatividade**: Alertas de estoque antes de acabar
3. **Inteligencia**: IA identifica problemas antes de escalar
4. **Rastreabilidade**: Todos eventos logados automaticamente
5. **Acoes Rapidas**: Sugestoes da IA com um clique

---

## Proximos Passos Apos Aprovacao

1. Criar migracao SQL com triggers
2. Implementar edge function de analise
3. Desenvolver interface do AILogAnalyzer
4. Integrar no painel de administracao
5. Testar fluxo completo
