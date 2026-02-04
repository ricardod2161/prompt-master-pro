
# Plano de Comercialização e Aplicativo Instalável

## 1. Resumo Executivo

O RestaurantOS está **90% pronto** para comercialização. Identifiquei alguns ajustes de segurança críticos e melhorias necessárias antes do lançamento. Após isso, implementaremos o PWA (app instalável) e prepararemos para a Play Store.

---

## 2. Análise de Prontidão Comercial

### Pontos Fortes (O que já está funcionando)

| Módulo | Status | Observação |
|--------|--------|------------|
| PDV (Ponto de Venda) | OK | Completo e funcional |
| KDS (Cozinha) | OK | Fluxo de preparo operacional |
| Cardápio Digital + QR Code | OK | Pedidos via mesa funcionando |
| Sistema de Assinaturas | OK | 3 planos Stripe integrados |
| WhatsApp Bot | OK | Notificações configuradas |
| Dashboard Analytics | OK | Métricas em tempo real |
| Controle de Caixa | OK | Abertura/fechamento |
| Delivery | OK | Gestão de entregadores |
| Estoque | OK | Controle de produtos |
| Multi-unidade | OK | Suporte a múltiplas lojas |

### Problemas de Segurança a Corrigir

**Críticos (Bloqueia Comercialização)**:

1. **Dados de pedidos públicos** - Clientes podem ver pedidos de outras pessoas
   - Tabela `orders` permite SELECT público com dados sensíveis (telefones, nomes)
   - **Solução**: Restringir acesso apenas a usuários autenticados da unidade

2. **Qualquer pessoa pode criar pedidos falsos** - Sem validação no QR Code
   - **Solução**: Implementar validação de sessão/token para pedidos

3. **Mesas podem ser manipuladas** - Status pode ser alterado por qualquer um
   - **Solução**: Restringir UPDATE apenas para sessões de pedido válidas

**Médios (Recomendado antes do lançamento)**:

4. **Credenciais WhatsApp expostas** - View pública pode mostrar tokens
5. **Criação ilimitada de unidades** - Usuários podem criar muitas unidades

### Melhorias de UX Recomendadas

1. **Meta tags incompletas** - OG tags ainda com valores padrão do Lovable
2. **Política de privacidade** - Necessária para LGPD e Play Store
3. **Termos de uso** - Exigido para comercialização

---

## 3. Transformação em App Instalável (PWA)

### O que será implementado

```text
+-------------------+     +------------------+     +------------------+
|   NAVEGADOR       | --> |   INSTALAÇÃO     | --> |   APP NATIVO     |
|                   |     |   (PWA)          |     |   (Aparência)    |
+-------------------+     +------------------+     +------------------+
|  Acessa pelo URL  |     |  Add to Home     |     |  Ícone na tela   |
|  restaurantos.app |     |  Screen prompt   |     |  Abre fullscreen |
|                   |     |  Works offline   |     |  Splash screen   |
+-------------------+     +------------------+     +------------------+
```

### Componentes PWA

1. **Manifest.json** - Define nome, ícones, cores do app
2. **Service Worker** - Cache para funcionamento offline
3. **Ícones** - Múltiplos tamanhos para iOS/Android
4. **Splash screens** - Tela de carregamento personalizada
5. **Página /install** - Guia de instalação para usuários

### Configuração Técnica

```text
vite.config.ts
├── vite-plugin-pwa (nova dependência)
├── manifest configuration
├── service worker registration
└── workbox caching strategies

public/
├── pwa-192x192.png
├── pwa-512x512.png
├── apple-touch-icon.png
└── maskable-icon.png

src/pages/
└── Install.tsx (nova página de instalação)
```

---

## 4. Preparação para Play Store (Capacitor)

### Requisitos da Google Play

| Requisito | Status | Ação |
|-----------|--------|------|
| APK/AAB assinado | Pendente | Capacitor build |
| Política de Privacidade | Pendente | Criar página |
| Ícone 512x512 | Pendente | Criar asset |
| Screenshots | Pendente | Capturar do app |
| Descrição da loja | Pendente | Redigir textos |
| Classificação etária | Pendente | Formulário Google |

### Arquitetura Capacitor

```text
RestaurantOS/
├── src/                    # Código React existente
├── public/                 # Assets PWA
├── capacitor.config.ts     # Configuração Capacitor
├── android/                # Projeto Android Studio
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   └── res/        # Ícones Android
│   │   └── build.gradle
│   └── ...
└── ios/                    # Projeto Xcode (opcional)
```

### Dependências a Instalar

- @capacitor/core
- @capacitor/cli
- @capacitor/android
- @capacitor/ios (opcional)

---

## 5. Etapas de Implementação

### Fase 1: Segurança (Prioridade Máxima)
1. Corrigir RLS da tabela `orders` - restringir SELECT
2. Adicionar validação de sessão para pedidos QR Code
3. Proteger UPDATE da tabela `tables`
4. Verificar view `whatsapp_settings_public`

### Fase 2: Compliance
5. Criar página de Política de Privacidade
6. Criar página de Termos de Uso
7. Atualizar meta tags do index.html

### Fase 3: PWA
8. Instalar e configurar vite-plugin-pwa
9. Criar ícones em múltiplos tamanhos
10. Configurar manifest.json
11. Implementar service worker
12. Criar página /install com instruções

### Fase 4: Capacitor (Para Play Store)
13. Instalar dependências Capacitor
14. Configurar capacitor.config.ts
15. Gerar projeto Android
16. Criar assets para a loja
17. Build e testes locais

---

## 6. Próximos Passos (Ação do Usuário)

Após a implementação, você precisará:

1. **Para PWA**: Publicar o app e testar instalação no celular
2. **Para Play Store**:
   - Criar conta Google Play Developer ($25 único)
   - Exportar projeto para GitHub
   - Rodar `npm install` localmente
   - Executar `npx cap add android`
   - Abrir no Android Studio
   - Gerar AAB assinado
   - Submeter para revisão

---

## 7. Seção Técnica

### Políticas RLS Propostas

```sql
-- Restringir orders para usuários autenticados da unidade
DROP POLICY IF EXISTS "Public can read orders" ON public.orders;
CREATE POLICY "Unit members can view orders"
ON public.orders FOR SELECT
USING (
  has_unit_access(auth.uid(), unit_id) 
  OR id = (SELECT order_id FROM current_order_session())
);

-- Pedidos públicos apenas para rastreamento por ID específico
CREATE POLICY "Public can track own order"
ON public.orders FOR SELECT
TO public
USING (
  id::text = current_setting('app.current_order_id', true)
);
```

### Configuração PWA (vite.config.ts)

```typescript
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'RestaurantOS',
        short_name: 'RestaurantOS',
        description: 'Sistema de Gestão para Restaurantes',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [...]
      }
    })
  ]
})
```

### Capacitor Config

```typescript
const config: CapacitorConfig = {
  appId: 'com.restaurantos.app',
  appName: 'RestaurantOS',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};
```

