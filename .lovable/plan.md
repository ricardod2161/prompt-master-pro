
# Cardapio Profissional - Melhorias Completas

## Situacao Atual

A pagina de Cardapio (`Menu.tsx`) e funcional mas basica:
- Cards de produto simples sem imagem
- Sem metricas/dashboard do cardapio
- Sem upload de imagem de produto (o campo `image_url` existe no banco mas nao e usado no admin)
- Sem ordenacao de produtos
- Busca simples sem destaque nos resultados
- Sem confirmacao visual de exclusao (usa `confirm()` nativo do browser)
- Formulario de produto sem upload de foto
- Sem indicador de produtos indisponiveis vs disponiveis nas metricas
- Sem drag-and-drop ou reordenacao de categorias

## Melhorias Planejadas

### 1. Dashboard de Metricas do Cardapio
Adicionar cards de estatisticas no topo:
- Total de produtos
- Produtos disponiveis vs indisponiveis
- Total de categorias
- Preco medio dos produtos

Usar o componente `StatCard` ja existente no projeto.

### 2. Upload de Imagem de Produto
- Criar bucket `product-images` no storage
- Adicionar campo de upload no dialog de criacao/edicao de produto
- Preview da imagem antes de salvar
- Remover imagem antiga ao substituir
- Exibir imagem no `ProductCard` quando disponivel

### 3. ProductCard Melhorado
- Exibir imagem do produto (quando existir) com aspect-ratio e lazy loading
- Placeholder visual quando nao tem imagem (icone do tipo de produto)
- Animacao de entrada (fade-in-up escalonado)
- Usar `Card3D` em vez de `Card` simples para consistencia visual com o resto do sistema
- Badge de "Indisponivel" mais visivel quando o produto esta desativado

### 4. Ordenacao e Filtros Avancados
- Select de ordenacao: por nome (A-Z, Z-A), por preco (maior/menor), por data de criacao
- Indicador de quantos resultados filtrados aparecem
- Limpar filtros com um clique

### 5. Dialog de Exclusao Profissional
- Substituir `confirm()` nativo por `AlertDialog` do Radix UI
- Mensagem clara com nome do produto/categoria sendo excluido

### 6. Formulario de Produto Melhorado
- Campo de upload de imagem com preview
- Layout mais organizado com secoes visuais
- Validacao visual nos campos obrigatorios

### 7. CategoryChips Melhorado
- ScrollArea horizontal para muitas categorias
- Animacao de transicao ao selecionar
- Tooltip mostrando descricao da categoria ao passar o mouse

## Arquivos a Serem Modificados/Criados

| Arquivo | Alteracao |
|---|---|
| `src/pages/Menu.tsx` | Adicionar metricas, ordenacao, AlertDialog de exclusao, upload de imagem no form, melhorar layout geral |
| `src/components/menu/ProductCard.tsx` | Adicionar suporte a imagem, usar Card3D, animacao de entrada, badge de indisponivel melhorado |
| `src/components/menu/CategoryChips.tsx` | ScrollArea horizontal, tooltips |

## Detalhes Tecnicos

### Storage Bucket
Criar bucket `product-images` via migracao SQL com politicas publicas de leitura e escrita autenticada.

### Upload de Imagem
Reutilizar o padrao ja usado em `LogoUpload.tsx`:
```text
1. Selecionar arquivo (accept: image/*)
2. Upload para storage bucket "product-images"
3. Obter URL publica
4. Salvar URL no campo image_url do produto
```

### Metricas (topo da pagina)
```text
+------------+------------+------------+------------+
| Produtos   | Disponiveis| Categorias | Preco Medio|
|    24      |   20/24    |     6      |  R$ 32,50  |
+------------+------------+------------+------------+
```

### Ordenacao
Adicionar um Select ao lado da busca:
- Nome (A-Z) - padrao
- Nome (Z-A)
- Preco (menor)
- Preco (maior)
- Mais recentes

### ProductCard com Imagem
```text
+---------------------------+
| [  IMAGEM DO PRODUTO    ] |
| [  ou placeholder       ] |
|                           |
| Nome do Produto    [ON/OFF]|
| [Categoria]               |
| Descricao curta...        |
|                           |
| R$ 29,90   Delivery R$35 |
| 15 min   [Editar][Excluir]|
+---------------------------+
```

### AlertDialog de Exclusao
Substituir o `confirm()` por AlertDialog do shadcn/radix:
- Titulo: "Excluir Produto"
- Descricao: "Tem certeza que deseja excluir 'X-Burger'? Esta acao nao pode ser desfeita."
- Botoes: "Cancelar" e "Excluir" (vermelho)
