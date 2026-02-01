
# Plano: Editor de Cores e Personalizacao Visual

## Visao Geral

Adicionar uma nova aba "Aparencia" nas Configuracoes que permite ao restaurante personalizar as cores do sistema, criando uma identidade visual propria. O sistema aplicara as cores dinamicamente usando CSS variables.

---

## Arquitetura da Solucao

### 1. Alteracao no Banco de Dados

Adicionar colunas de personalizacao na tabela `unit_settings`:

```text
unit_settings (colunas adicionais)
├── primary_color (text) - Cor principal da marca (HSL)
├── accent_color (text) - Cor de destaque/secundaria
├── success_color (text) - Cor para status positivos
├── warning_color (text) - Cor para alertas
├── error_color (text) - Cor para erros
├── sidebar_color (text) - Cor de fundo da sidebar
├── dark_mode_enabled (boolean) - Modo escuro ativo
```

### 2. Estrutura da Nova Aba

A aba "Aparencia" tera as seguintes secoes:

```text
Aparencia
├── Tema Geral
│   └── Toggle: Modo Escuro / Modo Claro
├── Cores da Marca
│   ├── Cor Principal (botoes, links, destaques)
│   ├── Cor de Fundo Sidebar
│   └── Cor de Destaque
├── Cores de Status
│   ├── Sucesso (verde)
│   ├── Alerta (amarelo)
│   └── Erro (vermelho)
├── Preview em Tempo Real
│   └── Mini cards mostrando como ficara
├── Presets de Cores
│   └── Selecionar paletas pre-definidas
└── Reset para Padrao
```

---

## Componentes de UI

### Color Picker Component

Criar um componente reutilizavel de selecao de cor:

```text
ColorPicker
├── Input de cor nativo (type="color")
├── Preview circular da cor
├── Campo de texto para valor HEX
├── Conversao automatica HEX <-> HSL
```

### Preview Card

Card que mostra em tempo real como as cores ficarao:

```text
ColorPreviewCard
├── Header com cor principal
├── Botoes de exemplo
├── Badges de status coloridos
├── Sidebar miniatura
```

### Presets de Paletas

Oferecer paletas prontas para escolha rapida:

```text
Presets disponiveis:
├── Verde Padrao (atual)
├── Azul Corporativo
├── Laranja Energetico
├── Roxo Moderno
├── Vermelho Intenso
├── Rosa Elegante
```

---

## Fluxo de Aplicacao das Cores

```text
1. Usuario seleciona cor
   └── State local atualizado
       └── Preview atualiza instantaneamente

2. Usuario clica "Salvar"
   └── Cores salvas no banco (unit_settings)
       └── Toast de confirmacao

3. Ao carregar aplicacao
   └── Hook useUnitSettings carrega cores
       └── useEffect aplica CSS variables no :root
           └── Toda interface reflete as cores
```

---

## Detalhamento Tecnico

### Arquivos a Criar/Modificar

1. **`src/components/settings/ColorPicker.tsx`**
   - Componente de selecao de cor
   - Conversao HEX/HSL
   - Preview visual

2. **`src/components/settings/ColorPreviewCard.tsx`**
   - Cartao de pre-visualizacao
   - Mini interface com exemplos

3. **`src/components/settings/ColorPresets.tsx`**
   - Grid de paletas pre-definidas
   - Selecao com um clique

4. **`src/hooks/useTheme.ts`**
   - Aplicar cores no CSS dinamicamente
   - Gerenciar dark/light mode
   - Carregar cores salvas

5. **`src/pages/Settings.tsx`**
   - Adicionar aba "Aparencia"
   - Integrar novos componentes

6. **`src/hooks/useUnitSettings.ts`**
   - Adicionar campos de cor no tipo

### Migracao SQL

```sql
ALTER TABLE public.unit_settings 
ADD COLUMN primary_color text DEFAULT '142 76% 36%',
ADD COLUMN accent_color text DEFAULT '217 91% 60%',
ADD COLUMN success_color text DEFAULT '142 76% 36%',
ADD COLUMN warning_color text DEFAULT '38 92% 50%',
ADD COLUMN error_color text DEFAULT '0 84% 60%',
ADD COLUMN sidebar_color text,
ADD COLUMN dark_mode_enabled boolean DEFAULT true;
```

### Hook useTheme

```typescript
// Logica principal
function useTheme() {
  const { settings } = useUnitSettings();
  
  useEffect(() => {
    if (settings?.primary_color) {
      document.documentElement.style.setProperty(
        '--primary', 
        settings.primary_color
      );
    }
    // Aplicar demais cores...
  }, [settings]);
  
  const setTheme = (mode: 'light' | 'dark') => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  };
  
  return { setTheme };
}
```

---

## Interface da Aba Aparencia

### Layout Responsivo

```text
Desktop (2 colunas):
┌─────────────────────┬──────────────────┐
│ Configuracoes       │ Preview ao Vivo  │
│ de Cores            │ (Card fixo)      │
└─────────────────────┴──────────────────┘

Mobile (1 coluna):
┌─────────────────────┐
│ Preview ao Vivo     │
├─────────────────────┤
│ Configuracoes       │
│ de Cores            │
└─────────────────────┘
```

### Elementos Visuais

- **Color pickers** circulares com preview
- **Sliders** para ajuste fino de saturacao/luminosidade
- **Cards de preset** com gradiente de cores
- **Toggle animado** para dark/light mode
- **Botao "Resetar"** com confirmacao

---

## Comportamento Esperado

| Acao | Resultado |
|------|-----------|
| Selecionar cor | Preview atualiza instantaneamente |
| Clicar preset | Todas as cores da paleta aplicadas |
| Toggle dark mode | Tema muda em tempo real |
| Salvar | Cores persistidas no banco |
| Novo login | Cores carregadas automaticamente |
| Reset | Volta para cores padrao do sistema |

---

## Sequencia de Implementacao

1. Criar migracao SQL para adicionar colunas de cor
2. Atualizar tipos em `useUnitSettings.ts`
3. Criar componente `ColorPicker.tsx`
4. Criar componente `ColorPreviewCard.tsx`
5. Criar componente `ColorPresets.tsx`
6. Criar hook `useTheme.ts`
7. Adicionar aba "Aparencia" em `Settings.tsx`
8. Integrar `useTheme` no `App.tsx` para aplicar cores globalmente
9. Testar responsividade e persistencia
