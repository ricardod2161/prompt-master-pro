

# Correção da Formatação do Cardápio WhatsApp

## Problema Identificado

O cardápio está sendo enviado com formatação incorreta comparado à imagem de referência:

| Atual | Esperado (Imagem) |
|-------|-------------------|
| Welcome em mensagem separada | Welcome + 1ª categoria juntos |
| Emoji `🔸` nos itens | Emoji `🔶` nos itens |
| Linha curta `────────────` | Linha longa `────────────────────────────────────────` |
| Sem linha no topo das mensagens | Linha no topo de cada mensagem adicional |
| Sem linhas em branco entre seções | Linhas em branco para espaçamento |

---

## Estrutura Exata da Imagem

```text
[MENSAGEM 1 - Welcome + Primeira Categoria]
✨ BEM-VINDO AO RESTAURANTE SÃO FRANCISCO ✨
────────────────────────────────────────

🍹 BEBIDAS
────────────────────────────────────────

🔶 Suco de Abacate - R$ 10,00
🔶 Suco de Manga - R$ 10,00

[MENSAGEM 2 - Categorias Subsequentes]
────────────────────────────────────────
🍽️ PRATOS FEITOS
────────────────────────────────────────

🔶 Feijão Carioca - R$ 20,00

[MENSAGEM FINAL]
────────────────────────────────────────
💬 O que você gostaria de pedir?
```

---

## Alteração Técnica

### Arquivo: `supabase/functions/whatsapp-webhook/index.ts`

#### Função `listarCardapio()` - Nova implementação:

```typescript
async function listarCardapio(supabase: any, unitId: string): Promise<{ type: 'multiple'; messages: string[] }> {
  // ... fetch products ...
  
  // Linha horizontal padrão (40 caracteres)
  const LINE = "────────────────────────────────────────";
  
  // Group by category
  const categoryEntries = Object.entries(byCategory);
  const messages: string[] = [];
  
  // PRIMEIRA MENSAGEM: Welcome + Primeira Categoria juntos
  if (categoryEntries.length > 0) {
    const [firstCategory, firstItems] = categoryEntries[0];
    const firstEmoji = getCategoryEmoji(firstCategory);
    
    let firstMsg = `✨ *BEM-VINDO AO NOSSO CARDÁPIO* ✨\n${LINE}\n\n`;
    firstMsg += `${firstEmoji} *${firstCategory.toUpperCase()}*\n${LINE}\n\n`;
    
    for (const item of firstItems) {
      const price = item.delivery_price || item.price;
      firstMsg += `🔶 ${item.name} - R$ ${price.toFixed(2).replace(".", ",")}\n`;
    }
    
    messages.push(firstMsg.trim());
  }
  
  // MENSAGENS SUBSEQUENTES: Cada categoria adicional
  for (let i = 1; i < categoryEntries.length; i++) {
    const [category, items] = categoryEntries[i];
    const emoji = getCategoryEmoji(category);
    
    // Começa com linha no topo
    let categoryMsg = `${LINE}\n${emoji} *${category.toUpperCase()}*\n${LINE}\n\n`;
    
    for (const item of items) {
      const price = item.delivery_price || item.price;
      categoryMsg += `🔶 ${item.name} - R$ ${price.toFixed(2).replace(".", ",")}\n`;
    }
    
    messages.push(categoryMsg.trim());
  }
  
  // MENSAGEM FINAL: Pergunta com linha no topo
  messages.push(`${LINE}\n💬 O que você gostaria de pedir?`);
  
  return { type: 'multiple', messages };
}
```

---

## Resumo das Mudanças

| Item | De | Para |
|------|-----|------|
| Emoji dos itens | `🔸` | `🔶` |
| Linha horizontal | `────────────` (12 chars) | `────────────────────────────────────────` (40 chars) |
| Welcome | Mensagem separada | Combinado com 1ª categoria |
| Categorias 2+ | Sem linha no topo | Linha no topo + categoria + linha |
| Mensagem final | `💬 O que você...` | `LINE + 💬 O que você...` |
| Espaçamento | Sem linhas em branco | Linhas em branco entre seções |

---

## Resultado Visual Esperado

Exatamente como na imagem de referência:

```
[Mensagem 1]
✨ BEM-VINDO AO NOSSO CARDÁPIO ✨
────────────────────────────────────────

🍹 BEBIDAS
────────────────────────────────────────

🔶 Suco de Abacate - R$ 10,00
🔶 Suco de Manga - R$ 10,00

[Mensagem 2]
────────────────────────────────────────
🍽️ PRATOS FEITOS
────────────────────────────────────────

🔶 Feijão Carioca - R$ 20,00

[Mensagem 3]
────────────────────────────────────────
💬 O que você gostaria de pedir?
```

