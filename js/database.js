/**
 * ============================================================================
 * SISTEMA DE BANCO DE DADOS LOCAL PARA QFD
 * ============================================================================
 * 
 * Este módulo implementa uma camada de persistência de dados usando LocalStorage
 * do navegador. Gerencia todas as operações CRUD para requisitos de cliente,
 * requisitos de projeto, comparações, correlações e a matriz QFD.
 * 
 * Estrutura de Dados:
 * - requisitosCliente: Array de requisitos do cliente
 * - requisitosProjeto: Array de requisitos técnicos do projeto
 * - comparacaoCliente: Array de comparações pareadas entre requisitos cliente
 * - correlacaoProjeto: Array de correlações entre requisitos de projeto
 * - matrizQFD: Array de relações entre requisitos cliente e projeto
 * - metadata: Informações sobre criação e modificação do projeto
 * 
 * @class QFDDatabase
 */
class QFDDatabase {
    /**
     * Construtor da classe QFDDatabase
     * Inicializa a chave de armazenamento e cria a estrutura inicial do banco
     */
    constructor() {
        this.storageKey = 'qfd_data';
        this.initializeDatabase();
    }

    // ========================================================================
    // SEÇÃO 1: INICIALIZAÇÃO E GERENCIAMENTO DE DADOS
    // ========================================================================

    /**
     * Inicializa a estrutura do banco de dados no LocalStorage
     * Cria a estrutura padrão se não existir
     */
    initializeDatabase() {
        const defaultData = {
            requisitosCliente: [],
            requisitosProjeto: [],
            comparacaoCliente: [],
            correlacaoProjeto: [],
            matrizQFD: [],
            metadata: {
                created: new Date().toISOString(),
                lastModified: new Date().toISOString(),
                version: '1.0'
            }
        };

        if (!localStorage.getItem(this.storageKey)) {
            this.saveData(defaultData);
        }
    }

    /**
     * Salva dados no LocalStorage
     * Atualiza automaticamente a data de última modificação
     * 
     * @param {Object} data - Objeto com todos os dados do projeto QFD
     */
    saveData(data) {
        data.metadata.lastModified = new Date().toISOString();
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    /**
     * Carrega dados do LocalStorage
     * 
     * @returns {Object|null} Dados do projeto ou null se não existir
     */
    loadData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : null;
    }

    /**
     * Gera um UUID (Identificador Único Universal) simples
     * Usado para identificar unicamente cada requisito
     * 
     * @returns {string} UUID no formato xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // ========================================================================
    // SEÇÃO 2: GERENCIAMENTO DE REQUISITOS DE CLIENTE
    // ========================================================================
    // 
    // Requisitos de Cliente são as necessidades e expectativas expressas
    // pelo cliente sobre o produto. Eles são hierarquizados através de
    // comparações pareadas (Diagrama de Mudge).
    
    /**
     * Adiciona um novo requisito de cliente
     * 
     * @param {string} descricao - Descrição do requisito do cliente
     * @returns {Object} Objeto do requisito criado com ID, descrição, importância e peso
     */
    addRequisitoCliente(descricao) {
        const data = this.loadData();
        const novoRequisito = {
            id: this.generateUUID(),
            descricao: descricao.trim(),
            importancia: 0,
            peso: 0,
            created: new Date().toISOString()
        };
        
        data.requisitosCliente.push(novoRequisito);
        this.saveData(data);
        return novoRequisito;
    }

    /**
     * Obtém todos os requisitos de cliente cadastrados
     * 
     * @returns {Array} Array com todos os requisitos de cliente
     */
    getRequisitosCliente() {
        const data = this.loadData();
        return data.requisitosCliente || [];
    }

    /**
     * Remove um requisito de cliente e todas suas relações
     * Remove também comparações e relações na matriz QFD associadas
     * 
     * @param {string} id - ID único do requisito a ser removido
     */
    removeRequisitoCliente(id) {
        const data = this.loadData();
        data.requisitosCliente = data.requisitosCliente.filter(req => req.id !== id);
        
        // Remove comparações relacionadas
        data.comparacaoCliente = data.comparacaoCliente.filter(
            comp => comp.requisito1 !== id && comp.requisito2 !== id
        );
        
        // Remove relações na matriz QFD
        data.matrizQFD = data.matrizQFD.filter(rel => rel.requisitoCliente !== id);
        
        this.saveData(data);
    }

    /**
     * Atualiza propriedades de um requisito de cliente existente
     * 
     * @param {string} id - ID único do requisito
     * @param {Object} updates - Objeto com as propriedades a serem atualizadas
     * @returns {Object|null} Requisito atualizado ou null se não encontrado
     */
    updateRequisitoCliente(id, updates) {
        const data = this.loadData();
        const index = data.requisitosCliente.findIndex(req => req.id === id);
        if (index !== -1) {
            data.requisitosCliente[index] = { ...data.requisitosCliente[index], ...updates };
            this.saveData(data);
            return data.requisitosCliente[index];
        }
        return null;
    }

    // ========================================================================
    // SEÇÃO 3: GERENCIAMENTO DE REQUISITOS DE PROJETO
    // ========================================================================
    // 
    // Requisitos de Projeto são as características técnicas que devem ser
    // implementadas para atender aos requisitos do cliente. Cada requisito
    // possui um sentido de melhoria (crescente, decrescente ou nominal) e
    // uma dificuldade técnica (1-5).
    
    /**
     * Adiciona um novo requisito de projeto
     * 
     * @param {string} descricao - Descrição do requisito técnico
     * @param {string} sentidoMelhoria - Sentido da melhoria: 'up' (crescente), 'down' (decrescente) ou 'none' (nominal)
     * @param {number} dificuldadeTecnica - Nível de dificuldade técnica (1-5)
     * @returns {Object} Objeto do requisito criado
     */
    addRequisitoProjeto(descricao, sentidoMelhoria = 'none', dificuldadeTecnica = 1) {
        const data = this.loadData();
        const novoRequisito = {
            id: this.generateUUID(),
            descricao: descricao.trim(),
            sentidoMelhoria: sentidoMelhoria, // 'up', 'down', 'none'
            dificuldadeTecnica: dificuldadeTecnica,
            importanciaAbsoluta: 0,
            importanciaRelativa: 0,
            pesoRelativo: 0,
            created: new Date().toISOString()
        };
        
        data.requisitosProjeto.push(novoRequisito);
        this.saveData(data);
        return novoRequisito;
    }

    /**
     * Obtém todos os requisitos de projeto cadastrados
     * 
     * @returns {Array} Array com todos os requisitos de projeto
     */
    getRequisitosProjeto() {
        const data = this.loadData();
        return data.requisitosProjeto || [];
    }

    /**
     * Remove um requisito de projeto e todas suas relações
     * Remove também correlações e relações na matriz QFD associadas
     * 
     * @param {string} id - ID único do requisito a ser removido
     */
    removeRequisitoProjeto(id) {
        const data = this.loadData();
        data.requisitosProjeto = data.requisitosProjeto.filter(req => req.id !== id);
        
        // Remove correlações relacionadas
        data.correlacaoProjeto = data.correlacaoProjeto.filter(
            corr => corr.requisito1 !== id && corr.requisito2 !== id
        );
        
        // Remove relações na matriz QFD
        data.matrizQFD = data.matrizQFD.filter(rel => rel.requisitoProjeto !== id);
        
        this.saveData(data);
    }

    /**
     * Atualiza propriedades de um requisito de projeto existente
     * 
     * @param {string} id - ID único do requisito
     * @param {Object} updates - Objeto com as propriedades a serem atualizadas
     * @returns {Object|null} Requisito atualizado ou null se não encontrado
     */
    updateRequisitoProjeto(id, updates) {
        const data = this.loadData();
        const index = data.requisitosProjeto.findIndex(req => req.id === id);
        if (index !== -1) {
            data.requisitosProjeto[index] = { ...data.requisitosProjeto[index], ...updates };
            this.saveData(data);
            return data.requisitosProjeto[index];
        }
        return null;
    }

    // ========================================================================
    // SEÇÃO 4: GERENCIAMENTO DE COMPARAÇÕES DE CLIENTE (DIAGRAMA DE MUDGE)
    // ========================================================================
    // 
    // O Diagrama de Mudge é usado para hierarquizar requisitos através de
    // comparações pareadas. Cada comparação indica qual requisito é mais
    // importante e em que grau (1, 3 ou 5).
    // 
    // Valores possíveis:
    // - 1: Pouco mais importante
    // - 3: Moderadamente mais importante
    // - 5: Muito mais importante
    
    /**
     * Adiciona ou atualiza uma comparação entre dois requisitos de cliente
     * Remove comparação existente antes de adicionar nova (evita duplicatas)
     * Recalcula automaticamente a importância dos requisitos após salvar
     * 
     * @param {string} requisito1 - ID do requisito vencedor da comparação
     * @param {string} requisito2 - ID do requisito perdedor da comparação
     * @param {number} valor - Valor da importância (1, 3 ou 5)
     */
    setComparacaoCliente(requisito1, requisito2, valor) {
        const data = this.loadData();
        
        // Remove comparação existente
        data.comparacaoCliente = data.comparacaoCliente.filter(
            comp => !(
                (comp.requisito1 === requisito1 && comp.requisito2 === requisito2) ||
                (comp.requisito1 === requisito2 && comp.requisito2 === requisito1)
            )
        );
        
        // Adiciona nova comparação
        if (valor > 0) {
            data.comparacaoCliente.push({
                requisito1,
                requisito2,
                valor,
                created: new Date().toISOString()
            });
        }
        
        this.saveData(data);
        this.calculateImportanciaCliente();
    }

    /**
     * Obtém o valor de comparação entre dois requisitos de cliente
     * 
     * IMPORTANTE: Retorna o valor apenas se requisito1 foi o vencedor.
     * Se requisito2 venceu, retorna 0 (pois requisito1 não ganhou pontos).
     * 
     * @param {string} requisito1 - ID do primeiro requisito
     * @param {string} requisito2 - ID do segundo requisito
     * @returns {number} Valor da comparação (1, 3, 5) ou 0 se não existe ou se requisito1 perdeu
     */
    getComparacaoCliente(requisito1, requisito2) {
        const data = this.loadData();
        const comp = data.comparacaoCliente.find(
            c => (c.requisito1 === requisito1 && c.requisito2 === requisito2) ||
                 (c.requisito1 === requisito2 && c.requisito2 === requisito1)
        );
        
        if (!comp) return 0;
        
        // No Diagrama de Mudge:
        // Se requisito1 venceu (está salvo como requisito1), retorna o valor (1, 3 ou 5).
        // Se requisito2 venceu (está salvo como requisito1), requisito1 recebe 0 pontos.
        // Retornamos um objeto ou valor que indique quem venceu para a interface.
        // Para manter compatibilidade com a matriz que espera um valor para req1:
        if (comp.requisito1 === requisito1) {
            return comp.valor;
        } else {
            // Retornamos um valor negativo ou especial para indicar que o outro venceu?
            // Melhor retornar o valor mas com sinal de quem venceu para a lógica da matriz.
            // Mas a matriz triangular superior usa i < j.
            return 0; 
        }
    }

    /**
     * Obtém todas as comparações de cliente cadastradas
     * 
     * @returns {Array} Array com todas as comparações
     */
    getComparacoesCliente() {
        const data = this.loadData();
        return data.comparacaoCliente || [];
    }

    /**
     * Calcula a importância e o peso relativo de cada requisito de cliente
     * baseado nas comparações realizadas (Diagrama de Mudge)
     * 
     * Algoritmo:
     * 1. Soma os pontos de cada requisito (apenas quando ele é o vencedor)
     * 2. Normaliza os pesos dividindo pela soma total
     */
    calculateImportanciaCliente() {
        const data = this.loadData();
        const requisitos = data.requisitosCliente;
        const comparacoes = data.comparacaoCliente;
        
        // Calcula pontuação para cada requisito
        requisitos.forEach(req => {
            let pontuacao = 0;
            
            comparacoes.forEach(comp => {
                if (comp.requisito1 === req.id) {
                    pontuacao += comp.valor;
                }
                // No novo modelo, se ele é requisito2 e está salvo, ele perdeu (0 pontos)
                // A pontuação só é somada para o requisito1 (vencedor)
            });
            
            req.importancia = pontuacao;
        });
        
        // Normaliza os pesos
        const totalImportancia = requisitos.reduce((sum, req) => sum + req.importancia, 0);
        if (totalImportancia > 0) {
            requisitos.forEach(req => {
                req.peso = req.importancia / totalImportancia;
            });
        }
        
        this.saveData(data);
    }

    // ========================================================================
    // SEÇÃO 5: GERENCIAMENTO DE CORRELAÇÕES DE PROJETO (TELHADO QFD)
    // ========================================================================
    // 
    // Correlações indicam como os requisitos técnicos se relacionam entre si.
    // São representadas no "telhado" da Casa da Qualidade.
    // 
    // Valores possíveis:
    // - '++': Correlação positiva muito forte (sinergia forte)
    // - '+': Correlação positiva (sinergia moderada)
    // - '0': Sem correlação (independentes)
    // - '-': Correlação negativa (competem entre si)
    // - '--': Correlação negativa muito forte (conflitantes)
    
    /**
     * Adiciona ou atualiza uma correlação entre dois requisitos de projeto
     * Remove correlação existente antes de adicionar nova (evita duplicatas)
     * 
     * @param {string} requisito1 - ID do primeiro requisito
     * @param {string} requisito2 - ID do segundo requisito
     * @param {string} correlacao - Tipo de correlação ('++', '+', '0', '-', '--')
     */
    setCorrelacaoProjeto(requisito1, requisito2, correlacao) {
        const data = this.loadData();
        
        // Remove correlação existente
        data.correlacaoProjeto = data.correlacaoProjeto.filter(
            corr => !(
                (corr.requisito1 === requisito1 && corr.requisito2 === requisito2) ||
                (corr.requisito1 === requisito2 && corr.requisito2 === requisito1)
            )
        );
        
        // Adiciona nova correlação se não for neutra
        if (correlacao !== '0') {
            data.correlacaoProjeto.push({
                requisito1,
                requisito2,
                correlacao,
                created: new Date().toISOString()
            });
        }
        
        this.saveData(data);
    }

    /**
     * Obtém a correlação entre dois requisitos de projeto
     * 
     * @param {string} requisito1 - ID do primeiro requisito
     * @param {string} requisito2 - ID do segundo requisito
     * @returns {string} Tipo de correlação ou '0' (neutra) se não existe
     */
    getCorrelacaoProjeto(requisito1, requisito2) {
        const data = this.loadData();
        const corr = data.correlacaoProjeto.find(
            c => (c.requisito1 === requisito1 && c.requisito2 === requisito2) ||
                 (c.requisito1 === requisito2 && c.requisito2 === requisito1)
        );
        
        return corr ? corr.correlacao : '0';
    }

    // Obtém todas as correlações de projeto
    getCorrelacoesProjeto() {
        const data = this.loadData();
        return data.correlacaoProjeto || [];
    }

    // === MATRIZ QFD ===
    
    // Adiciona/atualiza relação na matriz QFD
    setMatrizQFD(requisitoCliente, requisitoProjeto, influencia) {
        const data = this.loadData();
        
        // Remove relação existente
        data.matrizQFD = data.matrizQFD.filter(
            rel => !(rel.requisitoCliente === requisitoCliente && rel.requisitoProjeto === requisitoProjeto)
        );
        
        // Adiciona nova relação se houver influência
        if (influencia > 0) {
            data.matrizQFD.push({
                requisitoCliente,
                requisitoProjeto,
                influencia,
                created: new Date().toISOString()
            });
        }
        
        this.saveData(data);
        this.calculateImportanciaProjeto();
    }

    /**
     * Obtém o valor de influência entre um requisito de cliente e um de projeto
     * 
     * @param {string} requisitoCliente - ID do requisito de cliente
     * @param {string} requisitoProjeto - ID do requisito de projeto
     * @returns {number} Valor da influência (0, 1, 3 ou 9) ou 0 se não existe
     */
    getMatrizQFD(requisitoCliente, requisitoProjeto) {
        const data = this.loadData();
        const rel = data.matrizQFD.find(
            r => r.requisitoCliente === requisitoCliente && r.requisitoProjeto === requisitoProjeto
        );
        
        return rel ? rel.influencia : 0;
    }

    /**
     * Obtém todas as relações da matriz QFD cadastradas
     * 
     * @returns {Array} Array com todas as relações da matriz
     */
    getMatrizQFDCompleta() {
        const data = this.loadData();
        return data.matrizQFD || [];
    }

    /**
     * Calcula a importância absoluta, relativa (ranking) e peso relativo
     * de cada requisito de projeto baseado na matriz QFD
     * 
     * Algoritmo:
     * 1. Importância Absoluta = Soma (influência × importância do requisito cliente)
     * 2. Importância Relativa = Ranking baseado na importância absoluta (1º, 2º, etc.)
     * 3. Peso Relativo = Importância absoluta normalizada (0 a 1)
     */
    calculateImportanciaProjeto() {
        const data = this.loadData();
        const requisitosProjeto = data.requisitosProjeto;
        const requisitosCliente = data.requisitosCliente;
        const matrizQFD = data.matrizQFD;
        
        // Calcula importância absoluta para cada requisito de projeto
        requisitosProjeto.forEach(reqProj => {
            let importanciaAbsoluta = 0;
            
            matrizQFD.forEach(rel => {
                if (rel.requisitoProjeto === reqProj.id) {
                    const reqCliente = requisitosCliente.find(rc => rc.id === rel.requisitoCliente);
                    if (reqCliente) {
                        importanciaAbsoluta += rel.influencia * reqCliente.importancia;
                    }
                }
            });
            
            reqProj.importanciaAbsoluta = importanciaAbsoluta;
        });
        
        // Calcula importância relativa (ranking)
        const sortedRequisitos = [...requisitosProjeto].sort((a, b) => b.importanciaAbsoluta - a.importanciaAbsoluta);
        sortedRequisitos.forEach((req, index) => {
            req.importanciaRelativa = index + 1;
        });
        
        // Calcula peso relativo (normalizado)
        const totalImportancia = requisitosProjeto.reduce((sum, req) => sum + req.importanciaAbsoluta, 0);
        if (totalImportancia > 0) {
            requisitosProjeto.forEach(req => {
                req.pesoRelativo = req.importanciaAbsoluta / totalImportancia;
            });
        }
        
        this.saveData(data);
    }

    // ========================================================================
    // SEÇÃO 7: FUNÇÕES UTILITÁRIAS E MANUTENÇÃO
    // ========================================================================
    
    /**
     * Limpa todos os dados do projeto e reinicializa o banco
     * ATENÇÃO: Esta ação não pode ser desfeita!
     */
    clearAllData() {
        localStorage.removeItem(this.storageKey);
        this.initializeDatabase();
    }

    // Exporta dados para JSON
    exportData() {
        return this.loadData();
    }

    // Importa dados de JSON
    importData(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            this.saveData(data);
            return true;
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            return false;
        }
    }

    /**
     * Obtém estatísticas resumidas do projeto
     * 
     * @returns {Object} Objeto com contadores e informações do projeto:
     *   - requisitosCliente: Quantidade de requisitos de cliente
     *   - requisitosProjeto: Quantidade de requisitos de projeto
     *   - comparacoesCliente: Quantidade de comparações realizadas
     *   - correlacoesProjeto: Quantidade de correlações definidas
     *   - relacoesQFD: Quantidade de relações na matriz QFD
     *   - lastModified: Data da última modificação
     */
    getProjectStats() {
        const data = this.loadData();
        
        return {
            requisitosCliente: data.requisitosCliente.length,
            requisitosProjeto: data.requisitosProjeto.length,
            comparacoesCliente: data.comparacaoCliente.length,
            correlacoesProjeto: data.correlacaoProjeto.length,
            relacoesQFD: data.matrizQFD.length,
            lastModified: data.metadata.lastModified
        };
    }

    /**
     * Valida a integridade dos dados do projeto
     * Verifica se não há referências órfãs (requisitos que não existem mais)
     * 
     * @returns {Object} Objeto com:
     *   - isValid: boolean indicando se os dados estão válidos
     *   - errors: Array com mensagens de erros encontrados
     */
    validateData() {
        const data = this.loadData();
        const errors = [];
        
        // Verifica se há requisitos órfãos nas comparações
        data.comparacaoCliente.forEach(comp => {
            const req1Exists = data.requisitosCliente.some(req => req.id === comp.requisito1);
            const req2Exists = data.requisitosCliente.some(req => req.id === comp.requisito2);
            
            if (!req1Exists || !req2Exists) {
                errors.push(`Comparação com requisito inexistente: ${comp.requisito1} - ${comp.requisito2}`);
            }
        });
        
        // Verifica correlações
        data.correlacaoProjeto.forEach(corr => {
            const req1Exists = data.requisitosProjeto.some(req => req.id === corr.requisito1);
            const req2Exists = data.requisitosProjeto.some(req => req.id === corr.requisito2);
            
            if (!req1Exists || !req2Exists) {
                errors.push(`Correlação com requisito inexistente: ${corr.requisito1} - ${corr.requisito2}`);
            }
        });
        
        // Verifica matriz QFD
        data.matrizQFD.forEach(rel => {
            const reqClienteExists = data.requisitosCliente.some(req => req.id === rel.requisitoCliente);
            const reqProjetoExists = data.requisitosProjeto.some(req => req.id === rel.requisitoProjeto);
            
            if (!reqClienteExists || !reqProjetoExists) {
                errors.push(`Relação QFD com requisito inexistente: ${rel.requisitoCliente} - ${rel.requisitoProjeto}`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Instância global do banco de dados
const qfdDB = new QFDDatabase();

// Funções utilitárias globais
function resetAllData() {
    if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
        qfdDB.clearAllData();
        location.reload();
    }
}

/**
 * Função global para exportar dados do projeto em formato JSON
 * Cria um arquivo JSON para download com todos os dados do projeto
 */
function exportProjectData() {
    const data = qfdDB.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `qfd-project-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Função global para importar dados do projeto de um arquivo JSON
 * 
 * @param {Event} event - Evento do input file com o arquivo selecionado
 */
function importProjectData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const success = qfdDB.importData(e.target.result);
            if (success) {
                alert('Dados importados com sucesso!');
                location.reload();
            } else {
                alert('Erro ao importar dados. Verifique o formato do arquivo.');
            }
        } catch (error) {
            alert('Erro ao ler o arquivo: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// ========================================================================
// SEÇÃO 8: FUNCIONALIDADES DE IMPORTAÇÃO/EXPORTAÇÃO CSV
// ========================================================================
// 
// Permite importar e exportar dados em formato CSV para facilitar
// a integração com planilhas e outras ferramentas

/**
 * Importa requisitos de um arquivo CSV
 * 
 * @param {Event} event - Evento do input file com o arquivo CSV selecionado
 * @param {string} type - Tipo de requisito: 'cliente' ou 'projeto'
 */
function importCSV(event, type) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n');
        let count = 0;

        lines.forEach(line => {
            const content = line.trim();
            if (content && !content.startsWith('id,') && !content.startsWith('descricao')) {
                // Tenta extrair a descrição (assume que é a primeira coluna ou a linha toda)
                const parts = content.split(',');
                const descricao = parts.length > 1 ? parts[1].replace(/"/g, '') : parts[0].replace(/"/g, '');
                
                if (type === 'cliente') {
                    qfdDB.addRequisitoCliente(descricao);
                } else {
                    qfdDB.addRequisitoProjeto(descricao);
                }
                count++;
            }
        });

        alert(`${count} requisitos importados com sucesso!`);
        location.reload();
    };
    reader.readAsText(file);
}

/**
 * Exporta dados específicos de uma página em formato CSV
 * 
 * @param {string} type - Tipo de dados a exportar: 'cliente', 'projeto' ou 'matriz'
 */
function exportPageData(type) {
    const data = qfdDB.loadData();
    let exportContent = '';
    let fileName = '';

    if (type === 'cliente') {
        exportContent = "id,descricao,importancia,peso\n";
        data.requisitosCliente.forEach(req => {
            exportContent += `${req.id},"${req.descricao}",${req.importancia},${req.peso}\n`;
        });
        fileName = 'requisitos-cliente.csv';
    } else if (type === 'projeto') {
        exportContent = "id,descricao,sentido,dificuldade\n";
        data.requisitosProjeto.forEach(req => {
            exportContent += `${req.id},"${req.descricao}",${req.sentidoMelhoria},${req.dificuldadeTecnica}\n`;
        });
        fileName = 'requisitos-projeto.csv';
    } else if (type === 'matriz') {
        exportContent = "cliente_id,projeto_id,influencia\n";
        data.matrizQFD.forEach(rel => {
            exportContent += `${rel.requisitoCliente},${rel.requisitoProjeto},${rel.influencia}\n`;
        });
        fileName = 'matriz-qfd.csv';
    }

    const blob = new Blob([exportContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
