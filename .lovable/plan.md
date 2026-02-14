
## Correção: Pix não é enviado - configuração na unidade errada

### Problema
A chave Pix e os dados do beneficiário estão configurados na unidade "Restaurante Demo" (00000000-0000-0000-0000-000000000001), mas os pedidos reais estão sendo feitos pela unidade "Churascaria Santo Antonio" (3367e7c0-f8b3-4c87-9a92-996c7d36c37f), que tem todos os campos Pix como NULL.

Dados encontrados:
- **Restaurante Demo**: pix_key=38734543864, nome=PAULO RICARDO DANTAS DE L, cidade=ALEXANDRIA
- **Churascaria Santo Antonio**: pix_key=NULL, pix_merchant_name=NULL, pix_merchant_city=NULL

### Solução
Atualizar a tabela `unit_settings` da Churascaria Santo Antonio com os dados Pix corretos:

```sql
UPDATE unit_settings
SET
  pix_key = '38734543864',
  pix_merchant_name = 'PAULO RICARDO DANTAS DE L',
  pix_merchant_city = 'ALEXANDRIA'
WHERE unit_id = '3367e7c0-f8b3-4c87-9a92-996c7d36c37f';
```

### Resultado Esperado
Após a atualização, quando um cliente fizer um pedido via WhatsApp com pagamento Pix, o código EMV será gerado corretamente com os dados do beneficiário e enviado na mensagem de confirmação.

Nenhuma alteração de código é necessária - o código do webhook já está correto, apenas os dados estavam faltando na unidade errada.
