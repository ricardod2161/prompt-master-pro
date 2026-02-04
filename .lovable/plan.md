
# Melhorar Exibição do Pix para Cliente

## Problemas Identificados

1. **Exibição do código Pix pouco destacada**: O código "copia e cola" está em uma caixa pequena com texto truncado (`line-clamp-2`), dificultando a visualização e cópia manual

2. **Campos Pix incompletos no banco de dados**: 
   - `pix_key`: `38734543864` (CPF - configurado)
   - `pix_merchant_name`: NULL (usando fallback)
   - `pix_merchant_city`: NULL (usando fallback "BRASIL")

3. **UX de cópia pode ser melhorada**: O botão de copiar funciona, mas o código deveria estar mais visível caso o cliente queira copiar manualmente

## Solução Proposta

### 1. Redesenhar a Seção de Pix na Página de Rastreamento

Melhorar o componente Pix em `src/pages/OrderTracking.tsx`:

- Mostrar o código Pix completo em uma área expandível
- Adicionar destaque visual verde (cor do Pix)
- Mostrar instruções claras de como usar
- Botão de copiar mais proeminente com feedback visual
- Mostrar informações do beneficiário

**Design proposto:**
```
┌────────────────────────────────────────┐
│ 💚 PAGUE COM PIX                       │
│                                        │
│      ┌──────────────────────┐         │
│      │     [QR CODE]        │         │
│      │       180x180        │         │
│      └──────────────────────┘         │
│                                        │
│      Valor: R$ 34,90                   │
│                                        │
│ ┌────────────────────────────────────┐│
│ │ 📋 PIX COPIA E COLA               ││
│ │                                    ││
│ │ 38734543864   ││
│ │ (código completo visível)         ││
│ │                                    ││
│ │      [ Toque para copiar ]        ││
│ └────────────────────────────────────┘│
│                                        │
│ Beneficiário: SABOR & ARTE            │
│ Chave: 387.345.438-64                 │
└────────────────────────────────────────┘
```

### 2. Melhorar a Área de Código Copia e Cola

- **Remover o `line-clamp-2`** que trunca o código
- **Área clicável** que copia ao toque
- **Feedback visual** ao copiar (animação + toast)
- **Fundo destacado** em verde claro
- **Mostrar código completo** com scroll horizontal se necessário

### 3. Adicionar Informações do Beneficiário

Mostrar para dar confiança ao cliente:
- Nome do beneficiário (do `pix_merchant_name` ou nome da unidade)
- Chave Pix formatada (CPF formatado: 387.345.438-64)

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/OrderTracking.tsx` | Redesenhar seção de Pix com destaque, código visível e área clicável |

## Resultado Esperado

O cliente verá:
1. QR Code grande e claro para escanear
2. Código Pix completo e visível para copiar
3. Área clicável que copia automaticamente
4. Informações do beneficiário para confiança
5. Feedback visual confirmando a cópia

## Detalhes Técnicos

A implementação usará:
- Botão/área clicável com `onClick` que copia para clipboard
- `navigator.clipboard.writeText()` para cópia
- `navigator.vibrate()` para feedback háptico
- `toast.success()` para confirmação visual
- Componente `ScrollArea` horizontal para códigos longos
- Função `formatPixKeyForDisplay()` já existente para formatar a chave
