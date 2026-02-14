

## Atualizar Template de Churrascaria com Descrição Real

### Contexto

Com base no print do cardápio da "Churrascaria Dedé / Santo Antonio", o negócio é uma churrascaria tradicional que trabalha com cardápio do dia no estilo marmita/prato feito, com acompanhamentos variados e proteínas assadas na brasa.

### Mudança

**Arquivo:** `src/components/settings/ai-prompt/BusinessTemplates.tsx`

Atualizar o objeto `churrascaria` (linhas 25-31) com:

- **businessDescription**: "Churrascaria tradicional com cardápio do dia completo, incluindo acompanhamentos variados como feijoada, feijão mexido, arroz de leite, arroz refogado, baião, macarrão, farofa de farinha, maionese, vinagrete, batata doce, salada verde e fruta. Proteínas assadas na brasa: boi, porco, frango, linguiça e filé de peixe frito. Servimos marmitas e pratos feitos com foco em comida caseira de qualidade. Atendemos no salão, delivery e retirada no balcão."
- **specialRules**: "Cardápio do dia muda diariamente. Proteínas sujeitas à disponibilidade. Marmitas com acompanhamentos fixos do dia, cliente escolhe a proteína. Pedido mínimo para delivery sob consulta."

