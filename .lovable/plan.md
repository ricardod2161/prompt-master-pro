
# Adicionar Relogio em Tempo Real ao Sistema

## Visao Geral

Sera criado um componente de relogio em tempo real elegante e profissional, integrado ao header do AppLayout, exibindo hora, minutos, segundos e a data atual. O componente seguira o design system existente com glassmorphismo e animacoes suaves.

---

## Componente a Criar

### `src/components/layout/LiveClock.tsx`

Relogio em tempo real com:
- Exibicao de hora:minuto:segundo
- Data atual formatada em portugues
- Atualizacao a cada segundo via useEffect
- Icone de relogio animado
- Design glassmorphism sutil
- Responsividade (oculta detalhes em mobile)
- Tooltip com data completa

**Funcionalidades:**
- useState para armazenar hora atual
- useEffect com setInterval de 1 segundo
- Limpeza do interval no cleanup
- Formatacao com date-fns em pt-BR
- Animacao sutil nos segundos

---

## Arquivo a Modificar

### `src/components/layout/AppLayout.tsx`

Adicionar o LiveClock no header entre o titulo da pagina e os botoes de acao:

```text
+------------------------------------------------------------------+
| [Menu] | Titulo da Pagina    [RELOGIO]    [Sino] [Badge Plano]  |
+------------------------------------------------------------------+
```

**Posicionamento:**
- Centralizado no header em desktop
- Compacto em tablet/mobile
- Flexbox com gap adequado

---

## Design Visual

### Layout do Relogio

```text
Desktop:
+----------------------------------------+
| [Icone] 14:32:45 | Domingo, 02 de Fev   |
+----------------------------------------+

Mobile:
+----------------+
| [Icone] 14:32  |
+----------------+
```

### Estilizacao

- Background: `bg-background/50` com borda sutil
- Icone: Clock do lucide-react com animacao pulse nos segundos
- Tipografia: font-mono para numeros alinhados
- Transicoes suaves ao atualizar
- Glassmorphism consistente com o sistema

### Responsividade

```text
Mobile (< 640px):
- Mostra apenas hora:minuto
- Oculta segundos e data
- Tamanho compacto

Tablet (640px - 1024px):
- Mostra hora:minuto:segundo
- Oculta data por extenso

Desktop (> 1024px):
- Exibe tudo: hora completa + data
- Layout horizontal expandido
```

---

## Codigo Exemplo

```typescript
// Estado e efeito
const [currentTime, setCurrentTime] = useState(new Date());

useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);
  
  return () => clearInterval(timer);
}, []);

// Formatacao
const timeString = format(currentTime, "HH:mm:ss");
const dateString = format(currentTime, "EEEE, dd 'de' MMM", { locale: ptBR });
```

---

## Beneficios

1. **Utilidade**: Usuarios sempre sabem a hora atual sem sair do sistema
2. **Profissionalismo**: Elemento comum em sistemas empresariais
3. **Design**: Segue padrao visual existente
4. **Performance**: Atualiza apenas o necessario a cada segundo
5. **Responsividade**: Adapta-se a qualquer dispositivo

---

## Arquivos Envolvidos

| Arquivo | Acao |
|---------|------|
| `src/components/layout/LiveClock.tsx` | Criar |
| `src/components/layout/AppLayout.tsx` | Modificar |

---

## Proximos Passos

1. Criar componente LiveClock com useState/useEffect
2. Implementar formatacao de data/hora em pt-BR
3. Adicionar responsividade com classes Tailwind
4. Integrar no AppLayout header
5. Testar em diferentes tamanhos de tela
