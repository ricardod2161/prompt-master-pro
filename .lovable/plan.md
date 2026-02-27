
## Plan

### 1. Feature comparison table on `/pricing`
Add a detailed comparison table below the pricing cards showing all features per tier (rows = features, columns = Starter / Pro / Enterprise). Highlight the user's current plan column with a ring/color. Show the Trial badge in the column header when applicable.

Features to compare:
- PDV completo
- Cardápio Digital
- KDS
- Módulo Delivery
- Integração WhatsApp
- Relatórios avançados
- API personalizada
- Número de unidades
- Suporte

**File:** `src/pages/Pricing.tsx` — add a `<ComparisonTable>` section after the pricing cards grid.

### 2. SubscriptionGate on protected pages
Wrap the page content of Delivery, WhatsApp (Settings + Chat), and Reports with `<SubscriptionGate requiredTier="pro">`. The existing `SubscriptionGate` component already handles the locked UI and upgrade modal.

**Files:**
- `src/pages/Delivery.tsx` — wrap return content
- `src/pages/Reports.tsx` — wrap return content
- `src/pages/WhatsAppSettings.tsx` — wrap return content
- `src/pages/WhatsAppChat.tsx` — wrap return content

### 3. Pass `isTrialing`/`trialEnd` to PricingCard for column badge
Update `PricingCard` props to accept optional `isTrialing` and show "Trial ativo" chip in the "Seu Plano" badge when applicable.

**File:** `src/components/subscription/PricingCard.tsx`
