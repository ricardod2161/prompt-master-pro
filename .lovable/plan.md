
# Melhorias na Gestão de Mesas e QR Codes Funcionais

## Problema Identificado
O QR Code atual **não funciona** porque mostra apenas um ícone decorativo (`<QrCode />` do Lucide) em vez de um QR Code real e escaneável. Os clientes não conseguem escanear para fazer pedidos.

---

## Alterações Necessárias

### 1. Instalar Biblioteca de QR Code
```bash
npm install qrcode.react
```
Essa biblioteca gera QR Codes reais e escaneáveis.

---

### 2. Refatorar QRCodeDialog (src/pages/Tables.tsx)

**Problemas atuais:**
- Mostra ícone fake de QR (linhas 514-517)
- Download gera SVG estático sem QR real
- Visual básico

**Solução - Novo QRCodeDialog profissional:**

```text
┌─────────────────────────────────────────────────────────┐
│            🎯 QR Code - Mesa 1                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│          ┌─────────────────────┐                        │
│          │   ██▀▀▀▀▀▀▀██       │                        │
│          │   ██ █ █ ███       │  ← QR Code REAL        │
│          │   ██ ███████       │    (escaneável)        │
│          │   ██ █ █ ███       │                        │
│          │   ██▄▄▄▄▄▄▄██       │                        │
│          └─────────────────────┘                        │
│                  Mesa 1                                 │
│          Escaneie para fazer pedido                     │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  🔗 https://app.../order/uuid-mesa                      │
│                                                         │
│  [ 📋 Copiar ]  [ 🌐 Abrir ]  [ 📥 Baixar ]  [ 🖨 Print ]│
└─────────────────────────────────────────────────────────┘
```

**Recursos novos:**
- QR Code real usando `qrcode.react`
- Botão de imprimir ticket com QR
- Design glassmorphism elegante
- Download em PNG de alta qualidade
- Preview visual profissional

---

### 3. Criar Componente de Ticket Imprimível

Novo componente para impressão profissional:

```text
┌────────────────────┐
│    🍽️ LOGO         │
│                    │
│   ┌──────────┐     │
│   │  QR CODE │     │
│   │  REAL    │     │
│   └──────────┘     │
│                    │
│     MESA 1         │
│                    │
│  Escaneie e faça   │
│    seu pedido!     │
│                    │
│  ─────────────────  │
│  restaurante.app   │
└────────────────────┘
```

---

### 4. Melhorias Visuais nos Cards de Mesa

**Antes:** Cards simples
**Depois:** Cards com glassmorphism, animações sutis e indicadores visuais

Melhorias:
- Gradientes premium nos status
- Sombras em múltiplas camadas (3D)
- Animação de pulse sutil em mesas aguardando
- Ícone de QR mais destacado
- Hover effects elegantes

---

### 5. Melhorias na Função de Download

**Atual:** Download de SVG fake
**Novo:** Download de PNG real com QR Code funcional

```typescript
// Usar canvas para gerar PNG de alta qualidade
const canvas = document.getElementById('qr-canvas');
const dataUrl = canvas.toDataURL('image/png');
// Download automático
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `package.json` | Adicionar `qrcode.react` |
| `src/pages/Tables.tsx` | Refatorar QRCodeDialog com QR real, melhorar cards, adicionar impressão |

---

## Estrutura do Novo QRCodeDialog

```typescript
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

function QRCodeDialog({ ... }) {
  // QR Code real usando a biblioteca
  <QRCodeSVG 
    value={qrCode}
    size={200}
    level="H"          // Alta correção de erro
    includeMargin={true}
  />
  
  // Canvas oculto para download PNG
  <QRCodeCanvas
    id="qr-canvas"
    value={qrCode}
    size={400}
    style={{ display: 'none' }}
  />
}
```

---

## Resultado Esperado

1. ✅ QR Codes funcionais e escaneáveis
2. ✅ Clientes podem fazer pedidos via celular
3. ✅ Download em PNG de alta qualidade
4. ✅ Impressão de tickets profissionais
5. ✅ Design elegante e responsivo
6. ✅ Rota `/order/:tableId` funcionando corretamente

---

## Fluxo do Cliente

```text
Cliente escaneia QR → Abre /order/{tableId} → Vê cardápio → Faz pedido → KDS recebe
```

