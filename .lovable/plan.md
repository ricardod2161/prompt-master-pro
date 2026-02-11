

# Adicionar Imagens e Ativar Loja Shopify

## 1. Adicionar Imagens aos Produtos

Vamos usar o logo do RestaurantOS (`public/logo.png`) como imagem para os 3 produtos digitais na Shopify. Isso dara uma aparencia mais profissional a loja.

- **RestaurantOS Starter** (ID: 8180183105590) -- adicionar logo.png
- **RestaurantOS Pro** (ID: 8180183302198) -- adicionar logo.png
- **RestaurantOS Enterprise** (ID: 8180183892022) -- adicionar logo.png

## 2. Ativar a Loja (Claim Store)

Apos adicionar as imagens, vamos ativar a loja Shopify usando o "Claim Store". Isso inicia o periodo de **30 dias gratis** do Shopify.

**Importante**: Apos os 30 dias, sera necessario um plano pago do Shopify para continuar vendendo.

## Resumo das Acoes

1. Atualizar os 3 produtos com a imagem do logo
2. Executar o Claim da loja para iniciar o trial de 30 dias

---

### Detalhes Tecnicos

- Usar `shopify--update_shopify_product` para cada produto com `images: [{ file_path: "public/logo.png", alt: "RestaurantOS" }]`
- Usar `shopify--claim_shopify_store` para ativar a loja

