
# Plano: Criar Logotipo Futurista para RestaurantOS

## Objetivo
Gerar um logotipo moderno, futurista e único para o RestaurantOS usando IA de geração de imagens.

## Conceito do Logo
Um símbolo que combine:
- **Restaurante**: Elementos de gastronomia (garfo/faca estilizado, prato, chef hat)
- **Tecnologia**: Visual futurista, linhas geométricas, gradientes neon
- **OS (Sistema)**: Círculos concêntricos, conexões digitais

**Estilo**: Minimalista, gradiente em tons de laranja/dourado (cor primária do app), fundo transparente, bordas suaves.

## Arquivos a Atualizar

| Arquivo | Uso |
|---------|-----|
| `src/assets/logo.png` | Logo principal no app |
| `public/logo.png` | Favicon e referências gerais |
| `public/pwa-512x512.png` | Ícone PWA (512x512) |
| `public/apple-touch-icon.png` | Ícone Apple Touch |
| `public/favicon.ico` | Favicon do navegador |

## Implementação Técnica

### 1. Criar Componente de Geração de Logo
Usar a API Lovable AI (google/gemini-2.5-flash-image) para gerar o logotipo:

```typescript
// Prompt para geração
"Create a futuristic restaurant management system logo. 
Modern minimalist design with geometric shapes. 
A stylized fork and knife forming a circular tech symbol. 
Gradient colors: orange to gold (#F97316 to #EAB308). 
Clean lines, no text, transparent background, suitable for app icon.
High quality, professional, unique design."
```

### 2. Criar Página/Ferramenta de Geração
Uma interface simples para:
- Gerar múltiplas opções de logo
- Visualizar em diferentes tamanhos
- Escolher e salvar a preferida

### 3. Atualizar Arquivos de Ícones
Após escolher o logo, atualizar todos os arquivos de ícone do projeto.

## Fluxo de Trabalho

```text
1. Criar componente de geração de logo
2. Gerar 3-4 opções diferentes
3. Você escolhe a que mais gostar
4. Exportar em todos os tamanhos necessários
5. Atualizar os arquivos do projeto
```

## Resultado Esperado
Um logotipo único, futurista e profissional que represente o RestaurantOS como um sistema moderno de gestão para restaurantes. essa imagem seja em 3D.
