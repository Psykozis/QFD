# Sistema QFD - Lista de Tarefas

Site: https://marlonsigales.github.io/QFD/index.html

## Fase 1: Planejamento e estrutura do projeto
- [x] Definir estrutura de arquivos e pastas
- [x] Planejar navegação entre páginas
- [x] Definir esquema do banco de dados local
- [x] Criar wireframes das páginas principais

## Fase 2: Desenvolvimento da estrutura base e banco de dados local
- [x] Criar estrutura HTML base
- [x] Implementar sistema de navegação
- [x] Configurar LocalStorage para banco de dados
- [x] Criar funções básicas de CRUD

## Fase 3: Implementação das páginas de entrada de dados
- [x] Página de requisitos de cliente
- [x] Página de requisitos de projeto com sentido de melhoria

## Fase 4: Desenvolvimento das páginas de comparação e análise
- [x] Página de comparação par a par (diagrama de Mudge)
- [x] Página de correlação entre requisitos de projeto (telhado)

## Fase 5: Implementação da matriz QFD e cálculos
- [x] Matriz QFD principal
- [x] Cálculos de importância absoluta, relativa e peso relativo
- [x] Análises e visualizações dos resultados

## Fase 6: Geração de PDF e finalização
- [x] Implementar geração de PDF da matriz QFD
- [x] Estilização final do sistema
- [x] Validações e tratamento de erros

## Fase 7: Teste e entrega do sistema
- [x] Testes completos do sistema
- [x] Verificação de responsividade
- [x] Entrega final com documentação

## Fase 8: Especificações e textos explicativos (maio–setembro/2026)
- [x] Página de Especificações (unidade, valor, aspectos indesejáveis)
- [x] Especificações no relatório
- [x] Texto explicativo em requisitos de cliente e de projeto, com balão nas demais páginas
- [x] Texto explicativo nas especificações, com balão no relatório
- [x] Aspectos indesejáveis preenchidos automaticamente pelas correlações `--`
- [x] Balões sem HTML cru e seguros com aspas no texto

## Fase 9: Qualidade do código (setembro/2026)
- [x] Funções repetidas reunidas em `js/utils.js`
- [x] Menus corrigidos e padronizados em todas as páginas
- [x] Versionamento dos dados salvos, com migração automática
- [x] Tratamento de erros: dados corrompidos, armazenamento cheio, backups inválidos
- [x] Validações: requisitos duplicados, limites de tamanho
- [x] Importação de CSV reescrita
- [x] Corrigido loop infinito no backup automático do dashboard
- [x] Testes automatizados (`tests/`)
- [x] Documentação atualizada (README, guia de uso, análise do código)

## Próximos passos

### Publicar e validar
- [ ] Enviar os commits para o GitHub (`git push`) e confirmar que o site novo foi atualizado
- [ ] Conferir no GitHub se o Pages está ativo no repositório novo (Settings → Pages)
- [ ] Fazer o roteiro de QA manual do [QFD QA.txt](QFD%20QA.txt) no site publicado
- [ ] Gerar um PDF de verdade no relatório (os testes automáticos cobrem só a prévia)

### Melhorias sugeridas
- [ ] Diagrama de Mudge: parar de recarregar a página inteira a cada comparação salva
- [ ] Unificar o código dos balões (`showTooltip`/`hideTooltip`, ainda diferente por página)
- [ ] Mostrar também o texto explicativo da especificação no balão do requisito de projeto na Matriz QFD
- [ ] Limpar CSS duplicado (`.nav-dropdown`, `.dropdown-menu`, `.qfd-tooltip`) e mover para o `style.css` os estilos injetados via JavaScript
- [ ] Atualizar o ano do rodapé ("© 2024") em todas as páginas
- [ ] Remover do repositório `qfd_system_updated.zip` (versão antiga, 220 KB)
- [ ] Melhorar o uso das matrizes em celular

### Baixa prioridade
- [ ] Acessibilidade (ARIA, navegação por teclado)
- [ ] Simplificar a lógica de `getComparacaoCliente()`

### Não recomendado
- IndexedDB: um QFD típico ocupa poucas dezenas de KB, bem abaixo do limite do LocalStorage (~5 MB), e a troca exigiria reescrever todo o acesso aos dados.
