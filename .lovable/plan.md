

# Consciência de Horário e Status de Funcionamento no Bot WhatsApp

## Problema Atual

O bot WhatsApp **não tem nenhuma noção de horário**. Quando o cliente diz "bom dia" às 20h, o bot responde normalmente sem corrigir. Quando pergunta "vocês estão abertos?", o bot não sabe os horários de funcionamento.

## O que será feito

### 1. Buscar `unit_settings` (opening_hours + timezone) no webhook

Antes de montar o system prompt, o webhook vai buscar os dados de `unit_settings` para a unidade:
- `opening_hours` (horários de cada dia da semana)
- `timezone` (fuso horário da unidade, padrão "America/Sao_Paulo")

### 2. Calcular horário atual e status (aberto/fechado)

Usando o `timezone` da unidade, calcular:
- Hora atual no fuso correto
- Dia da semana atual
- Se o restaurante está **aberto ou fechado** naquele momento
- Saudação correta: "Bom dia" (6h-12h), "Boa tarde" (12h-18h), "Boa noite" (18h-6h)

### 3. Injetar contexto de horário no system prompt

Adicionar um bloco dinâmico ao system prompt com:

```text
CONTEXTO DE HORÁRIO (dados em tempo real):
- Agora são 20:35 de terça-feira
- Saudação correta: "Boa noite"
- Status: ABERTO (fecha às 22:00)
- Horários de funcionamento:
  Segunda: 08:00 - 22:00
  Terça: 08:00 - 22:00
  ...
  Domingo: 10:00 - 20:00

REGRAS DE HORÁRIO:
- Use SEMPRE a saudação correta para o horário atual
- Se o cliente disser "bom dia" mas for noite, responda com "Boa noite!"
- Se perguntarem se está aberto, informe o status atual e os horários
- Se estiver FECHADO, informe o horário e pergunte se quer deixar o pedido anotado
- Se estiver ABERTO mas perto de fechar, avise gentilmente
```

### 4. Lógica de "fechado mas aceita pedido"

Se o restaurante estiver fechado e o cliente quiser pedir:
- Informar os horários de funcionamento
- Perguntar: "Quer deixar seu pedido anotado para quando abrirmos?"
- Se sim, seguir o fluxo normalmente

---

## Arquivo modificado

| Arquivo | Ação |
|---------|------|
| `supabase/functions/whatsapp-webhook/index.ts` | Buscar unit_settings, calcular horário, injetar contexto no prompt |

## Detalhes Técnicos

- Busca `unit_settings` com `select("opening_hours, timezone")` usando o `unitId` já disponível
- Calcula horário usando `new Date().toLocaleString("en-US", { timeZone })` do Deno runtime
- Monta string de contexto dinâmica e concatena ao `systemPrompt` antes do `formattingRules`
- Mapa de dias: `['sunday','monday','tuesday',...]` alinhado com `getDay()`
- Tradução dos dias para português no prompt
- Fallback: se não houver `unit_settings`, usa horário padrão (08:00-22:00) e timezone "America/Sao_Paulo"

