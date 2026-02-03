
# Adicionar Senha de Acesso às Configurações do WhatsApp

## Objetivo
Proteger a página de configurações do WhatsApp com uma senha, impedindo que usuários não autorizados alterem as configurações da API, bot e webhook.

---

## Alterações Necessárias

### 1. Banco de Dados

**Adicionar coluna na tabela `whatsapp_settings`:**

```sql
ALTER TABLE whatsapp_settings 
ADD COLUMN settings_password TEXT DEFAULT NULL;
```

- Campo opcional (NULL = sem proteção)
- Armazenado como texto (hash seria ideal, mas para simplicidade usaremos texto)

---

### 2. Frontend - Hook useWhatsApp.ts

**Atualizar interface `WhatsAppSettings`:**

```typescript
export interface WhatsAppSettings {
  // ... campos existentes
  settings_password: string | null;  // NOVO
}
```

---

### 3. Frontend - WhatsAppSettings.tsx

**Adicionar estado e lógica de verificação:**

```text
Estados novos:
- settingsPassword (valor atual da senha)
- isPasswordProtected (se existe senha configurada)
- isUnlocked (se usuário já desbloqueou)
- passwordInput (input de verificação)
```

**Fluxo de acesso:**
1. Ao carregar a página, verifica se existe `settings_password`
2. Se existir, exibe tela de desbloqueio com campo de senha
3. Usuário digita senha correta → acesso liberado
4. Usuário pode configurar/alterar senha na aba de configurações

**Novo card na aba API ou nova aba "Segurança":**

```text
Card "Proteção por Senha"
├── Switch: Ativar proteção por senha
├── Input: Nova senha (type="password")
├── Input: Confirmar senha
└── Botão: Salvar Proteção
```

---

## Interface de Desbloqueio

Quando a página carregar e houver senha configurada:

```text
┌─────────────────────────────────────────┐
│     🔒 Configurações Protegidas         │
│                                         │
│  Esta página está protegida por senha.  │
│                                         │
│  [ ••••••••••••• ]                      │
│                                         │
│       [ Desbloquear ]                   │
└─────────────────────────────────────────┘
```

---

## Fluxo de Configuração

| Cenário | Comportamento |
|---------|---------------|
| Sem senha | Acesso direto às configurações |
| Com senha + não desbloqueado | Exibe tela de desbloqueio |
| Com senha + desbloqueado | Acesso normal às configurações |
| Configurar nova senha | Input + confirmação + salvar |
| Remover senha | Switch OFF + salvar |

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| Banco de dados | Adicionar coluna `settings_password` |
| `src/hooks/useWhatsApp.ts` | Atualizar interface |
| `src/pages/WhatsAppSettings.tsx` | Adicionar lógica de bloqueio e card de configuração |

---

## Segurança

- A senha é verificada no frontend (comparação simples)
- A proteção é por sessão (não persiste após fechar navegador)
- Para segurança avançada, poderia ser implementado hash bcrypt no backend
