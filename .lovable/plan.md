

## Objetivo
Adicionar a licença MIT ao projeto com o nome **Paulo Ricardo Dantas de Lima** e ano **2026**, conforme texto enviado pelo usuário.

---

## O que será feito

### 1. Criar arquivo `LICENSE` na raiz do projeto
Arquivo texto padrão MIT com os dados fornecidos:

```
MIT License

Copyright (c) 2026 Paulo Ricardo Dantas de Lima

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 2. Atualizar `README.md` — seção Licença
Substituir o texto genérico `"Este projeto está sob a licença MIT."` por uma referência completa com nome do autor e link para o arquivo `LICENSE`:

```markdown
## 📄 Licença

MIT License — Copyright (c) 2026 **Paulo Ricardo Dantas de Lima**

Consulte o arquivo [LICENSE](./LICENSE) para os termos completos.
```

### 3. Atualizar rodapé `LandingFooter.tsx`
O rodapé atualmente exibe:
```
© 2026 RestaurantOS. Todos os direitos reservados.
```
Atualizar para incluir o nome do autor:
```
© 2026 Paulo Ricardo Dantas de Lima — RestaurantOS. Todos os direitos reservados.
```

### 4. Atualizar `src/pages/Login.tsx`
O rodapé da tela de login exibe o mesmo copyright. Aplicar a mesma atualização.

---

## Arquivos modificados
| Arquivo | Ação |
|---|---|
| `LICENSE` | **Criar** — arquivo MIT padrão |
| `README.md` | Atualizar seção Licença (linha 211-213) |
| `src/components/landing/LandingFooter.tsx` | Atualizar copyright no rodapé |
| `src/pages/Login.tsx` | Atualizar copyright no rodapé |

## O que NÃO muda
- `Terms.tsx` — refere-se ao serviço RestaurantOS, não à licença do código-fonte
- `Privacy.tsx` — idem
- Qualquer lógica de negócio ou componente de UI

