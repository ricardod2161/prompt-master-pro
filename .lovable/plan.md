
# Plano: Configuracoes - Redesign 3D Profissional

## Analise do Estado Atual

A pagina de Configuracoes atual tem 852 linhas em um unico arquivo monolitico com:
- Cards planos sem efeitos 3D
- Tabs basicos sem animacoes
- Switches simples sem destaque visual
- Secao de horarios repetitiva e verbosa
- Formularios sem hierarquia visual clara
- Sem glassmorphism ou gradientes

---

## Melhorias Propostas

### 1. Arquitetura Modular

Dividir em componentes menores para melhor manutencao:

```text
src/components/settings/
├── SettingsHeader.tsx         (header com gradiente 3D)
├── SettingsTabs.tsx           (tabs animados)
├── UnitTab.tsx                (dados da unidade)
├── OperationalTab.tsx         (canais e automacoes)
├── FinancialTab.tsx           (taxas e pagamentos)
├── HoursTab.tsx               (horarios compactos)
├── ProfileTab.tsx             (perfil e senha)
├── AppearanceTab.tsx          (existente - aprimorar)
├── SettingCard.tsx            (card 3D reutilizavel)
└── SettingToggleItem.tsx      (toggle com visual premium)
```

### 2. Sistema Visual 3D

#### Header Premium
```text
┌─────────────────────────────────────────────────────┐
│  [⚙️ Icon 3D]   Configuracoes                      │
│                 Restaurante Sao Francisco           │
│                 [Badge: Unidade Ativa]              │
└─────────────────────────────────────────────────────┘
 ↑ Gradiente sutil + sombra 3D + icone com glow
```

#### Tabs Redesenhados
```text
┌────────────────────────────────────────────────────────────┐
│ [🏢 Unidade] [⚙️ Operacional] [💰 Financeiro] [🕐 Horarios] [👤 Perfil] [🎨 Aparencia] │
│     ╰────────── Indicador animado deslizante ──────────╯    │
└────────────────────────────────────────────────────────────┘
 ↑ Fundo glassmorphism + tabs com hover glow + transicao suave
```

### 3. SettingToggleItem Component

Novo componente reutilizavel para switches:

```text
┌─────────────────────────────────────────────────────────────┐
│ [🚚]  Delivery                                    [═════○]  │
│       Pedidos para entrega                                  │
│       ─────────────────────────────────────────────────────│
│       ↑ Borda com gradiente quando ativo                    │
└─────────────────────────────────────────────────────────────┘
```

Caracteristicas:
- Icone com background gradiente
- Titulo em bold, descricao em muted
- Switch com feedback visual
- Borda luminosa quando ativo
- Hover com lift sutil

### 4. Secao de Horarios Compacta

Antes (repetitivo):
```text
Segunda-feira    [Toggle]  [08:00] ate [22:00]
Terca-feira      [Toggle]  [08:00] ate [22:00]
Quarta-feira     [Toggle]  [08:00] ate [22:00]
... (7 linhas identicas)
```

Depois (inteligente):
```text
┌────────────────────────────────────────────────────────────┐
│ 📅 Horario de Funcionamento                                │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ Copiar horario:  [Seg-Sex ▼]  →  Aplicar a todos     │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
│ ┌─────────┬─────────────────────────────────┬──────────┐  │
│ │ Segunda │ ○ Aberto   08:00 - 22:00        │ [Editar] │  │
│ │ Terca   │ ○ Aberto   08:00 - 22:00        │ [Editar] │  │
│ │ ...     │ ...                              │ ...      │  │
│ │ Domingo │ ● Fechado                        │ [Editar] │  │
│ └─────────┴─────────────────────────────────┴──────────┘  │
│                                                            │
│ [💾 Salvar Horarios]                                       │
└────────────────────────────────────────────────────────────┘
```

Features:
- Copiar horarios entre dias
- Tabela visual compacta
- Dialog para edicao detalhada
- Indicador visual de aberto/fechado

### 5. Cards de Configuracao 3D

Aplicar Card3D com variantes:

```text
UnitTab:
├── Card3D variant="elevated" (dados principais)
└── Gradiente sutil no fundo

OperationalTab:
├── Card3D "Canais de Venda" com grid de toggles
└── Card3D "Automacoes" com toggles de sistema

FinancialTab:
├── GlassCard para taxas (destaque visual)
└── Card3D para metodos de pagamento

ProfileTab:
├── Card3D para dados pessoais
├── Card3D para alterar senha
└── Card com borda destructive para logout
```

### 6. Formularios Aprimorados

Inputs com visual premium:
```text
┌─────────────────────────────────────┐
│ Nome do Estabelecimento             │
│ ┌─────────────────────────────────┐ │
│ │ [🏪] Restaurante São Francisco  │ │  ← Icone no input
│ └─────────────────────────────────┘ │
│                                     │
│ CNPJ                    Telefone    │
│ ┌──────────────┐  ┌──────────────┐  │
│ │ 00.000.000/00│  │ (00) 00000-00│  │  ← Mascaras automaticas
│ └──────────────┘  └──────────────┘  │
└─────────────────────────────────────┘
```

### 7. Animacoes e Transicoes

```text
Tab Changes:
├── Fade in/out suave (200ms)
├── Slide horizontal para conteudo
└── Indicador animado no tab ativo

Card Interactions:
├── Hover lift (translateY -4px)
├── Scale sutil (1.01)
└── Shadow expansion

Toggle Activation:
├── Glow pulse quando ativa
├── Background color transition
└── Checkmark icon animation
```

### 8. Responsividade Aprimorada

Mobile (< 640px):
```text
- Tabs em scroll horizontal
- Cards full-width
- Toggles em lista vertical
- Forms em coluna unica
- Botoes full-width
- Bottom sheet para dialogs
```

Tablet (640-1024px):
```text
- Grid 2 colunas para toggles
- Tabs visiveis com icones
- Forms em 2 colunas
```

Desktop (> 1024px):
```text
- Grid 3 colunas para toggles
- Sidebar opcional de navegacao rapida
- Preview sticky no AppearanceTab
```

---

## Arquivos a Criar/Modificar

| Arquivo | Acao | Descricao |
|---------|------|-----------|
| `src/components/settings/SettingsHeader.tsx` | Criar | Header 3D com gradiente |
| `src/components/settings/SettingToggleItem.tsx` | Criar | Toggle premium reutilizavel |
| `src/components/settings/SettingCard.tsx` | Criar | Wrapper Card3D para settings |
| `src/components/settings/UnitTab.tsx` | Criar | Tab dados da unidade |
| `src/components/settings/OperationalTab.tsx` | Criar | Tab operacional |
| `src/components/settings/FinancialTab.tsx` | Criar | Tab financeiro |
| `src/components/settings/HoursTab.tsx` | Criar | Tab horarios compacto |
| `src/components/settings/ProfileTab.tsx` | Criar | Tab perfil |
| `src/components/settings/AppearanceTab.tsx` | Modificar | Aprimorar com 3D |
| `src/pages/Settings.tsx` | Modificar | Refatorar para usar componentes |

---

## Resultado Visual Esperado

| Elemento | Antes | Depois |
|----------|-------|--------|
| Header | Texto simples | Gradiente 3D com glow |
| Tabs | Basicos | Animados com indicador |
| Cards | Flat | 3D com sombras em camadas |
| Toggles | Switch simples | Item completo com icone/desc |
| Horarios | 7 linhas identicas | Tabela compacta + copy |
| Forms | Inputs basicos | Icones + mascaras + focus glow |
| Responsivo | Funcional | Otimizado por breakpoint |
| Animacoes | Nenhuma | Transicoes suaves em tudo |

---

## Ordem de Implementacao

1. Criar componentes base (SettingToggleItem, SettingCard, SettingsHeader)
2. Criar tabs individuais (UnitTab, OperationalTab, FinancialTab, HoursTab, ProfileTab)
3. Refatorar Settings.tsx para usar novos componentes
4. Aprimorar AppearanceTab com visual 3D
5. Adicionar animacoes e transicoes
6. Testar responsividade em todos breakpoints
7. Polish final e micro-interacoes
