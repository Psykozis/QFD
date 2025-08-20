/**
 * JavaScript para Página de Correlação de Requisitos de Projeto
 * Implementa o telhado da casa QFD
 */

let requisitos = [];
let totalCorrelacoes = 0;
let correlacoesFeitas = 0;

document.addEventListener('DOMContentLoaded', function() {
    loadRequisitos();
    setupCorrelation();
    updateStatus();
});

function loadRequisitos() {
    requisitos = qfdDB.getRequisitosProjeto();
    totalCorrelacoes = calculateTotalCorrelations(requisitos.length);
    
    const correlacoes = qfdDB.getCorrelacoesProjeto();
    correlacoesFeitas = correlacoes.length;
}

function calculateTotalCorrelations(count) {
    return count > 1 ? (count * (count - 1)) / 2 : 0;
}

function setupCorrelation() {
    const insufficientDiv = document.getElementById('insufficient-requirements');
    const correlationSection = document.getElementById('correlation-section');
    const legendSection = document.getElementById('correlation-legend');
    const analysisSection = document.getElementById('analysis-section');
    
    if (requisitos.length < 2) {
        insufficientDiv.style.display = 'block';
        correlationSection.style.display = 'none';
        legendSection.style.display = 'none';
        analysisSection.style.display = 'none';
        return;
    }
    
    insufficientDiv.style.display = 'none';
    correlationSection.style.display = 'block';
    legendSection.style.display = 'block';
    
    generateRoofMatrix();
    
    if (correlacoesFeitas > 0) {
        showAnalysis();
    }
}

function generateRoofMatrix() {
    const roofContainer = document.getElementById('roof-matrix');
    if (!roofContainer) return;
    
    let roofHTML = '<div class="roof-table">';
    
    // Cabeçalho com números dos requisitos
    roofHTML += '<div class="roof-header">';
    for (let i = 0; i < requisitos.length; i++) {
        roofHTML += `<div class="roof-header-cell" title="${escapeHtml(requisitos[i].descricao)}">
            <span class="req-number">${i + 1}</span>
        </div>`;
    }
    roofHTML += '</div>';
    
    // Matriz triangular superior
    for (let i = 0; i < requisitos.length - 1; i++) {
        roofHTML += '<div class="roof-row">';
        
        // Espaços vazios à esquerda
        for (let k = 0; k <= i; k++) {
            roofHTML += '<div class="roof-empty"></div>';
        }
        
        // Células de correlação
        for (let j = i + 1; j < requisitos.length; j++) {
            const correlation = qfdDB.getCorrelacaoProjeto(requisitos[i].id, requisitos[j].id);
            const isCompleted = correlation !== '0';
            
            roofHTML += `<div class="roof-cell ${isCompleted ? 'completed' : ''}" 
                data-req1="${requisitos[i].id}" 
                data-req2="${requisitos[j].id}"
                data-i="${i}" 
                data-j="${j}">
                ${getCorrelationDisplay(correlation)}
            </div>`;
        }
        
        roofHTML += '</div>';
    }
    
    roofHTML += '</div>';
    
    // Legenda dos requisitos
    roofHTML += '<div class="roof-legend">';
    roofHTML += '<h4>Requisitos de Projeto:</h4>';
    roofHTML += '<div class="legend-items">';
    
    for (let i = 0; i < requisitos.length; i++) {
        const req = requisitos[i];
        roofHTML += `<div class="legend-item">
            <span class="legend-number">${i + 1}</span>
            <div class="legend-content">
                <span class="legend-text">${escapeHtml(req.descricao)}</span>
                <div class="legend-meta">
                    <span class="sentido-badge ${req.sentidoMelhoria}">
                        ${getSentidoSymbol(req.sentidoMelhoria)} ${getSentidoLabel(req.sentidoMelhoria)}
                    </span>
                    <span class="dificuldade-badge level-${req.dificuldadeTecnica}">
                        Dif: ${req.dificuldadeTecnica}
                    </span>
                </div>
            </div>
        </div>`;
    }
    
    roofHTML += '</div></div>';
    
    roofContainer.innerHTML = roofHTML;
    
    // Adiciona event listeners para as células
    const roofCells = roofContainer.querySelectorAll('.roof-cell');
    roofCells.forEach(cell => {
        cell.addEventListener('click', () => openCorrelationModal(cell));
    });
}

function getSentidoSymbol(sentido) {
    const symbols = { 'up': '↑', 'down': '↓', 'none': '*' };
    return symbols[sentido] || '?';
}

function getSentidoLabel(sentido) {
    const labels = { 'up': 'Crescente', 'down': 'Decrescente', 'none': 'Nominal' };
    return labels[sentido] || 'Indefinido';
}

function getCorrelationDisplay(correlation) {
    const symbols = {
        '++': '<span class="corr-symbol strong-positive">++</span>',
        '+': '<span class="corr-symbol positive">+</span>',
        '0': '<span class="corr-symbol neutral">0</span>',
        '-': '<span class="corr-symbol negative">-</span>',
        '--': '<span class="corr-symbol strong-negative">--</span>'
    };
    
    return symbols[correlation] || '<span class="corr-placeholder">?</span>';
}

function openCorrelationModal(cell) {
    const req1Id = cell.dataset.req1;
    const req2Id = cell.dataset.req2;
    const i = parseInt(cell.dataset.i);
    const j = parseInt(cell.dataset.j);
    
    const req1 = requisitos[i];
    const req2 = requisitos[j];
    
    const currentCorrelation = qfdDB.getCorrelacaoProjeto(req1Id, req2Id);
    
    // Cria modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content correlation-modal">
            <div class="modal-header">
                <h3>Analisar Correlação</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="correlation-question">
                    <h4>Como estes requisitos se relacionam?</h4>
                </div>
                
                <div class="requirements-display">
                    <div class="requirement-display">
                        <div class="req-header">
                            <span class="req-number">${i + 1}</span>
                            <span class="req-label">Requisito A</span>
                        </div>
                        <div class="req-description">${escapeHtml(req1.descricao)}</div>
                        <div class="req-attributes">
                            <span class="sentido-badge ${req1.sentidoMelhoria}">
                                ${getSentidoSymbol(req1.sentidoMelhoria)} ${getSentidoLabel(req1.sentidoMelhoria)}
                            </span>
                            <span class="dificuldade-badge level-${req1.dificuldadeTecnica}">
                                Dificuldade: ${req1.dificuldadeTecnica}
                            </span>
                        </div>
                    </div>
                    
                    <div class="correlation-arrow">
                        <i class="fas fa-exchange-alt"></i>
                    </div>
                    
                    <div class="requirement-display">
                        <div class="req-header">
                            <span class="req-number">${j + 1}</span>
                            <span class="req-label">Requisito B</span>
                        </div>
                        <div class="req-description">${escapeHtml(req2.descricao)}</div>
                        <div class="req-attributes">
                            <span class="sentido-badge ${req2.sentidoMelhoria}">
                                ${getSentidoSymbol(req2.sentidoMelhoria)} ${getSentidoLabel(req2.sentidoMelhoria)}
                            </span>
                            <span class="dificuldade-badge level-${req2.dificuldadeTecnica}">
                                Dificuldade: ${req2.dificuldadeTecnica}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="correlation-options">
                    <h4>Selecione o tipo de correlação:</h4>
                    <div class="correlation-buttons">
                        <button class="correlation-btn ${currentCorrelation === '++' ? 'selected' : ''}" data-value="++">
                            <span class="corr-symbol strong-positive">++</span>
                            <span class="corr-label">Positiva Muito Forte</span>
                            <small>Se reforçam significativamente</small>
                        </button>
                        <button class="correlation-btn ${currentCorrelation === '+' ? 'selected' : ''}" data-value="+">
                            <span class="corr-symbol positive">+</span>
                            <span class="corr-label">Positiva</span>
                            <small>Se complementam</small>
                        </button>
                        <button class="correlation-btn ${currentCorrelation === '0' ? 'selected' : ''}" data-value="0">
                            <span class="corr-symbol neutral">0</span>
                            <span class="corr-label">Sem Correlação</span>
                            <small>São independentes</small>
                        </button>
                        <button class="correlation-btn ${currentCorrelation === '-' ? 'selected' : ''}" data-value="-">
                            <span class="corr-symbol negative">-</span>
                            <span class="corr-label">Negativa</span>
                            <small>Competem entre si</small>
                        </button>
                        <button class="correlation-btn ${currentCorrelation === '--' ? 'selected' : ''}" data-value="--">
                            <span class="corr-symbol strong-negative">--</span>
                            <span class="corr-label">Negativa Muito Forte</span>
                            <small>São conflitantes</small>
                        </button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button class="btn btn-primary" id="save-correlation" onclick="saveCorrelation()" disabled>
                    Salvar Correlação
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Adiciona estilos do modal se não existirem
    addModalStyles();
    
    // Configura event listeners
    setupModalEventListeners(req1Id, req2Id, currentCorrelation);
}

function setupModalEventListeners(req1Id, req2Id, currentCorrelation) {
    let selectedCorrelation = currentCorrelation;
    
    // Event listeners para botões de correlação
    const correlationBtns = document.querySelectorAll('.correlation-btn');
    correlationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            correlationBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedCorrelation = btn.dataset.value;
            
            document.getElementById('save-correlation').disabled = false;
        });
    });
    
    // Se já tem correlação, habilita o botão salvar
    if (currentCorrelation !== '0') {
        document.getElementById('save-correlation').disabled = false;
    }
    
    // Salva referências globais
    window.currentCorrelationData = {
        req1Id, req2Id, selectedCorrelation
    };
}

function saveCorrelation() {
    const data = window.currentCorrelationData;
    if (!data) return;
    
    try {
        qfdDB.setCorrelacaoProjeto(data.req1Id, data.req2Id, data.selectedCorrelation);
        
        closeModal();
        loadRequisitos();
        generateRoofMatrix();
        updateStatus();
        showAnalysis();
        
        showAlert('Correlação salva com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar correlação:', error);
        showAlert('Erro ao salvar correlação.', 'danger');
    }
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
    delete window.currentCorrelationData;
}

function updateStatus() {
    const totalReqElement = document.getElementById('total-requisitos');
    const correlacoesElement = document.getElementById('correlacoes-feitas');
    const progressoElement = document.getElementById('progresso-percentual');
    const progressFill = document.getElementById('progress-fill');
    
    if (totalReqElement) {
        totalReqElement.textContent = `${requisitos.length} Requisitos`;
    }
    
    if (correlacoesElement) {
        correlacoesElement.textContent = `${correlacoesFeitas} / ${totalCorrelacoes}`;
    }
    
    const progresso = totalCorrelacoes > 0 ? Math.round((correlacoesFeitas / totalCorrelacoes) * 100) : 0;
    
    if (progressoElement) {
        progressoElement.textContent = `${progresso}%`;
    }
    
    if (progressFill) {
        progressFill.style.width = `${progresso}%`;
    }
}

function showAnalysis() {
    const analysisSection = document.getElementById('analysis-section');
    if (!analysisSection) return;
    
    analysisSection.style.display = 'block';
    
    generateCorrelationSummary();
    generateConflictAnalysis();
    generateSynergyAnalysis();
}

function generateCorrelationSummary() {
    const summaryContainer = document.getElementById('correlation-summary');
    if (!summaryContainer) return;
    
    const correlacoes = qfdDB.getCorrelacoesProjeto();
    
    // Conta tipos de correlação
    const counts = {
        '++': 0, '+': 0, '0': 0, '-': 0, '--': 0
    };
    
    correlacoes.forEach(corr => {
        counts[corr.correlacao]++;
    });
    
    // Adiciona correlações neutras não definidas
    counts['0'] += totalCorrelacoes - correlacoesFeitas;
    
    const summaryHTML = `
        <h4>Resumo das Correlações</h4>
        <div class="summary-grid">
            <div class="summary-item strong-positive">
                <div class="summary-icon">++</div>
                <div class="summary-content">
                    <span class="summary-count">${counts['++']}</span>
                    <span class="summary-label">Positivas Muito Fortes</span>
                </div>
            </div>
            <div class="summary-item positive">
                <div class="summary-icon">+</div>
                <div class="summary-content">
                    <span class="summary-count">${counts['+']}</span>
                    <span class="summary-label">Positivas</span>
                </div>
            </div>
            <div class="summary-item neutral">
                <div class="summary-icon">0</div>
                <div class="summary-content">
                    <span class="summary-count">${counts['0']}</span>
                    <span class="summary-label">Neutras</span>
                </div>
            </div>
            <div class="summary-item negative">
                <div class="summary-icon">-</div>
                <div class="summary-content">
                    <span class="summary-count">${counts['-']}</span>
                    <span class="summary-label">Negativas</span>
                </div>
            </div>
            <div class="summary-item strong-negative">
                <div class="summary-icon">--</div>
                <div class="summary-content">
                    <span class="summary-count">${counts['--']}</span>
                    <span class="summary-label">Negativas Muito Fortes</span>
                </div>
            </div>
        </div>
    `;
    
    summaryContainer.innerHTML = summaryHTML;
}

function generateConflictAnalysis() {
    const conflictContainer = document.getElementById('conflict-analysis');
    if (!conflictContainer) return;
    
    const correlacoes = qfdDB.getCorrelacoesProjeto();
    const conflicts = correlacoes.filter(corr => corr.correlacao === '-' || corr.correlacao === '--');
    
    let conflictHTML = '<h4><i class="fas fa-exclamation-triangle"></i> Análise de Conflitos</h4>';
    
    if (conflicts.length === 0) {
        conflictHTML += `
            <div class="no-conflicts">
                <i class="fas fa-check-circle"></i>
                <p>Nenhum conflito significativo identificado entre os requisitos de projeto.</p>
            </div>
        `;
    } else {
        conflictHTML += '<div class="conflict-list">';
        
        conflicts.forEach(conflict => {
            const req1 = requisitos.find(r => r.id === conflict.requisito1);
            const req2 = requisitos.find(r => r.id === conflict.requisito2);
            
            if (req1 && req2) {
                const req1Index = requisitos.indexOf(req1) + 1;
                const req2Index = requisitos.indexOf(req2) + 1;
                
                conflictHTML += `
                    <div class="conflict-item">
                        <div class="conflict-header">
                            <span class="corr-symbol ${conflict.correlacao === '--' ? 'strong-negative' : 'negative'}">
                                ${conflict.correlacao}
                            </span>
                            <span class="conflict-title">
                                Requisito ${req1Index} vs Requisito ${req2Index}
                            </span>
                        </div>
                        <div class="conflict-details">
                            <div class="req-detail">
                                <strong>${req1Index}:</strong> ${escapeHtml(req1.descricao)}
                            </div>
                            <div class="req-detail">
                                <strong>${req2Index}:</strong> ${escapeHtml(req2.descricao)}
                            </div>
                        </div>
                        <div class="conflict-impact">
                            <i class="fas fa-lightbulb"></i>
                            <span>
                                ${conflict.correlacao === '--' ? 
                                    'Conflito crítico: melhorar um prejudica significativamente o outro.' :
                                    'Conflito moderado: existe competição entre estes requisitos.'
                                }
                            </span>
                        </div>
                    </div>
                `;
            }
        });
        
        conflictHTML += '</div>';
    }
    
    conflictContainer.innerHTML = conflictHTML;
}

function generateSynergyAnalysis() {
    const synergyContainer = document.getElementById('synergy-analysis');
    if (!synergyContainer) return;
    
    const correlacoes = qfdDB.getCorrelacoesProjeto();
    const synergies = correlacoes.filter(corr => corr.correlacao === '+' || corr.correlacao === '++');
    
    let synergyHTML = '<h4><i class="fas fa-handshake"></i> Análise de Sinergias</h4>';
    
    if (synergies.length === 0) {
        synergyHTML += `
            <div class="no-synergies">
                <i class="fas fa-info-circle"></i>
                <p>Nenhuma sinergia significativa identificada entre os requisitos de projeto.</p>
            </div>
        `;
    } else {
        synergyHTML += '<div class="synergy-list">';
        
        synergies.forEach(synergy => {
            const req1 = requisitos.find(r => r.id === synergy.requisito1);
            const req2 = requisitos.find(r => r.id === synergy.requisito2);
            
            if (req1 && req2) {
                const req1Index = requisitos.indexOf(req1) + 1;
                const req2Index = requisitos.indexOf(req2) + 1;
                
                synergyHTML += `
                    <div class="synergy-item">
                        <div class="synergy-header">
                            <span class="corr-symbol ${synergy.correlacao === '++' ? 'strong-positive' : 'positive'}">
                                ${synergy.correlacao}
                            </span>
                            <span class="synergy-title">
                                Requisito ${req1Index} + Requisito ${req2Index}
                            </span>
                        </div>
                        <div class="synergy-details">
                            <div class="req-detail">
                                <strong>${req1Index}:</strong> ${escapeHtml(req1.descricao)}
                            </div>
                            <div class="req-detail">
                                <strong>${req2Index}:</strong> ${escapeHtml(req2.descricao)}
                            </div>
                        </div>
                        <div class="synergy-benefit">
                            <i class="fas fa-arrow-up"></i>
                            <span>
                                ${synergy.correlacao === '++' ? 
                                    'Sinergia forte: melhorar um beneficia significativamente o outro.' :
                                    'Sinergia moderada: estes requisitos se complementam.'
                                }
                            </span>
                        </div>
                    </div>
                `;
            }
        });
        
        synergyHTML += '</div>';
    }
    
    synergyContainer.innerHTML = synergyHTML;
}

function resetCorrelations() {
    if (confirm('Tem certeza que deseja resetar todas as correlações? Esta ação não pode ser desfeita.')) {
        try {
            const correlacoes = qfdDB.getCorrelacoesProjeto();
            correlacoes.forEach(corr => {
                qfdDB.setCorrelacaoProjeto(corr.requisito1, corr.requisito2, '0');
            });
            
            loadRequisitos();
            generateRoofMatrix();
            updateStatus();
            
            const analysisSection = document.getElementById('analysis-section');
            if (analysisSection) {
                analysisSection.style.display = 'none';
            }
            
            showAlert('Todas as correlações foram resetadas!', 'success');
        } catch (error) {
            console.error('Erro ao resetar correlações:', error);
            showAlert('Erro ao resetar correlações.', 'danger');
        }
    }
}

function exportAnalysis() {
    const correlacoes = qfdDB.getCorrelacoesProjeto();
    
    if (correlacoes.length === 0) {
        showAlert('Não há correlações para exportar.', 'info');
        return;
    }
    
    const csvContent = generateAnalysisCSV(correlacoes);
    downloadFile(csvContent, `correlacao-requisitos-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    
    showAlert('Análise exportada com sucesso!', 'success');
}

function generateAnalysisCSV(correlacoes) {
    const headers = ['Requisito 1', 'Requisito 2', 'Correlação', 'Tipo', 'Descrição 1', 'Descrição 2'];
    const rows = correlacoes.map(corr => {
        const req1 = requisitos.find(r => r.id === corr.requisito1);
        const req2 = requisitos.find(r => r.id === corr.requisito2);
        
        const correlationTypes = {
            '++': 'Positiva Muito Forte',
            '+': 'Positiva',
            '0': 'Neutra',
            '-': 'Negativa',
            '--': 'Negativa Muito Forte'
        };
        
        return [
            req1 ? requisitos.indexOf(req1) + 1 : 'N/A',
            req2 ? requisitos.indexOf(req2) + 1 : 'N/A',
            corr.correlacao,
            correlationTypes[corr.correlacao] || 'Indefinida',
            req1 ? `"${req1.descricao.replace(/"/g, '""')}"` : 'N/A',
            req2 ? `"${req2.descricao.replace(/"/g, '""')}"` : 'N/A'
        ];
    });
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showAlert(message, type = 'info') {
    // Remove alertas existentes
    const existingAlerts = document.querySelectorAll('.alert');
    existingAlerts.forEach(alert => alert.remove());
    
    // Cria novo alerta
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${getAlertIcon(type)}"></i>
        ${message}
        <button class="alert-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Insere no início do main-content
    const mainContent = document.querySelector('.main-content .container');
    if (mainContent) {
        mainContent.insertBefore(alert, mainContent.firstChild);
    }
    
    // Remove automaticamente após 5 segundos
    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}

function getAlertIcon(type) {
    const icons = {
        success: 'check-circle',
        warning: 'exclamation-triangle',
        danger: 'exclamation-circle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function addModalStyles() {
    if (document.getElementById('correlation-modal-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'correlation-modal-styles';
    styles.textContent = `
        .correlation-modal {
            max-width: 800px;
            width: 95%;
        }
        
        .requirements-display {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .requirement-display {
            flex: 1;
            padding: 1rem;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            background: #f8f9fa;
        }
        
        .correlation-arrow {
            color: #667eea;
            font-size: 1.5rem;
        }
        
        .req-attributes {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.5rem;
            flex-wrap: wrap;
        }
        
        .correlation-options h4 {
            text-align: center;
            margin-bottom: 1rem;
            color: #333;
        }
        
        .correlation-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 0.5rem;
        }
        
        .correlation-btn {
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }
        
        .correlation-btn:hover {
            border-color: #667eea;
            background: #f8f9ff;
        }
        
        .correlation-btn.selected {
            border-color: #667eea;
            background: linear-gradient(135deg, #f8f9ff, #e3f2fd);
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
        }
        
        .correlation-btn .corr-symbol {
            font-size: 1.5rem;
            font-weight: bold;
        }
        
        .correlation-btn .corr-label {
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .correlation-btn small {
            font-size: 0.8rem;
            color: #666;
            line-height: 1.2;
        }
        
        @media (max-width: 768px) {
            .requirements-display {
                flex-direction: column;
            }
            
            .correlation-arrow {
                transform: rotate(90deg);
            }
            
            .correlation-buttons {
                grid-template-columns: 1fr;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

// Adiciona estilos específicos da página
document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('correlacao-projeto-styles')) {
        const styles = document.createElement('style');
        styles.id = 'correlacao-projeto-styles';
        styles.textContent = `
            .correlation-types {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1rem;
            }
            
            .correlation-type {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid #667eea;
            }
            
            .correlation-symbol {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 1.2rem;
                color: white;
                flex-shrink: 0;
            }
            
            .correlation-symbol.strong-positive {
                background: #28a745;
            }
            
            .correlation-symbol.positive {
                background: #20c997;
            }
            
            .correlation-symbol.neutral {
                background: #6c757d;
            }
            
            .correlation-symbol.negative {
                background: #fd7e14;
            }
            
            .correlation-symbol.strong-negative {
                background: #dc3545;
            }
            
            .correlation-info h4 {
                margin: 0 0 0.5rem 0;
                color: #333;
                font-size: 1rem;
            }
            
            .correlation-info p {
                margin: 0;
                color: #666;
                font-size: 0.9rem;
                line-height: 1.4;
            }
            
            .roof-container {
                display: flex;
                justify-content: center;
                margin-bottom: 2rem;
            }
            
            .roof-table {
                display: inline-block;
                border: 2px solid #667eea;
                border-radius: 8px;
                padding: 1rem;
                background: white;
            }
            
            .roof-header {
                display: flex;
                justify-content: center;
                margin-bottom: 0.5rem;
            }
            
            .roof-header-cell {
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #667eea;
                color: white;
                font-weight: bold;
                margin: 0 1px;
                border-radius: 4px;
            }
            
            .roof-row {
                display: flex;
                justify-content: center;
                margin-bottom: 2px;
            }
            
            .roof-empty {
                width: 40px;
                height: 40px;
                margin: 0 1px;
            }
            
            .roof-cell {
                width: 40px;
                height: 40px;
                border: 1px solid #dee2e6;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.3s ease;
                margin: 0 1px;
                background: white;
                border-radius: 4px;
            }
            
            .roof-cell:hover {
                background: #f8f9ff;
                border-color: #667eea;
                transform: scale(1.1);
            }
            
            .roof-cell.completed {
                background: #e8f5e8;
                border-color: #28a745;
            }
            
            .corr-symbol {
                font-weight: bold;
                font-size: 1.1rem;
            }
            
            .corr-symbol.strong-positive {
                color: #28a745;
            }
            
            .corr-symbol.positive {
                color: #20c997;
            }
            
            .corr-symbol.neutral {
                color: #6c757d;
            }
            
            .corr-symbol.negative {
                color: #fd7e14;
            }
            
            .corr-symbol.strong-negative {
                color: #dc3545;
            }
            
            .corr-placeholder {
                color: #6c757d;
                font-size: 1.2rem;
            }
            
            .roof-legend {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 1rem;
                margin-top: 1rem;
            }
            
            .roof-legend h4 {
                margin: 0 0 1rem 0;
                color: #333;
            }
            
            .legend-items {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 0.5rem;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem;
                background: white;
                border-radius: 6px;
                border: 1px solid #e9ecef;
            }
            
            .legend-content {
                flex: 1;
            }
            
            .legend-text {
                display: block;
                font-size: 0.9rem;
                line-height: 1.3;
                margin-bottom: 0.25rem;
            }
            
            .legend-meta {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            
            .sentido-badge {
                padding: 0.2rem 0.4rem;
                border-radius: 3px;
                font-size: 0.7rem;
                font-weight: 600;
                color: white;
            }
            
            .sentido-badge.up {
                background: #28a745;
            }
            
            .sentido-badge.down {
                background: #dc3545;
            }
            
            .sentido-badge.none {
                background: #6c757d;
            }
            
            .dificuldade-badge {
                padding: 0.2rem 0.4rem;
                border-radius: 3px;
                font-size: 0.7rem;
                font-weight: 600;
                color: white;
            }
            
            .dificuldade-badge.level-1 {
                background: #28a745;
            }
            
            .dificuldade-badge.level-2 {
                background: #20c997;
            }
            
            .dificuldade-badge.level-3 {
                background: #ffc107;
                color: #212529;
            }
            
            .dificuldade-badge.level-4 {
                background: #fd7e14;
            }
            
            .dificuldade-badge.level-5 {
                background: #dc3545;
            }
            
            .analysis-content {
                display: grid;
                gap: 2rem;
            }
            
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .summary-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 1rem;
                background: white;
                border-radius: 8px;
                border: 1px solid #e9ecef;
            }
            
            .summary-icon {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                color: white;
                flex-shrink: 0;
            }
            
            .summary-item.strong-positive .summary-icon {
                background: #28a745;
            }
            
            .summary-item.positive .summary-icon {
                background: #20c997;
            }
            
            .summary-item.neutral .summary-icon {
                background: #6c757d;
            }
            
            .summary-item.negative .summary-icon {
                background: #fd7e14;
            }
            
            .summary-item.strong-negative .summary-icon {
                background: #dc3545;
            }
            
            .summary-content {
                display: flex;
                flex-direction: column;
            }
            
            .summary-count {
                font-size: 1.5rem;
                font-weight: bold;
                color: #333;
            }
            
            .summary-label {
                font-size: 0.8rem;
                color: #666;
            }
            
            .no-conflicts, .no-synergies {
                text-align: center;
                padding: 2rem;
                color: #666;
            }
            
            .no-conflicts i, .no-synergies i {
                font-size: 2rem;
                margin-bottom: 0.5rem;
                color: #28a745;
            }
            
            .conflict-list, .synergy-list {
                display: grid;
                gap: 1rem;
            }
            
            .conflict-item, .synergy-item {
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 1rem;
            }
            
            .conflict-item {
                border-left: 4px solid #dc3545;
            }
            
            .synergy-item {
                border-left: 4px solid #28a745;
            }
            
            .conflict-header, .synergy-header {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 0.75rem;
            }
            
            .conflict-title, .synergy-title {
                font-weight: 600;
                color: #333;
            }
            
            .conflict-details, .synergy-details {
                margin-bottom: 0.75rem;
            }
            
            .req-detail {
                margin-bottom: 0.25rem;
                font-size: 0.9rem;
                color: #666;
            }
            
            .conflict-impact, .synergy-benefit {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem;
                background: #f8f9fa;
                border-radius: 4px;
                font-size: 0.9rem;
            }
            
            .conflict-impact i {
                color: #ffc107;
            }
            
            .synergy-benefit i {
                color: #28a745;
            }
            
            @media (max-width: 768px) {
                .correlation-types {
                    grid-template-columns: 1fr;
                }
                
                .roof-header-cell, .roof-cell, .roof-empty {
                    width: 35px;
                    height: 35px;
                }
                
                .legend-items {
                    grid-template-columns: 1fr;
                }
                
                .summary-grid {
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
});

