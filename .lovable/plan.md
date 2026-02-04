
# Plano de Comercialização e Aplicativo Instalável

## Status: ✅ IMPLEMENTADO

---

## Implementações Concluídas

### ✅ Fase 1: Segurança
- [x] Adicionada coluna `tracking_token` para rastreamento seguro de pedidos
- [x] Trigger automático para gerar tokens em pedidos de mesa
- [x] Função `is_valid_order_access()` para validação de acesso
- [x] Política RLS restritiva para update de mesas
- [x] Limite de 5 unidades por usuário (trigger `check_unit_limit`)

### ✅ Fase 2: Compliance
- [x] Página `/privacy` - Política de Privacidade (LGPD)
- [x] Página `/terms` - Termos de Uso
- [x] Meta tags OG atualizadas no index.html
- [x] Meta tags Twitter Card
- [x] Tags PWA (theme-color, apple-mobile-web-app)

### ✅ Fase 3: PWA
- [x] `vite-plugin-pwa` instalado e configurado
- [x] Manifest com nome, descrição, cores
- [x] Service Worker com cache de API Supabase
- [x] Ícones: `pwa-512x512.png`, `apple-touch-icon.png`
- [x] Página `/install` com instruções para Android, iOS e Desktop

### ✅ Fase 4: Capacitor
- [x] Dependências instaladas: @capacitor/core, @capacitor/cli, @capacitor/android, @capacitor/ios
- [x] `capacitor.config.ts` configurado com:
  - appId: `app.lovable.faae96baaf6c4264be661a79bc2fe650`
  - appName: `RestaurantOS`
  - Hot-reload via sandbox URL

---

## Próximos Passos do Usuário

### Para PWA (Imediato):
1. **Publicar o app** clicando em "Publish"
2. **Testar instalação** acessando pelo celular e seguindo instruções em `/install`

### Para Play Store:
1. **Criar conta** Google Play Developer ($25 único): https://play.google.com/console
2. **Exportar para GitHub** via botão "Export to GitHub"
3. **Clonar e instalar dependências**:
   ```bash
   git clone <seu-repo>
   cd <seu-repo>
   npm install
   ```
4. **Adicionar plataforma Android**:
   ```bash
   npx cap add android
   ```
5. **Build e sincronizar**:
   ```bash
   npm run build
   npx cap sync
   ```
6. **Abrir no Android Studio**:
   ```bash
   npx cap open android
   ```
7. **Gerar AAB assinado**: Build → Generate Signed Bundle/APK
8. **Submeter para revisão** no Google Play Console

### Assets Necessários para Play Store:
| Item | Tamanho | Status |
|------|---------|--------|
| Ícone hi-res | 512x512 | ✅ `/public/pwa-512x512.png` |
| Feature graphic | 1024x500 | ⏳ Criar |
| Screenshots celular | 1080x1920 | ⏳ Capturar |
| Screenshots tablet | 1200x1920 | ⏳ Capturar |
| Descrição curta | 80 chars | ⏳ Redigir |
| Descrição longa | 4000 chars | ⏳ Redigir |
| Política de Privacidade | URL | ✅ `/privacy` |

---

## Arquivos Criados/Modificados

```
public/
├── pwa-512x512.png          (novo)
├── apple-touch-icon.png     (novo)

src/pages/
├── Privacy.tsx              (novo)
├── Terms.tsx                (novo)
├── Install.tsx              (novo)

capacitor.config.ts          (novo)
vite.config.ts               (atualizado - PWA plugin)
index.html                   (atualizado - meta tags)
src/App.tsx                  (atualizado - rotas)
```

---

## Configuração Final

### vite.config.ts (PWA)
```typescript
VitePWA({
  registerType: "autoUpdate",
  manifest: {
    name: "RestaurantOS",
    short_name: "RestaurantOS",
    display: "standalone",
    theme_color: "#000000"
  }
})
```

### capacitor.config.ts
```typescript
{
  appId: 'app.lovable.faae96baaf6c4264be661a79bc2fe650',
  appName: 'RestaurantOS',
  webDir: 'dist',
  server: {
    url: 'https://faae96ba-af6c-4264-be66-1a79bc2fe650.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
}
```
