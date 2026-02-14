
## Verificar e Melhorar o Formulario de Contato

### Status Atual
O formulario de contato esta funcional (tabela `leads` existe no banco, campos correspondem, RLS permite insercao anonima). Porem, existem melhorias de responsividade e profissionalismo a aplicar.

### Problemas Identificados

1. **Mobile**: Os campos "Nome completo" e "Email" empilham em coluna unica no mobile, mas no desktop desktop (screenshots do usuario) ficam lado a lado -- isso ja funciona via `sm:grid-cols-2`. Porem, o espacamento e padding podem ser otimizados para mobile.

2. **Botao WhatsApp flutuante**: Sobrepoe o botao "Enviar Mensagem" e o seletor de funcionarios no mobile, dificultando a interacao.

3. **Mascara de telefone**: O campo WhatsApp nao tem mascara de input, permitindo entrada de dados inconsistentes.

4. **Validacao**: Falta validacao de email no frontend (alem do `type="email"`) e limite de caracteres nos campos.

5. **Animacao de loading**: O estado "Enviando..." e apenas texto, sem indicador visual de loading.

### Solucao

**Arquivo: `src/components/landing/ContactFormSection.tsx`**
- Adicionar validacao com Zod para nome (max 100 chars), email (formato valido, max 255), telefone (formato brasileiro), mensagem (max 1000 chars)
- Adicionar mascara de telefone brasileira `(00) 00000-0000` com formatacao automatica
- Melhorar o botao de submit com icone de loading (spinner) durante envio
- Ajustar padding mobile: `p-4 sm:p-6 md:p-8` no card do formulario
- Reduzir `py-24` para `py-16 md:py-24` no mobile
- Reduzir `mb-16` do header para `mb-10 md:mb-16`

**Arquivo: `src/components/landing/FloatingWhatsApp.tsx`**
- Mover o botao flutuante para `bottom-20 sm:bottom-6` no mobile para nao sobrepor o conteudo do formulario
- Ou adicionar `mb-20` ao formulario para dar espaco

**Resultado**:
- Formulario completamente funcional e validado
- Layout responsivo otimizado para mobile
- Mascara de telefone profissional
- Loading visual durante envio
- Sem sobreposicao do botao WhatsApp

### Detalhes Tecnicos

Validacao Zod:
```typescript
const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().optional(),
  restaurant_name: z.string().max(100).optional(),
  employee_count: z.string().optional(),
  message: z.string().max(1000).optional(),
});
```

Mascara de telefone:
```typescript
const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
};
```
