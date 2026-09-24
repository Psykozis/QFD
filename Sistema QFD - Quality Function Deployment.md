# Sistema QFD - Guia de Uso

**Acesse:** https://marlonsigales.github.io/QFD/index.html

Sistema web para criar a Casa da Qualidade (QFD - Quality Function Deployment) de um produto, do levantamento das necessidades do cliente até as especificações técnicas e o relatório em PDF. Detalhes técnicos (estrutura dos dados, testes, histórico de mudanças) estão no [README](README.md).

## 📝 O que é QFD?

Quality Function Deployment é uma metodologia desenvolvida no Japão para traduzir as necessidades do cliente em especificações técnicas de produto.

- **Foco no cliente:** garante que o produto atenda às necessidades reais
- **Priorização:** mostra quais aspectos técnicos são mais importantes
- **Comunicação:** facilita o diálogo entre equipes técnicas e comerciais
- **Redução de riscos:** evita desenvolver características desnecessárias

## 📖 Fluxo de trabalho

O dashboard (página inicial) mostra o progresso de cada etapa. Siga a ordem:

### 1. Requisitos de Cliente
Cadastre as necessidades do cliente, na linguagem do cliente ("o que" ele quer, não "como").
- Descrição de 10 a 300 caracteres; não é possível cadastrar duas descrições iguais.
- **Texto explicativo (opcional):** detalhes ou contexto do requisito. Aparece num balão ao passar o mouse sobre o requisito nas outras páginas.

### 2. Comparação Cliente (Diagrama de Mudge)
Compare os requisitos dois a dois e indique quanto um é mais importante que o outro: **1** (pouco), **3** (médio) ou **5** (muito). O sistema calcula o peso de cada requisito e o ranking.

### 3. Requisitos de Projeto
Cadastre as características técnicas mensuráveis que atendem aos requisitos do cliente:
- **Sentido de melhoria:** ↑ quanto maior melhor, ↓ quanto menor melhor, \* valor nominal (alvo).
- **Dificuldade técnica:** de 1 (muito fácil) a 5 (muito difícil).
- **Texto explicativo (opcional):** por exemplo, como a característica é medida.

### 4. Correlação Projeto (Telhado)
Indique como os requisitos de projeto se afetam:
- **++** sinergia forte, **+** sinergia, **0** independentes, **-** conflito, **--** conflito forte.

Os conflitos fortes (**--**) são levados automaticamente para os "aspectos indesejáveis" das Especificações.

### 5. Matriz QFD
Relacione cada requisito de cliente com cada requisito de projeto: **0** (nenhuma), **1** (fraca), **3** (moderada) ou **9** (forte). Nem todas as células precisam ser preenchidas; foque nas relações significativas. O sistema calcula a importância absoluta, a importância relativa e o peso de cada requisito de projeto.

### 6. Especificações
Os requisitos de projeto aparecem na ordem de importância do QFD, divididos em terços (superior, médio e inferior). Para cada um, preencha:
- **Unidade de mensuração** e **valor unitário** (a meta).
- **Texto explicativo (opcional):** aparece no relatório.
- **Aspectos indesejáveis:** vêm preenchidos com os conflitos **--** do telhado. Se você editar o texto, sua versão é mantida.

### 7. Avaliação Competitiva
Depois do QFD, compare o produto com os concorrentes:
- **Produtos avaliados:** cadastre até 6 concorrentes. "Nosso produto" pode ser renomeado (ex.: "Protótipo v2").
- **Avaliação dos clientes:** peça aos clientes uma nota de **1 (pior)** a **5 (melhor)** para cada produto em cada requisito, e defina a **meta** de nota do nosso produto. O sistema mostra se estamos **à frente, empatados ou atrás** do melhor concorrente, o **índice de melhoria** (meta ÷ nossa nota) e a **prioridade** (peso do requisito × índice de melhoria): onde melhorar rende mais para o cliente. Um gráfico mostra o perfil de cada produto.
- **Avaliação técnica:** registre o valor medido de cada produto nos requisitos de projeto (ex.: "1,5 kg"). O sistema aponta o melhor concorrente (maior valor para ↑, menor para ↓) e se a meta das Especificações fica acima ou abaixo dele.
- **Resultado:** pontos fortes, pontos a melhorar, metas abaixo do concorrente e **inconsistências**: casos em que os clientes preferem um produto, mas os valores técnicos (dos requisitos com relação forte na matriz) favorecem o outro. Isso costuma indicar erro de medição ou um requisito de projeto que ficou de fora.

### 8. Relatório PDF
Preencha título, empresa, responsável e descrição, escolha as seções e gere a prévia e o PDF. Seções disponíveis: dicionário de requisitos, resumo, requisitos de cliente, requisitos de projeto, telhado, análise de correlações, matriz QFD, especificações, avaliação competitiva, comparações, ranking, análises e anexos. Na prévia, passe o mouse sobre RC, RP e células para ver as descrições e os textos explicativos.

## 💾 Salvando e levando o projeto

Os dados são salvos automaticamente **no navegador**, a cada alteração. Por isso:

- Um projeto feito no link online não aparece se você abrir o sistema pelos arquivos locais, e vice-versa, nem em outro navegador ou computador.
- Limpar os dados de navegação apaga o projeto.

**Faça backups:** menu **Backup & Export → Exportar Backup (JSON)**. Para abrir o projeto em outro lugar, use **Importar Backup (JSON)**. Backups de versões antigas do sistema são convertidos automaticamente.

Também é possível **importar requisitos de uma planilha** (CSV): uma descrição por linha, ou uma planilha com uma coluna "Descrição". Requisitos repetidos são ignorados.

## 📞 Problemas comuns

| Problema | O que fazer |
|----------|-------------|
| Aviso de **dados corrompidos** ao abrir | O sistema restaurou o último backup automático (ou iniciou um projeto vazio). Se tiver um backup JSON mais recente, importe-o. |
| Aviso de **armazenamento cheio** | A última alteração não foi salva. Exporte um backup e libere espaço (dados de outros sites no navegador). |
| Página sem estilo até clicar | Acontece ao abrir o `index.html` direto do disco. Use o link online ou um servidor local (ver README). |
| PDF não é gerado | Verifique a conexão com a internet: as bibliotecas de PDF são carregadas online. |
| Balão não aparece | Verifique se o requisito tem texto explicativo cadastrado. |

## 📈 Exemplos

**Produto:** um fabricante de eletrônicos desenvolvendo um smartphone.
- Requisitos de cliente: bateria duradoura, câmera de qualidade, preço acessível.
- Requisitos de projeto: capacidade da bateria (mAh ↑), resolução da câmera (MP ↑), custo de produção (R$ ↓).

**Serviço:** uma empresa de software melhorando um aplicativo.
- Requisitos de cliente: interface intuitiva, resposta rápida, alta disponibilidade.
- Requisitos de projeto: tempo de resposta (ms ↓), disponibilidade (% ↑), número de passos por tarefa (↓).

## 🎯 Resultado

Ao final você terá:
- ✅ Requisitos técnicos priorizados pela voz do cliente
- ✅ Conflitos e sinergias técnicas identificados
- ✅ Especificações com metas mensuráveis
- ✅ Comparação com os concorrentes, na visão dos clientes e nos valores técnicos
- ✅ Relatório profissional para apresentação

## 🌐 Compatibilidade

Navegadores atuais (Chrome, Edge, Firefox, Safari) em computador. Tablets funcionam; em celulares o uso das matrizes é limitado.

---

Todos os direitos reservados.
