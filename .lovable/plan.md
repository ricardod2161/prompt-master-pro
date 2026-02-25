

# Correcao: Erros de Senha em Ingles + Email de Recuperacao em Ingles

## Problemas Identificados

Analisei os prints e os logs de autenticacao. Ha dois problemas distintos:

### Problema 1: Mensagem de erro em ingles na pagina /reset-password
No print, o toast mostra **"New password should be different from the old password."** em ingles. Isso acontece porque a pagina `ResetPassword.tsx` (linha 58) exibe `err.message` diretamente do backend sem traduzir:
```text
toast.error(err.message || "Erro ao atualizar senha");
```

O sistema de traducao (`translateError`) existe na pagina de Login mas NAO esta sendo usado na pagina de reset de senha.

### Problema 2: Email de recuperacao em ingles
O email mostra "Reset your password", "Reset Password", "If you didn't request this..." tudo em ingles. Isso acontece porque o projeto nao tem templates de email personalizados -- usa os templates padrao do sistema que sao em ingles.

**Para traduzir o email**, seria necessario configurar um dominio de email customizado e criar templates personalizados. O projeto atualmente NAO tem dominio de email configurado.

### Problema 3: ProfileTab tambem sem traducao de erros
A pagina de configuracoes (`ProfileTab.tsx`) tambem chama `updatePassword` que pode retornar erros em ingles sem traducao.

---

## Correcoes

### 1. Adicionar traducao de erros na pagina ResetPassword

Adicionar a funcao `translateError` com todas as mensagens de erro de senha possiveis traduzidas para portugues:

| Mensagem original | Traducao |
|---|---|
| "New password should be different from the old password." | "A nova senha deve ser diferente da senha atual." |
| "Password is known to be weak and easy to guess. Please choose a different one." | "Esta senha e muito fraca e comum. Escolha uma senha mais segura." |
| "Auth session missing!" | "Sessao expirada. Solicite um novo link de recuperacao." |

### 2. Adicionar traducao de erros no ProfileTab/useProfile

Adicionar a mesma funcao de traducao no hook `useProfile.ts` para que erros de troca de senha nas configuracoes tambem aparecam em portugues.

### 3. Email de recuperacao em portugues

Como nao ha dominio de email configurado, nao e possivel customizar os templates de email neste momento. Vou informar o usuario sobre como configurar isso.

---

## Arquivos modificados

| Arquivo | Acao |
|---------|------|
| `src/pages/ResetPassword.tsx` | Adicionar `translateError` e aplicar em todos os erros |
| `src/hooks/useProfile.ts` | Adicionar traducao nos erros de senha |
| `src/pages/Login.tsx` | Adicionar traducao "same_password" ao mapa existente |

## Sobre o email em ingles

Para traduzir o email de recuperacao de senha para portugues, e necessario configurar um dominio de email customizado. Apos a implementacao das correcoes de traducao de erros, posso guiar voce na configuracao do dominio de email para personalizar os templates.

