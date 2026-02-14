
## Corrigir Footer da Landing Page

### Problemas Identificados

1. **Links "Legal" nao funcionam**: Os links de "Privacidade", "Termos de Uso", "Cookies" e "LGPD" apontam para `#` (nao fazem nada). As paginas `/privacy` e `/terms` ja existem no sistema mas nao estao linkadas.

2. **Links "Empresa" e "Suporte" nao funcionam**: Todos apontam para `#` sem acao. Como nao existem paginas para eles, devem rolar ate secoes existentes na landing ou ser removidos/desabilitados.

3. **Layout mobile**: A coluna de marca (logo + contato) ocupa `col-span-2` no mobile, empurrando as 4 colunas de links para baixo de forma desorganizada. O grid `grid-cols-2` no mobile faz "Legal" cair sozinho numa segunda linha.

4. **Scroll suave nao funciona para links `#`**: O `scrollToSection` tenta fazer `querySelector("#")` que retorna o proprio documento, nao uma secao.

### Solucao

**Arquivo: `src/components/landing/LandingFooter.tsx`**

1. **Corrigir links legais** -- apontar Privacidade para `/privacy`, Termos de Uso para `/terms`. Cookies e LGPD podem apontar para `/privacy` (secao 7 e secao 5 respectivamente) ou ficar como `#` com cursor disabled.

2. **Corrigir links de navegacao** -- mapear links de Suporte para secoes da landing:
   - "Central de Ajuda" -> `#faq`
   - "Contato" -> `#contact`
   - "Documentacao" -> `#how-it-works`

3. **Usar `<Link>` para rotas internas** -- substituir `<button>` por `<Link to="/privacy">` nos links que apontam para paginas reais.

4. **Melhorar grid mobile** -- alterar para `grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6` e ajustar a coluna de marca para nao ocupar todo o espaco no mobile. Reduzir o `col-span` da coluna brand no mobile para `col-span-2` e garantir que as 4 colunas de links fiquem organizadas em grid 2x2 no mobile.

5. **Proteger `scrollToSection`** -- ignorar `href="#"` puro (sem ID) para evitar comportamento inesperado.

### Detalhes Tecnicos

**Links atualizados:**
```typescript
legal: [
  { label: "Privacidade", href: "/privacy", route: true },
  { label: "Termos de Uso", href: "/terms", route: true },
  { label: "Cookies", href: "/privacy", route: true },
  { label: "LGPD", href: "/privacy", route: true },
],
suporte: [
  { label: "Central de Ajuda", href: "#faq" },
  { label: "Documentação", href: "#how-it-works" },
  { label: "Status do Sistema", href: "#" },
  { label: "Contato", href: "#contact" },
],
```

**Renderizacao condicional:** Links com `route: true` usam `<Link to={href}>`, links com `href.startsWith("#")` e `href !== "#"` usam `scrollToSection`, e links com `href === "#"` ficam com `cursor-default opacity-50` (desabilitados visualmente).

**Grid responsivo melhorado:**
- Mobile: coluna brand full-width, depois links em grid 2x2
- Tablet: 3 colunas
- Desktop: 6 colunas (2 brand + 4 links)

### Resultado
- Links de Privacidade e Termos navegam para paginas reais
- Links de FAQ e Contato rolam suavemente ate as secoes
- Links sem destino ficam visualmente desabilitados
- Layout mobile organizado e profissional
