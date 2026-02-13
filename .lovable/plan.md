
# Pix Integrado na Interface da Mesa e WhatsApp

## Contexto
Atualmente o codigo Pix "copia e cola" ja e enviado via WhatsApp nas notificacoes (confirmacao de pedido, fechamento de conta, pagamento parcial). Porem, **na interface visual** do cardapio digital (mesa), o codigo Pix nao aparece em nenhum momento para o cliente.

O objetivo e: quando o cliente escolher "Pix" como forma de pagamento, exibir o QR Code e o codigo copia-e-cola diretamente na tela, tanto no checkout quanto no sheet da conta da mesa.

---

## O que sera feito

### 1. Buscar configuracao Pix da unidade no CustomerOrder
- Criar uma query no `useCustomerOrder.ts` que busca `pix_key`, `pix_merchant_name` e `pix_merchant_city` da tabela `unit_settings` usando o `unit_id` da mesa
- Retornar esses dados para uso nos componentes

### 2. Mostrar Pix no PaymentMethodSelector quando "Pix" for selecionado
- Quando o cliente selecionar "Pix", exibir abaixo das opcoes:
  - QR Code do Pix (usando `qrcode.react` que ja esta instalado)
  - Codigo copia-e-cola completo com botao "Copiar"
  - Valor total do pedido formatado
- Usar `generatePixCode()` do `src/lib/pix-generator.ts` para gerar o codigo EMV
- Design em tons de esmeralda, consistente com a pagina de tracking

### 3. Mostrar Pix no TableBillSheet ao fechar conta
- Adicionar secao de Pix no footer do TableBillSheet, visivel quando a unidade tem `pix_key` configurada
- Exibir QR Code + codigo copia-e-cola para o valor total da conta
- Botao "Copiar Pix" com feedback visual e haptico

### 4. Mostrar Pix no SplitBillSheet (pagamento parcial)
- Quando o cliente divide a conta e seleciona seu valor, gerar Pix para o valor parcial
- Mesmo padrao visual do TableBillSheet

---

## Arquivos a modificar

| Arquivo | Alteracao |
|---|---|
| `src/hooks/useCustomerOrder.ts` | Adicionar query de `unit_settings` para buscar dados Pix |
| `src/components/customer-order/PaymentMethodSelector.tsx` | Exibir QR Code + codigo quando Pix selecionado |
| `src/components/customer-order/TableBillSheet.tsx` | Secao de Pix com QR Code no footer |
| `src/components/customer-order/SplitBillSheet.tsx` | Pix para valor parcial |

### Nenhuma alteracao no backend
O WhatsApp ja envia o codigo Pix corretamente. As mudancas sao puramente no frontend.

---

## Detalhes Tecnicos

### Geracao do codigo Pix no frontend
Reutilizar `generatePixCode()` de `src/lib/pix-generator.ts` que ja esta implementado e testado:

```text
import { generatePixCode } from "@/lib/pix-generator";
import { QRCodeSVG } from "qrcode.react";

const pixCode = generatePixCode({
  pixKey: unitSettings.pix_key,
  merchantName: unitSettings.pix_merchant_name || "RESTAURANTE",
  merchantCity: unitSettings.pix_merchant_city || "BRASIL",
  amount: totalValue,
  transactionId: `PED${orderNumber}`,
});
```

### Componente de Pix reutilizavel
Criar um componente `PixPaymentCard` que recebe `pixCode`, `amount` e renderiza:
- QR Code SVG (200x200)
- Codigo copia-e-cola em area clicavel
- Botao "Copiar" com feedback
- Valor formatado em destaque

### Fluxo de dados
- `useCustomerOrder` busca `unit_settings` ao carregar a mesa
- Se `pix_key` existe, passa para `PaymentMethodSelector` e `TableBillSheet`
- Cada componente gera o codigo Pix localmente com o valor correto (carrinho, conta total, ou valor parcial)
