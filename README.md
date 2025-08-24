Veja a implementação em 

https://psykozis.github.io/QFD/index.html


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



Sistema QFD - Quality Function Deployment
📋 Sobre o Sistema

Este é um sistema web completo para criação e gerenciamento de QFD (Quality Function Deployment), também conhecido como Casa da Qualidade. O sistema foi desenvolvido especificamente para engenheiros de produto, oferecendo uma interface intuitiva e funcionalidades completas para análise QFD.
🚀 Funcionalidades Principais
1. Gerenciamento de Requisitos de Cliente

    Cadastro de requisitos com descrições detalhadas
    Interface intuitiva com validações
    Histórico de criação e modificação
    Exportação de dados

2. Comparação Par a Par (Diagrama de Mudge)

    Matriz de comparação interativa
    Hierarquização automática dos requisitos
    Cálculo de pesos normalizados
    Visualização em tempo real do progresso

3. Gerenciamento de Requisitos de Projeto

    Cadastro de características técnicas mensuráveis
    Definição do sentido de melhoria (↑ Crescente, ↓ Decrescente, * Nominal)
    Avaliação de dificuldade técnica (escala 1-5)
    Validações automáticas

4. Análise de Correlações (Telhado da Casa QFD)

    Matriz de correlação entre requisitos técnicos
    5 níveis de correlação (++, +, 0, -, --)
    Identificação de sinergias e conflitos
    Visualização gráfica das relações

5. Matriz QFD Completa (Casa da Qualidade)

    Relacionamento entre requisitos de cliente e projeto
    3 níveis de influência (1-Fraca, 3-Moderada, 5-Forte)
    Cálculos automáticos:
        Importância Absoluta
        Importância Relativa (ranking)
        Peso Relativo (normalizado)

6. Geração de Relatório PDF

    Relatório profissional completo
    Configurações personalizáveis
    Múltiplas seções opcionais
    Histórico de relatórios gerados
    Análises e insights automáticos

🏗️ Arquitetura do Sistema
Tecnologias Utilizadas

    Frontend: HTML5, CSS3, JavaScript (ES6+)
    Armazenamento: LocalStorage (banco de dados local)
    Geração de PDF: jsPDF + html2canvas
    Design: CSS Grid, Flexbox, Design Responsivo

Estrutura de Arquivos

qfd-system/
├── index.html              # Dashboard principal
├── css/
│   └── style.css           # Estilos globais
├── js/
│   ├── database.js         # Sistema de banco de dados local
│   ├── dashboard.js        # Lógica do dashboard
│   ├── requisitos-cliente.js
│   ├── comparacao-cliente.js
│   ├── requisitos-projeto.js
│   ├── correlacao-projeto.js
│   ├── matriz-qfd.js
│   └── relatorio.js        # Geração de PDF
├── pages/
│   ├── requisitos-cliente.html
│   ├── comparacao-cliente.html
│   ├── requisitos-projeto.html
│   ├── correlacao-projeto.html
│   ├── matriz-qfd.html
│   └── relatorio.html
└── README.md               # Esta documentação

📖 Como Usar
1. Iniciando um Projeto QFD

    Abra o arquivo index.html no navegador
    O dashboard mostrará o progresso atual
    Comece pela primeira etapa: "Requisitos de Cliente"

2. Fluxo de Trabalho Recomendado

    Requisitos de Cliente: Cadastre todas as necessidades dos clientes
    Comparação Cliente: Hierarquize os requisitos por importância
    Requisitos de Projeto: Defina características técnicas mensuráveis
    Correlação Projeto: Analise relações entre requisitos técnicos
    Matriz QFD: Relacione requisitos de cliente com projeto
    Relatório: Gere o documento final em PDF

3. Dicas de Uso
Para Requisitos de Cliente:

    Use a linguagem do cliente
    Seja específico e mensurável quando possível
    Foque no "o que" o cliente quer, não no "como"

Para Requisitos de Projeto:

    Defina características técnicas mensuráveis
    Sempre especifique o sentido de melhoria
    Avalie realisticamente a dificuldade técnica

Para a Matriz QFD:

    Nem todas as células precisam ser preenchidas
    Foque nas relações mais significativas
    Use consistentemente os critérios de avaliação

🔧 Funcionalidades Técnicas
Banco de Dados Local

    Armazenamento persistente no navegador
    Backup e restauração de dados
    Validação de integridade
    Limpeza seletiva de dados

Cálculos Automáticos

    Importância Absoluta: IA(j) = Σ(IC(i) × R(i,j))
    Peso Relativo: PR(j) = IA(j) / Σ(IA)
    Ranking: Ordenação por importância absoluta

Validações

    Campos obrigatórios
    Consistência de dados
    Prevenção de duplicatas
    Verificação de dependências

📊 Relatórios e Análises
Seções Disponíveis no Relatório:

    Resumo Executivo: Visão geral e principais descobertas
    Requisitos de Cliente: Lista completa com pesos e rankings
    Requisitos de Projeto: Características técnicas e dificuldades
    Análise de Correlações: Sinergias e conflitos identificados
    Matriz QFD: Casa da qualidade completa
    Ranking de Prioridades: Requisitos ordenados por importância
    Análises e Insights: Interpretações e recomendações
    Anexos Técnicos: Metodologia e fórmulas utilizadas

Configurações do Relatório:

    Título do projeto personalizável
    Informações da empresa
    Nome do responsável
    Data do relatório
    Descrição do projeto
    Seleção de seções

🔒 Segurança e Privacidade

    Dados Locais: Todos os dados ficam no navegador do usuário
    Sem Servidor: Não há transmissão de dados para servidores externos
    Backup Manual: O usuário controla seus próprios backups
    Limpeza: Dados podem ser removidos completamente

🌐 Compatibilidade
Navegadores Suportados:

    Chrome 80+
    Firefox 75+
    Safari 13+
    Edge 80+

Dispositivos:

    Desktop (recomendado)
    Tablets
    Smartphones (funcionalidade limitada)

🚀 Instalação e Execução
Método 1: Execução Local

    Faça download de todos os arquivos
    Mantenha a estrutura de pastas
    Abra index.html em um navegador moderno
    Comece a usar imediatamente

Método 2: Servidor Web Local

# Se você tem Python instalado:
python -m http.server 8000

# Ou com Node.js:
npx serve .

# Acesse: http://localhost:8000

📈 Exemplos de Uso
Caso de Uso: Desenvolvimento de Produto

    Cliente: Empresa de eletrônicos desenvolvendo um smartphone
    Requisitos de Cliente: Bateria duradoura, câmera de qualidade, preço acessível
    Requisitos Técnicos: Capacidade da bateria (mAh), resolução da câmera (MP), custo de produção ($)
    Resultado: Priorização clara dos aspectos técnicos mais importantes

Caso de Uso: Melhoria de Serviço

    Cliente: Empresa de software melhorando um aplicativo
    Requisitos de Cliente: Interface intuitiva, resposta rápida, alta disponibilidade
    Requisitos Técnicos: Tempo de resposta (ms), uptime (%), complexidade da UI
    Resultado: Roadmap técnico baseado em prioridades dos usuários

🔧 Personalização
Modificando Estilos:

    Edite css/style.css para alterar aparência
    Cores principais definidas em variáveis CSS
    Layout responsivo com CSS Grid e Flexbox

Adicionando Funcionalidades:

    Estrutura modular facilita extensões
    Banco de dados local expansível
    APIs JavaScript bem documentadas

📞 Suporte e Manutenção
Resolução de Problemas Comuns:

Problema: Dados não estão sendo salvos Solução: Verifique se o navegador permite LocalStorage

Problema: PDF não está sendo gerado Solução: Verifique se as bibliotecas jsPDF e html2canvas estão carregadas

Problema: Interface não responsiva Solução: Atualize para um navegador mais recente
Backup de Dados:

    Use a função "Backup" no dashboard
    Salve o arquivo JSON gerado
    Use "Restaurar" para recuperar dados

📝 Metodologia QFD
O que é QFD?

Quality Function Deployment é uma metodologia desenvolvida no Japão para traduzir requisitos de cliente em especificações técnicas de produto.
Benefícios:

    Foco no Cliente: Garante que o produto atenda às necessidades reais
    Priorização: Identifica quais aspectos técnicos são mais importantes
    Comunicação: Facilita o diálogo entre equipes técnicas e comerciais
    Redução de Riscos: Diminui chances de desenvolver características desnecessárias

Processo:

    Voz do Cliente: Captura das necessidades dos clientes
    Tradução Técnica: Conversão em especificações mensuráveis
    Relacionamento: Matriz que conecta necessidades com soluções
    Priorização: Ranking baseado em importância e viabilidade

🎯 Próximos Passos

Após usar este sistema, você terá:

    ✅ Lista priorizada de requisitos técnicos
    ✅ Compreensão clara das necessidades dos clientes
    ✅ Identificação de conflitos e sinergias técnicas
    ✅ Relatório profissional para apresentações
    ✅ Base sólida para tomada de decisões de desenvolvimento

📄 Licença

Este sistema foi desenvolvido para uso em projetos de engenharia de produto. Todos os direitos reservados.

Sistema QFD v1.0 - Desenvolvido para Engenheiros de Produto Transformando necessidades de clientes em especificações técnicas
