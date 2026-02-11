
# Criar Marmitas Completas e Melhorar o Cardapio

## O que sera feito

### 1. Criar Categoria "Marmitas" no banco de dados
- Nova categoria dedicada para marmitas completas

### 2. Criar Produtos de Marmita (uma por proteina)
Cada marmita inclui todos os acompanhamentos fixos, o cliente so escolhe a carne:

| Produto | Descricao (acompanhamentos inclusos) | Preco Sugerido |
|---------|---------------------------------------|----------------|
| Marmita de Frango Cozido | Feijao carioca, feijao mexido, arroz de leite, arroz refogado, arroz solto, baiao, macarrao, farofa de farinha, maionese, vinagrete, batata doce, salada verde, fruta | R$ 20,00 |
| Marmita de Boi Assado | Mesmos acompanhamentos | R$ 25,00 |
| Marmita de Porco Assado | Mesmos acompanhamentos | R$ 22,00 |
| Marmita de Frango Assado | Mesmos acompanhamentos | R$ 22,00 |
| Marmita de Linguica Assada | Mesmos acompanhamentos | R$ 20,00 |
| Marmita Mista (2 carnes) | Mesmos acompanhamentos - escolha 2 proteinas | R$ 28,00 |

### 3. Reorganizar categorias dos produtos existentes
- Mover "Prato Feito" para a categoria "Refeicao"
- Vincular sobremesas (Brownie, Petit Gateau, Pudim, Acai, Doces de Caju) a categoria "Sobremesas"

### 4. Melhorar a pagina de Cardapio (Menu.tsx)
Tornar a interface mais profissional e responsiva:
- **Cards visuais** em grid responsivo em vez de tabela simples
- **Design mobile-first** com cards empilhaveis
- **Badges de categoria** com cores distintas
- **Toggle de disponibilidade** mais visivel
- **Secao de categorias** com contagem de produtos
- **Precos destacados** com formatacao visual

## Resumo dos Arquivos Alterados

| Arquivo | Alteracao |
|---------|-----------|
| Migracao SQL | Criar categoria "Marmitas", inserir 6 produtos de marmita, reorganizar categorias dos produtos existentes |
| `src/pages/Menu.tsx` | Redesign completo com layout em cards responsivos, visual profissional mobile-first |

---

### Detalhes Tecnicos

**Migracao SQL**:
- INSERT na tabela `categories` com nome "Marmitas" e sort_order 0 (primeira posicao)
- INSERT de 6 produtos na tabela `products` vinculados a nova categoria, com descricao detalhada dos acompanhamentos
- UPDATE dos produtos existentes sem categoria para vincular as categorias corretas (Sobremesas, Refeicao)

**Menu.tsx - Redesign**:
- Substituir `Table` por grid de `Card` responsivo (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)
- Cada card mostra: nome, descricao, preco, badge da categoria, toggle de disponibilidade e botoes de acao
- Secao de filtros com chips de categoria clicaveis
- Empty state melhorado
- Manter toda a logica CRUD existente (dialogs de produto e categoria)
