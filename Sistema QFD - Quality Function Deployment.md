# Sistema QFD - Quality Function Deployment

## 📋 Sobre o Sistema

Este é um sistema web completo para criação e gerenciamento de QFD (Quality Function Deployment), também conhecido como Casa da Qualidade. O sistema foi desenvolvido especificamente para engenheiros de produto, oferecendo uma interface intuitiva e funcionalidades completas para análise QFD.

## 🚀 Funcionalidades Principais

### 1. **Gerenciamento de Requisitos de Cliente**
- Cadastro de requisitos com descrições detalhadas
- Interface intuitiva com validações
- Histórico de criação e modificação
- Exportação de dados

### 2. **Comparação Par a Par (Diagrama de Mudge)**
- Matriz de comparação interativa
- Hierarquização automática dos requisitos
- Cálculo de pesos normalizados
- Visualização em tempo real do progresso

### 3. **Gerenciamento de Requisitos de Projeto**
- Cadastro de características técnicas mensuráveis
- Definição do sentido de melhoria (↑ Crescente, ↓ Decrescente, * Nominal)
- Avaliação de dificuldade técnica (escala 1-5)
- Validações automáticas

### 4. **Análise de Correlações (Telhado da Casa QFD)**
- Matriz de correlação entre requisitos técnicos
- 5 níveis de correlação (++, +, 0, -, --)
- Identificação de sinergias e conflitos
- Visualização gráfica das relações

### 5. **Matriz QFD Completa (Casa da Qualidade)**
- Relacionamento entre requisitos de cliente e projeto
- 3 níveis de influência (1-Fraca, 3-Moderada, 5-Forte)
- Cálculos automáticos:
  - Importância Absoluta
  - Importância Relativa (ranking)
  - Peso Relativo (normalizado)

### 6. **Geração de Relatório PDF**
- Relatório profissional completo
- Configurações personalizáveis
- Múltiplas seções opcionais
- Histórico de relatórios gerados
- Análises e insights automáticos

## 🏗️ Arquitetura do Sistema

### Tecnologias Utilizadas
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Armazenamento**: LocalStorage (banco de dados local)
- **Geração de PDF**: jsPDF + html2canvas
- **Design**: CSS Grid, Flexbox, Design Responsivo

### Estrutura de Arquivos
```
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
```

## 📖 Como Usar

### 1. **Iniciando um Projeto QFD**
1. Abra o arquivo `index.html` no navegador
2. O dashboard mostrará o progresso atual
3. Comece pela primeira etapa: "Requisitos de Cliente"

### 2. **Fluxo de Trabalho Recomendado**
1. **Requisitos de Cliente**: Cadastre todas as necessidades dos clientes
2. **Comparação Cliente**: Hierarquize os requisitos por importância
3. **Requisitos de Projeto**: Defina características técnicas mensuráveis
4. **Correlação Projeto**: Analise relações entre requisitos técnicos
5. **Matriz QFD**: Relacione requisitos de cliente com projeto
6. **Relatório**: Gere o documento final em PDF

### 3. **Dicas de Uso**

#### Para Requisitos de Cliente:
- Use a linguagem do cliente
- Seja específico e mensurável quando possível
- Foque no "o que" o cliente quer, não no "como"

#### Para Requisitos de Projeto:
- Defina características técnicas mensuráveis
- Sempre especifique o sentido de melhoria
- Avalie realisticamente a dificuldade técnica

#### Para a Matriz QFD:
- Nem todas as células precisam ser preenchidas
- Foque nas relações mais significativas
- Use consistentemente os critérios de avaliação

## 🔧 Funcionalidades Técnicas

### Banco de Dados Local
- Armazenamento persistente no navegador
- Backup e restauração de dados
- Validação de integridade
- Limpeza seletiva de dados

### Cálculos Automáticos
- **Importância Absoluta**: IA(j) = Σ(IC(i) × R(i,j))
- **Peso Relativo**: PR(j) = IA(j) / Σ(IA)
- **Ranking**: Ordenação por importância absoluta

### Validações
- Campos obrigatórios
- Consistência de dados
- Prevenção de duplicatas
- Verificação de dependências

## 📊 Relatórios e Análises

### Seções Disponíveis no Relatório:
1. **Resumo Executivo**: Visão geral e principais descobertas
2. **Requisitos de Cliente**: Lista completa com pesos e rankings
3. **Requisitos de Projeto**: Características técnicas e dificuldades
4. **Análise de Correlações**: Sinergias e conflitos identificados
5. **Matriz QFD**: Casa da qualidade completa
6. **Ranking de Prioridades**: Requisitos ordenados por importância
7. **Análises e Insights**: Interpretações e recomendações
8. **Anexos Técnicos**: Metodologia e fórmulas utilizadas

### Configurações do Relatório:
- Título do projeto personalizável
- Informações da empresa
- Nome do responsável
- Data do relatório
- Descrição do projeto
- Seleção de seções

## 🔒 Segurança e Privacidade

- **Dados Locais**: Todos os dados ficam no navegador do usuário
- **Sem Servidor**: Não há transmissão de dados para servidores externos
- **Backup Manual**: O usuário controla seus próprios backups
- **Limpeza**: Dados podem ser removidos completamente

## 🌐 Compatibilidade

### Navegadores Suportados:
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Dispositivos:
- Desktop (recomendado)
- Tablets
- Smartphones (funcionalidade limitada)

## 🚀 Instalação e Execução

### Método 1: Execução Local
1. Faça download de todos os arquivos
2. Mantenha a estrutura de pastas
3. Abra `index.html` em um navegador moderno
4. Comece a usar imediatamente

### Método 2: Servidor Web Local
```bash
# Se você tem Python instalado:
python -m http.server 8000

# Ou com Node.js:
npx serve .

# Acesse: http://localhost:8000
```

## 📈 Exemplos de Uso

### Caso de Uso: Desenvolvimento de Produto
1. **Cliente**: Empresa de eletrônicos desenvolvendo um smartphone
2. **Requisitos de Cliente**: Bateria duradoura, câmera de qualidade, preço acessível
3. **Requisitos Técnicos**: Capacidade da bateria (mAh), resolução da câmera (MP), custo de produção ($)
4. **Resultado**: Priorização clara dos aspectos técnicos mais importantes

### Caso de Uso: Melhoria de Serviço
1. **Cliente**: Empresa de software melhorando um aplicativo
2. **Requisitos de Cliente**: Interface intuitiva, resposta rápida, alta disponibilidade
3. **Requisitos Técnicos**: Tempo de resposta (ms), uptime (%), complexidade da UI
4. **Resultado**: Roadmap técnico baseado em prioridades dos usuários

## 🔧 Personalização

### Modificando Estilos:
- Edite `css/style.css` para alterar aparência
- Cores principais definidas em variáveis CSS
- Layout responsivo com CSS Grid e Flexbox

### Adicionando Funcionalidades:
- Estrutura modular facilita extensões
- Banco de dados local expansível
- APIs JavaScript bem documentadas

## 📞 Suporte e Manutenção

### Resolução de Problemas Comuns:

**Problema**: Dados não estão sendo salvos
**Solução**: Verifique se o navegador permite LocalStorage

**Problema**: PDF não está sendo gerado
**Solução**: Verifique se as bibliotecas jsPDF e html2canvas estão carregadas

**Problema**: Interface não responsiva
**Solução**: Atualize para um navegador mais recente

### Backup de Dados:
1. Use a função "Backup" no dashboard
2. Salve o arquivo JSON gerado
3. Use "Restaurar" para recuperar dados

## 📝 Metodologia QFD

### O que é QFD?
Quality Function Deployment é uma metodologia desenvolvida no Japão para traduzir requisitos de cliente em especificações técnicas de produto.

### Benefícios:
- **Foco no Cliente**: Garante que o produto atenda às necessidades reais
- **Priorização**: Identifica quais aspectos técnicos são mais importantes
- **Comunicação**: Facilita o diálogo entre equipes técnicas e comerciais
- **Redução de Riscos**: Diminui chances de desenvolver características desnecessárias

### Processo:
1. **Voz do Cliente**: Captura das necessidades dos clientes
2. **Tradução Técnica**: Conversão em especificações mensuráveis
3. **Relacionamento**: Matriz que conecta necessidades com soluções
4. **Priorização**: Ranking baseado em importância e viabilidade

## 🎯 Próximos Passos

Após usar este sistema, você terá:
- ✅ Lista priorizada de requisitos técnicos
- ✅ Compreensão clara das necessidades dos clientes
- ✅ Identificação de conflitos e sinergias técnicas
- ✅ Relatório profissional para apresentações
- ✅ Base sólida para tomada de decisões de desenvolvimento

## 📄 Licença

Este sistema foi desenvolvido para uso em projetos de engenharia de produto. Todos os direitos reservados.

---

**Sistema QFD v1.0** - Desenvolvido para Engenheiros de Produto
*Transformando necessidades de clientes em especificações técnicas*

