/**
 * Sistema de Banco de Dados Local para QFD
 * Utiliza LocalStorage para persistência de dados
 */

class QFDDatabase {
    constructor() {
        this.storageKey = 'qfd_data';
        this.initializeDatabase();
    }

    // Inicializa a estrutura do banco de dados
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

    // Salva dados no LocalStorage
    saveData(data) {
        data.metadata.lastModified = new Date().toISOString();
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    // Carrega dados do LocalStorage
    loadData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : null;
    }

    // Gera UUID simples
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // === REQUISITOS DE CLIENTE ===
    
    // Adiciona requisito de cliente
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

    // Obtém todos os requisitos de cliente
    getRequisitosCliente() {
        const data = this.loadData();
        return data.requisitosCliente || [];
    }

    // Remove requisito de cliente
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

    // Atualiza requisito de cliente
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

    // === REQUISITOS DE PROJETO ===
    
    // Adiciona requisito de projeto
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

    // Obtém todos os requisitos de projeto
    getRequisitosProjeto() {
        const data = this.loadData();
        return data.requisitosProjeto || [];
    }

    // Remove requisito de projeto
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

    // Atualiza requisito de projeto
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

    // === COMPARAÇÃO DE CLIENTE ===
    
    // Adiciona/atualiza comparação entre requisitos de cliente
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

    // Obtém comparação entre dois requisitos
    getComparacaoCliente(requisito1, requisito2) {
        const data = this.loadData();
        const comp = data.comparacaoCliente.find(
            c => (c.requisito1 === requisito1 && c.requisito2 === requisito2) ||
                 (c.requisito1 === requisito2 && c.requisito2 === requisito1)
        );
        
        if (!comp) return 0;
        
        // Se a comparação está invertida, retorna o valor do ponto de vista do requisito1
        // No Diagrama de Mudge, se req1 vence, valor é positivo. Se req2 vence, req1 recebe 0.
        // Mas o sistema salva o valor do vencedor.
        if (comp.requisito1 === requisito1) {
            return comp.valor;
        } else {
            // Se o salvo foi req2 como vencedor, req1 tem 0 pontos nesta comparação
            return 0; 
        }
    }

    // Obtém todas as comparações de cliente
    getComparacoesCliente() {
        const data = this.loadData();
        return data.comparacaoCliente || [];
    }

    // Calcula importância dos requisitos de cliente
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

    // === CORRELAÇÃO DE PROJETO ===
    
    // Adiciona/atualiza correlação entre requisitos de projeto
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

    // Obtém correlação entre dois requisitos de projeto
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

    // Obtém influência entre requisito de cliente e projeto
    getMatrizQFD(requisitoCliente, requisitoProjeto) {
        const data = this.loadData();
        const rel = data.matrizQFD.find(
            r => r.requisitoCliente === requisitoCliente && r.requisitoProjeto === requisitoProjeto
        );
        
        return rel ? rel.influencia : 0;
    }

    // Obtém todas as relações da matriz QFD
    getMatrizQFDCompleta() {
        const data = this.loadData();
        return data.matrizQFD || [];
    }

    // Calcula importância dos requisitos de projeto
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

    // === UTILITÁRIOS ===
    
    // Limpa todos os dados
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

    // Obtém estatísticas do projeto
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

    // Valida integridade dos dados
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


// === NOVAS FUNCIONALIDADES: CSV E EXPORTAÇÃO POR PÁGINA ===

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
