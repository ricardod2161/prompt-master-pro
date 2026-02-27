
## Análise do estado atual

O sistema já tem:
- `AccessOverrideDialog` com toggle liberar/bloquear + plano + duração
- Edge function `admin-access-override` com actions `grant` e `revoke`
- `AdminCustomersList` com botão Shield para abrir o dialog

### Problemas identificados:

1. **Visual confuso**: O toggle "Liberar Acesso" desativa e o botão "Salvar" revoga — não fica claro. O usuário precisa de botões explícitos: "Bloquear Acesso", "Liberar Acesso", "Adicionar X dias"
2. **Falta opção de "adicionar mais dias"** ao override já existente (sem resetar tudo)
3. **A lista de clientes não mostra o status de acesso claramente** — precisa mostrar: bloqueado, acesso trial ativo (com dias restantes), sem override, com assinatura
4. **Não existe ação "extend_trial"** na edge function — adicionar dias ao override existente

### Solução

**1. Melhorar `AccessOverrideDialog`:**
- Substituir toggle ambíguo por 3 seções claras:
  - "Acesso Atual" — status visual (bloqueado/ativo/indefinido com dias restantes)
  - Botões de ação rápida: "+ 7 dias", "+ 14 dias", "+ 30 dias" 
  - Seção "Configurar Acesso" com plano, duração personalizada, notas
  - Botão vermelho explícito "Bloquear Acesso" quando tem override ativo
  - Botão verde "Liberar Acesso" quando não tem

**2. Adicionar action `extend` na edge function:**
```typescript
if (action === "extend") {
  // Pega o override ativo e adiciona N dias à data de expiração
  const existing = await serviceClient.from("access_overrides")
    .select().eq("user_id", user_id).eq("is_active", true).maybeSingle();
  
  const currentExpiry = existing?.expires_at ? new Date(existing.expires_at) : new Date();
  const newExpiry = new Date(currentExpiry.getTime() + days * 86400000);
  
  await serviceClient.from("access_overrides")
    .update({ expires_at: newExpiry.toISOString() })
    .eq("id", existing.id);
}
```

**3. Melhorar card de cliente na lista** — mostrar badge colorido:
- 🔴 "Bloqueado" — quando não tem override e sem assinatura  
- 🟡 "Trial X dias" — override com data de expiração
- 🟢 "Pro Indefinido" — override sem expiração
- Sem badge — sem informação de acesso

### Arquivos modificados:
| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/admin-access-override/index.ts` | Adicionar action `extend` para adicionar dias ao override existente |
| `src/components/admin/AccessOverrideDialog.tsx` | UI completa: status visual, botões rápidos +7/+14/+30 dias, ações claras |
| `src/components/admin/AdminCustomersList.tsx` | Melhorar exibição do status de acesso nos cards |
