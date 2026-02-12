

# Melhorias Profissionais na Gestao de Mesas

## Bugs Encontrados e Correcoes

| Bug | Descricao | Correcao |
|---|---|---|
| Warning React Refs | `Function components cannot be given refs` em `CreateTablesDialog` e `Tables` | Envolver componentes internos com `React.forwardRef` ou reestruturar o Dialog |
| Type cast desnecessario | `(table as any).capacity` usado no TableCard, mas `capacity` ja existe no tipo `Tables<"tables">` | Remover o cast e usar `table.capacity` diretamente |
| "Ver Pedido" so mostra toast | Clicar em "Ver" no pedido ativo apenas exibe um toast com o total, sem nenhuma acao util | Navegar para a pagina de pedidos ou abrir um modal com detalhes completos |
| Batch creation multiple toasts | Criar mesas em lote dispara N toasts individuais + 1 final | Silenciar toasts individuais durante criacao em lote |
| tableOrders sobrescreve | O Map de pedidos por mesa so guarda o ultimo pedido, ignorando multiplos pedidos ativos na mesma mesa | Guardar array de pedidos ou mostrar contagem total |

## Melhorias de Funcionalidade

### 1. Card de Mesa Mais Inteligente
- Mostrar receita total da mesa (soma de todos pedidos ativos) alem do pedido individual
- Exibir contagem de pedidos ativos quando houver mais de 1
- Adicionar indicador visual de capacidade (icone de pessoas com numero)
- Campo de capacidade no dialog de criacao de mesa (atualmente hardcoded em 4)

### 2. Acoes Rapidas Melhoradas
- **"Ver Pedidos"**: Abrir um Sheet/modal com a lista completa de pedidos da mesa (reutilizando o `TableBillSheet` do lado admin)
- **"Fechar Conta"**: Botao direto no card para fechar a conta da mesa sem precisar navegar
- **"Novo Pedido"**: Botao para criar pedido direto pelo POS vinculado a mesa

### 3. Metricas Mais Inteligentes
- Adicionar metrica de **Receita Total** (soma de todos pedidos ativos em mesas ocupadas)
- Adicionar metrica de **Tempo Medio de Ocupacao**
- Animacao de contagem nos numeros das metricas

### 4. Criacao de Mesas com Capacidade
- Adicionar campo de capacidade no `CreateTablesDialog` (single e batch)
- Capacidade padrao configuravel (atualmente fixo em 4)

### 5. Filtro e Ordenacao Avancados
- Opcao de ordenar por: numero, status, tempo de ocupacao, receita
- Indicador visual no filtro mostrando quantos resultados existem

### 6. Realtime mais confiavel
- Usar `refetchQueries` em vez de `invalidateQueries` no hook `useTables` para garantir atualizacao imediata (seguindo o padrao ja usado em `useOrders`)

## Arquivos a Serem Modificados

| Arquivo | Alteracao |
|---|---|
| `src/pages/Tables.tsx` | Corrigir bugs de refs, melhorar TableCard (receita, multi-pedidos), melhorar CreateTablesDialog (campo capacidade), melhorar metricas (receita total, tempo medio), melhorar acoes (ver pedidos reais, fechar conta), adicionar ordenacao |
| `src/hooks/useTables.ts` | Trocar `invalidateQueries` por `refetchQueries` para sincronizacao confiavel, silenciar toast em batch |

## Detalhes Tecnicos

### TableCard Melhorado
- Remover `(table as any).capacity` e usar `table.capacity` direto
- Receber `activeOrders: Order[]` (array) em vez de `activeOrder` (singular)
- Exibir soma de receita de todos pedidos ativos
- Badge com contagem de pedidos quando > 1

### CreateTablesDialog com Capacidade
```text
+---------------------------+
| Criar Mesas               |
|  [Mesa Unica] [Em Lote]   |
|                           |
|  Numero: [___]            |
|  Capacidade: [4] pessoas  |
|                           |
|  [Cancelar]  [Criar Mesa] |
+---------------------------+
```

### Metricas com Receita
```text
+----------+----------+----------+----------+----------+
|  Total   |  Livres  | Ocupadas | Aguard.  | Receita  |
|   12     |    5     |    6     |    1     | R$450,00 |
+----------+----------+----------+----------+----------+
```

### Acoes do Card - "Ver Pedidos"
Em vez de mostrar apenas um toast, o botao "Ver" abrira o `TableBillSheet` existente diretamente do lado admin, permitindo ao funcionario ver todos os pedidos da mesa, o total, e fechar a conta se necessario.

### Ordenacao
Adicionar um Select ao lado do filtro de status:
- Por numero (padrao)
- Por status (livres primeiro ou ocupadas primeiro)
- Por tempo de ocupacao (mais antigas primeiro)
- Por receita (maior primeiro)

