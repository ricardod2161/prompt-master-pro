

# Correção Definitiva do Código Pix

## Diagnóstico

Analisando os logs, o código Pix gerado é:
```
00020126330014br.gov.bcb.pix011138734543864...
```

Estrutura decodificada:
- Campo 01 dentro de 26: Length=11, Value=38734543864 (CPF correto)
- Chave no banco: `38734543864` (CPF de 11 dígitos)

O código **parece** correto estruturalmente, mas pode haver um problema no CRC16 ou em algum detalhe de formatação.

## Solução

Adicionar **logs de debug** na edge function para identificar exatamente o que está sendo gerado, e depois verificar onde está o erro.

### Arquivo: `supabase/functions/send-order-notification/index.ts`

Adicionar logs antes de gerar o código Pix:

```typescript
// Dentro da função onde gera o pixCode
if (unitSettings?.pix_key && order.total_price > 0) {
  try {
    console.log("PIX DEBUG - Chave original:", unitSettings.pix_key);
    console.log("PIX DEBUG - Tipo detectado:", detectPixKeyType(unitSettings.pix_key));
    console.log("PIX DEBUG - Chave formatada:", formatPixKey(unitSettings.pix_key));
    
    pixCode = generatePixCode(
      unitSettings.pix_key,
      unitSettings.pix_merchant_name || unitInfo?.name || "RESTAURANTE",
      unitSettings.pix_merchant_city || "BRASIL",
      order.total_price,
      `PED${order.order_number}`
    );
    
    console.log("PIX DEBUG - Código gerado:", pixCode);
  } catch (e) {
    console.error("Error generating Pix code:", e);
  }
}
```

### Teste de Validação

Após o deploy, fazer um pedido de teste e verificar nos logs:
1. Qual tipo está sendo detectado (deve ser `cpf`)
2. Como a chave está sendo formatada (deve ser `38734543864` sem `+55`)
3. O código completo gerado

## Resultado Esperado

Com os logs de debug, poderemos identificar exatamente onde está o problema:
- Se o tipo não está sendo detectado como `cpf`
- Se a chave está sendo formatada incorretamente
- Se há algum problema no CRC16

