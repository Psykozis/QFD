# Análise e Documentação do Código - Sistema QFD

*Atualizado em setembro de 2026.*

## 📋 Visão Geral do Sistema

O Sistema QFD (Quality Function Deployment) é uma aplicação web para gerenciar projetos de desenvolvimento de produtos usando a metodologia QFD. Ele traduz necessidades do cliente em características técnicas através de uma série de etapas estruturadas. Roda inteiramente no navegador, sem servidor nem build: HTML, CSS e JavaScript puro, com os dados no LocalStorage.

Publicado em: https://marlonsigales.github.io/QFD/index.html

## 🏗️ Arquitetura do Sistema

### Estrutura de Arquivos

```
QFD/
├── index.html                   # Dashboard
├── js/
│   ├── database.js              # Persistência (LocalStorage), migrações, importação/exportação
│   ├── utils.js                 # Funções compartilhadas por todas as páginas
│   ├── dashboard.js             # Página principal com progresso e backup automático
│   ├── requisitos-cliente.js    # Requisitos do cliente
│   ├── comparacao-cliente.js    # Diagrama de Mudge (hierarquização)
│   ├── requisitos-projeto.js    # Requisitos técnicos
│   ├── correlacao-projeto.js    # Telhado QFD (correlações)
│   ├── matriz-qfd.js            # Matriz principal QFD
│   ├── especificacoes.js        # Quadro de especificações
│   └── relatorio.js             # Relatório e PDF
├── pages/                       # Uma página HTML por etapa
├── css/style.css                # Estilos
└── tests/                       # Testes automatizados
```

Toda página carrega `database.js` → `utils.js` → script da página. Cada script de página só vê as próprias funções mais as globais desses dois arquivos.

## 📚 Explicação dos Módulos Principais

### 1. `database.js` - Camada de Persistência

**Responsabilidade:** toda a leitura e gravação de dados, através da instância global `qfdDB`.

**Estrutura de Dados** (chave `qfd_data`; detalhes no [README](README.md#estrutura-dos-dados)):
- `requisitosCliente`, `requisitosProjeto`: requisitos, com `observacao` (texto explicativo)
- `comparacaoCliente`: comparações pareadas (Diagrama de Mudge)
- `correlacaoProjeto`: correlações entre requisitos técnicos
- `matrizQFD`: relações cliente ↔ projeto
- `especificacoesProjeto`: unidade, valor, texto explicativo e aspectos indesejáveis por requisito de projeto
- `metadata`: criação, modificação e `schemaVersion`

**Funcionalidades Principais:**
- CRUD para todos os tipos de dados
- Cálculo de importância e pesos
- **Versionamento:** `SCHEMA_VERSION` + `SCHEMA_MIGRATIONS` atualizam dados antigos ao carregar ou importar
- **Recuperação de erros:** dados ilegíveis são copiados para `qfd_data_corrompido` e restaurados do backup automático; armazenamento cheio gera aviso ao usuário
- Detecção de requisitos duplicados (`findRequisitoDuplicado`)
- Exportação/importação JSON (com validação) e CSV (`importRequisitosCSV`)
- Validação de integridade (`validateData`)

### 2. `utils.js` - Funções Compartilhadas

**Responsabilidade:** código usado por várias páginas, que antes estava copiado em até 6 arquivos.
- Menu de navegação: ativado automaticamente em todas as páginas
- `escapeHtml`, `escapeAttr` (para atributos como `data-tooltip`), `truncateText`, `formatDate`
- `getSentidoSymbol`, `getSentidoLabel`
- `showAlert`, `downloadFile`, `autoResizeTextarea`
- `parseCSV`, `csvCell`

### 3. `dashboard.js` - Painel de Controle

**Responsabilidade:** exibe o progresso geral do projeto.
- Cards de progresso para cada etapa, atualizados a cada 5 segundos
- Backup automático em `qfd_backup` a cada salvamento, e restauração

### 4. `requisitos-cliente.js` - Requisitos do Cliente

- Cadastro, edição inline e exclusão (individual ou em massa)
- Texto explicativo opcional
- Validações: 10 a 300 caracteres, sem duplicados
- Exportação CSV

### 5. `requisitos-projeto.js` - Requisitos Técnicos

- Sentido de melhoria: Crescente (↑), Decrescente (↓), Nominal (*)
- Dificuldade técnica: escala de 1 a 5
- Texto explicativo e as mesmas validações dos requisitos de cliente

### 6. `comparacao-cliente.js` - Diagrama de Mudge

- Compara requisitos dois a dois: 1 (pouco), 3 (médio), 5 (muito mais importante)
- Calcula a pontuação de cada requisito e normaliza os pesos (somam 1)
- Balões com a descrição e o texto explicativo de cada requisito

### 7. `correlacao-projeto.js` - Telhado QFD

**Tipos de Correlação:**
- `++`: sinergia muito forte
- `+`: sinergia moderada
- `0`: independentes (não é gravado)
- `-`: competem entre si
- `--`: conflitantes (alimentam os aspectos indesejáveis das especificações)

**Extras:** análise de conflitos e sinergias, exportação.

### 8. `matriz-qfd.js` - Casa da Qualidade

**Valores de Influência:** 0 (nenhuma, não é gravado), 1 (fraca), 3 (moderada), 9 (forte).

**Cálculos:**
- Importância absoluta de projeto = Σ (influência × peso do requisito de cliente)
- Peso relativo normalizado e ranking

### 9. `especificacoes.js` - Quadro de Especificações

- Requisitos de projeto na ordem do QFD, divididos em terços
- Unidade, valor unitário, texto explicativo e aspectos indesejáveis, salvos ao sair de cada campo
- Aspectos indesejáveis recalculados a partir das correlações `--`, exceto os editados manualmente (`aspectosAutoGerado`)

### 10. `relatorio.js` - Relatório

- Seções configuráveis: dicionário, resumo, requisitos, telhado, correlações, matriz, especificações, comparações, ranking, análises, anexos
- Prévia com balões (descrição e textos explicativos) e geração de PDF com jsPDF + html2canvas

## 🧪 Testes

`tests/testes.js` tem 35 testes (utilitários, banco de dados, migrações, erros, CSV e as 8 páginas). Rodar com `tests\rodar-testes.ps1` (Chrome/Edge headless). Ver o [README](README.md#testes).

## 🔍 Pontos de Melhoria

| # | Item | Status |
|---|------|--------|
| 1 | Tratamento de erros | ✅ Feito: dados corrompidos, armazenamento cheio, importações inválidas |
| 2 | Validação de dados | ✅ Feito: duplicados, limites de tamanho, backups e CSV validados |
| 3 | Performance: `location.reload()` a cada comparação salva no Diagrama de Mudge e após importações | ⏳ Pendente: a página inteira recarrega a cada comparação |
| 4 | Código duplicado | ✅ Feito: `utils.js`. Restam as funções de balão (`showTooltip`/`hideTooltip`), que ainda diferem por página |
| 5 | Lógica de comparação confusa em `getComparacaoCliente()` | ⏳ Pendente |
| 6 | Limite do LocalStorage (~5 MB) | ✅ Aviso de armazenamento cheio. IndexedDB **não recomendado**: um QFD típico ocupa poucas dezenas de KB |
| 7 | Acessibilidade (ARIA, teclado) | ⏸️ Baixa prioridade para o uso atual |
| 8 | Testes automatizados | ✅ Feito: `tests/` |
| 9 | Documentação JSDoc | 🔶 Parcial: funções novas documentadas |
| 10 | Segurança (XSS) | ✅ Textos do usuário escapados em HTML e atributos; testado com aspas e `<tag>` |
| 11 | Responsividade | ⏳ Pendente: matrizes limitadas em celular |
| 12 | Versionamento de dados | ✅ Feito: `schemaVersion` + migrações |
| 13 | CSS duplicado (`.nav-dropdown`, `.dropdown-menu`, `.qfd-tooltip` definidos duas vezes) e estilos injetados via JS | ⏳ Pendente |

## ✅ Pontos Fortes do Código

1. **Organização clara:** um módulo por etapa, com persistência e utilitários compartilhados
2. **Comentários em português**
3. **Fluxo QFD completo**, do cliente às especificações e ao relatório
4. **Funciona offline**, sem servidor
5. **Dados protegidos:** versionamento, backup automático e recuperação de erros
6. **Testes automatizados** cobrindo lógica e páginas

## 📊 Fluxo de Dados

```
1. Requisitos Cliente
   ↓
2. Comparação Cliente (Diagrama de Mudge)
   ↓ (calcula importância e pesos)
3. Requisitos Projeto
   ↓
4. Correlação Projeto (Telhado QFD)
   ↓
5. Matriz QFD (relaciona cliente ↔ projeto)
   ↓ (calcula importância de projeto)
6. Especificações (ordem do QFD + conflitos -- do telhado)
   ↓
7. Relatório PDF
```

## 🎯 Próximas Recomendações

Ver [todo.md](todo.md) e [QFD QA.txt](QFD%20QA.txt).
