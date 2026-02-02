
# Melhorias na Pagina de Login - Mostrar Senha e Erro Traduzido

## Visao Geral

Serao implementadas duas melhorias na pagina de Login:
1. Botao de mostrar/ocultar senha em todos os campos de senha
2. Traducao da mensagem de erro de senha fraca para portugues

---

## Sobre o Erro

O erro "Password is known to be weak and easy to guess" ocorre porque o Supabase Auth tem a verificacao HIBP (Have I Been Pwned) ativada, que bloqueia senhas que ja vazaram em brechas de dados. Isso e uma configuracao de seguranca importante.

**Solucao**: Traduzir a mensagem para portugues para melhor experiencia do usuario.

---

## Funcionalidades a Implementar

### 1. Botao Mostrar/Ocultar Senha

Adicionar em todos os campos de senha:
- Campo de senha do Login
- Campo de senha do Cadastro
- Campo de confirmar senha do Cadastro

**Comportamento:**
- Icone de olho (Eye) quando senha oculta
- Icone de olho riscado (EyeOff) quando senha visivel
- Toggle entre type="password" e type="text"
- Estado independente para cada campo

### 2. Traducao de Mensagens de Erro

Criar funcao para traduzir mensagens de erro do Supabase para portugues:
- "Password is known to be weak..." -> "Esta senha e muito fraca e comum..."
- Outras mensagens comuns tambem serao traduzidas

---

## Modificacoes no Arquivo

### `src/pages/Login.tsx`

**Novos estados:**
```typescript
const [showLoginPassword, setShowLoginPassword] = useState(false);
const [showSignupPassword, setShowSignupPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
```

**Novos imports:**
```typescript
import { Eye, EyeOff } from "lucide-react";
```

**Funcao de traducao:**
```typescript
const translateError = (message: string) => {
  const translations: Record<string, string> = {
    "Password is known to be weak and easy to guess. Please choose a different one.": 
      "Esta senha é muito fraca e comum. Por favor, escolha uma senha mais segura.",
    // outras traducoes...
  };
  return translations[message] || message;
};
```

**Estrutura do campo com botao:**
```text
+------------------------------------------+
| [Input de senha............] [Icone Eye] |
+------------------------------------------+
```

---

## Design do Botao

- Posicao: Dentro do input, alinhado a direita
- Icone: Eye (olho aberto) ou EyeOff (olho fechado)
- Cor: text-muted-foreground com hover:text-foreground
- Tamanho: h-4 w-4
- Cursor: pointer
- Sem fundo, apenas icone

---

## Estrutura do Input com Botao

```typescript
<div className="relative">
  <Input
    type={showPassword ? "text" : "password"}
    className="pr-10" // padding para o botao
  />
  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-1/2 -translate-y-1/2"
  >
    {showPassword ? <EyeOff /> : <Eye />}
  </button>
</div>
```

---

## Beneficios

1. **Usabilidade**: Usuario pode verificar se digitou a senha corretamente
2. **Acessibilidade**: Reducao de erros de digitacao
3. **UX**: Mensagens de erro em portugues facilitam entendimento
4. **Seguranca**: Usuario entende porque a senha foi rejeitada

---

## Proximos Passos

1. Adicionar estados para controle de visibilidade das senhas
2. Importar icones Eye e EyeOff do lucide-react
3. Criar funcao translateError para traduzir mensagens
4. Adicionar botoes de toggle em cada campo de senha
5. Ajustar estilos para o botao ficar dentro do input
6. Testar em todos os campos de senha
