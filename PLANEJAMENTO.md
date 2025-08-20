# Sistema QFD - Planejamento Técnico

## Visão Geral
Sistema web para criação de QFD (Quality Function Deployment) com banco de dados local usando LocalStorage.

## Estrutura de Páginas

### 1. Página Principal (index.html)
- Dashboard com navegação para todas as páginas
- Resumo do progresso atual
- Links para cada etapa do processo QFD

### 2. Requisitos de Cliente (requisitos-cliente.html)
- Formulário para entrada de requisitos
- Lista de requisitos já cadastrados
- Botão salvar para persistir no LocalStorage
- Permitir múltiplas entradas

### 3. Comparação Par a Par - Diagrama de Mudge (comparacao-cliente.html)
- Matriz de comparação entre requisitos de cliente
- Escala de importância: 1 (pouco), 3 (médio), 5 (muito)
- Cálculo automático de hierarquização
- Valores normalizados
- Visualização em diagrama de Mudge

### 4. Requisitos de Projeto (requisitos-projeto.html)
- Formulário para entrada de requisitos de projeto
- Seleção do sentido de melhoria:
  - ↑ (crescente)
  - ↓ (decrescente)
  - * (sem direção)
- Lista de requisitos cadastrados

### 5. Correlação entre Requisitos de Projeto (correlacao-projeto.html)
- Matriz de correlação (telhado da casa QFD)
- Níveis de correlação:
  - ++ (positiva muito forte)
  - + (positiva)
  - 0 (sem correlação)
  - - (negativa)
  - -- (negativa muito forte)
- Visualização em formato de telhado

### 6. Matriz QFD Principal (matriz-qfd.html)
- Matriz completa relacionando requisitos de cliente x projeto
- Escala de influência: 1 (pouca), 3 (média), 5 (muita)
- Cálculos automáticos:
  - Importância absoluta
  - Importância relativa
  - Peso relativo (normalizado)
- Visualização completa da casa QFD

### 7. Relatório PDF (relatorio.html)
- Geração de PDF com QFD completo
- Formatação profissional para engenheiros

## Esquema do Banco de Dados Local (LocalStorage)

```javascript
// Estrutura dos dados no LocalStorage
{
  "requisitosCliente": [
    {
      "id": "uuid",
      "descricao": "string",
      "importancia": number, // calculado na comparação
      "peso": number // normalizado
    }
  ],
  "requisitosProjeto": [
    {
      "id": "uuid",
      "descricao": "string",
      "sentidoMelhoria": "up|down|none", // ↑|↓|*
      "dificuldadeTecnica": number,
      "importanciaAbsoluta": number,
      "importanciaRelativa": number,
      "pesoRelativo": number
    }
  ],
  "comparacaoCliente": [
    {
      "requisito1": "uuid",
      "requisito2": "uuid",
      "valor": number // 1, 3 ou 5
    }
  ],
  "correlacaoProjeto": [
    {
      "requisito1": "uuid",
      "requisito2": "uuid",
      "correlacao": string // "++", "+", "0", "-", "--"
    }
  ],
  "matrizQFD": [
    {
      "requisitoCliente": "uuid",
      "requisitoProjeto": "uuid",
      "influencia": number // 1, 3 ou 5
    }
  ]
}
```

## Tecnologias Utilizadas
- HTML5 + CSS3 + JavaScript vanilla
- LocalStorage para persistência
- jsPDF para geração de PDF
- Chart.js para visualizações (se necessário)

## Fluxo de Navegação
1. Dashboard → Requisitos Cliente
2. Requisitos Cliente → Comparação Par a Par
3. Comparação → Requisitos Projeto
4. Requisitos Projeto → Correlação Projeto
5. Correlação → Matriz QFD
6. Matriz QFD → Relatório PDF

## Funcionalidades Especiais
- Cálculos automáticos de normalização
- Validações de entrada
- Persistência automática
- Interface responsiva
- Geração de PDF profissional

