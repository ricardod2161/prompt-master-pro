
# Adicionar Botão de Reset Completo

## Objetivo
Adicionar um botão "Resetar Tudo" na página de seleção de unidades que faz logout e limpa todos os dados locais do navegador.

---

## Funcionalidade do Botão

O botão irá:
1. Limpar `localStorage` 
2. Limpar `sessionStorage`
3. Fazer `signOut()` do Supabase
4. Redirecionar para a página inicial

---

## Alterações Técnicas

### Arquivo: `src/pages/SelectUnit.tsx`

**1. Adicionar import do ícone:**
```typescript
import { Building2, Plus, MapPin, Phone, Loader2, LogOut, RotateCcw } from "lucide-react";
```

**2. Adicionar função de reset:**
```typescript
const handleReset = async () => {
  // Limpar todos os dados locais
  localStorage.clear();
  sessionStorage.clear();
  
  // Fazer logout
  await signOut();
  
  // Redirecionar para home
  navigate("/");
  
  // Recarregar para garantir limpeza completa
  window.location.reload();
};
```

**3. Adicionar botão no header (ao lado do botão Sair):**
```tsx
<div className="flex gap-2">
  <Button 
    variant="outline" 
    onClick={handleReset} 
    className="hover-lift text-destructive hover:bg-destructive/10"
  >
    <RotateCcw className="w-4 h-4 mr-2" />
    Resetar
  </Button>
  <Button variant="outline" onClick={handleSignOut} className="hover-lift">
    <LogOut className="w-4 h-4 mr-2" />
    Sair
  </Button>
</div>
```

---

## Layout Final do Header

```text
┌─────────────────────────────────────────────────────────────────┐
│  Selecione uma Unidade              [Resetar] [Sair]           │
│  Escolha a unidade que deseja gerenciar                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Responsividade

Para mobile, os botões ficarão empilhados ou menores:
- Em telas pequenas: mostrar apenas ícones (sem texto)
- Em telas médias/grandes: ícone + texto

```tsx
<Button variant="outline" onClick={handleReset} className="hover-lift text-destructive hover:bg-destructive/10">
  <RotateCcw className="w-4 h-4 sm:mr-2" />
  <span className="hidden sm:inline">Resetar</span>
</Button>
```

---

## Resumo

| Item | Descrição |
|------|-----------|
| Arquivo | `src/pages/SelectUnit.tsx` |
| Ícone | `RotateCcw` do lucide-react |
| Ação | `localStorage.clear()` + `sessionStorage.clear()` + `signOut()` + `reload()` |
| Estilo | Botão destrutivo (vermelho) |
