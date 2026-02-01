
# Plano: Integrar auto_print_enabled no usePrintOrder

## Objetivo

Modificar o hook `usePrintOrder` para consultar a configuracao `auto_print_enabled` da tabela `unit_settings` antes de executar a impressao automatica quando o pedido muda para status "Preparando".

---

## Mudancas Necessarias

### Arquivo: `src/hooks/usePrintOrder.ts`

**Alteracoes:**

1. Importar o hook `useUnitSettings` para acessar as configuracoes da unidade

2. Modificar a funcao `printOnPreparing` para verificar `auto_print_enabled` antes de imprimir:
   - Se `auto_print_enabled === true`: executa a impressao automatica
   - Se `auto_print_enabled === false`: nao faz nada (silenciosamente ignora)

3. A funcao `printKitchenTicket` permanece inalterada pois e usada para impressao manual (quando o usuario clica no botao de imprimir)

---

## Logica de Funcionamento

```text
Fluxo atual:
  Status muda para "Preparando"
  └── printOnPreparing()
      └── printKitchenTicket() <- sempre imprime

Novo fluxo:
  Status muda para "Preparando"
  └── printOnPreparing()
      ├── Verifica auto_print_enabled
      │   ├── true  -> printKitchenTicket()
      │   └── false -> return (nao imprime)
```

---

## Codigo Proposto

```typescript
import { useUnitSettings } from "@/hooks/useUnitSettings";

export function usePrintOrder() {
  const { settings } = useUnitSettings();
  
  const printKitchenTicket = useCallback(async (order: Order, showToast = true) => {
    // ... codigo existente (sem alteracoes)
  }, []);
  
  const printOnPreparing = useCallback(async (
    order: Order, 
    newStatus: string, 
    previousStatus: string | null
  ) => {
    // Verifica se impressao automatica esta habilitada
    // Se settings nao existir, assume true (comportamento padrao)
    const autoPrintEnabled = settings?.auto_print_enabled ?? true;
    
    if (!autoPrintEnabled) {
      return; // Impressao automatica desabilitada
    }
    
    if (newStatus === "preparing" && previousStatus !== "preparing") {
      await printKitchenTicket(order, true);
    }
  }, [printKitchenTicket, settings?.auto_print_enabled]);
  
  return {
    printKitchenTicket,
    printOnPreparing,
  };
}
```

---

## Comportamento Esperado

| Cenario | auto_print_enabled | Resultado |
|---------|-------------------|-----------|
| Pedido muda para "Preparando" | true | Imprime comanda automaticamente |
| Pedido muda para "Preparando" | false | Nao imprime (silencioso) |
| Pedido muda para "Preparando" | null/undefined | Imprime (valor padrao = true) |
| Usuario clica "Imprimir" | qualquer | Sempre imprime (manual) |

---

## Secao Tecnica

### Dependencias do useCallback

A dependencia `settings?.auto_print_enabled` sera adicionada ao array de dependencias do `useCallback` para garantir que a funcao seja recriada quando a configuracao mudar.

### Fallback para Valor Padrao

Usando o operador nullish coalescing (`??`) para definir `true` como valor padrao quando:
- As configuracoes ainda nao foram carregadas
- As configuracoes nao existem para a unidade
- O campo `auto_print_enabled` e `null`

Isso garante que o comportamento padrao seja imprimir automaticamente, mantendo compatibilidade retroativa.
