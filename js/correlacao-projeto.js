/**
 * ============================================================================
 * CORRELAÇÃO DE REQUISITOS DE PROJETO - TELHADO QFD
 * ============================================================================
 * 
 * Este módulo gerencia o "telhado" da Casa da Qualidade, que representa as
 * correlações entre requisitos técnicos de projeto.
 * 
 * Tipos de correlação:
 * - '++': Positiva muito forte (sinergia forte)
 * - '+': Positiva (sinergia moderada)
 * - '0': Neutra (independentes)
 * - '-': Negativa (competem entre si)
 * - '--': Negativa muito forte (conflitantes)
 * 
 * Funcionalidades:
 * - Matriz triangular de correlações
 * - Popup interativo para definição
 * - Análise de conflitos e sinergias
 * - Exportação de análises
 */

// ========================================================================
// SEÇÃO 1: VARIÁVEIS GLOBAIS E INICIALIZAÇÃO
// ========================================================================

let requisitos = [];
let totalCorrelacoes = 0;
let correlacoesFeitas = 0;

/**
 * Inicializa a página quando o DOM está pronto
 */
document.addEventListener('DOMContentLoaded', function() {
    loadRequisitos();
    setupCorrelation();
    updateStatus();
    setupDropdownMenu();
});

function setupDropdownMenu() {
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    if (dropdownToggle && dropdownMenu) {
        dropdownToggle.addEventListener('click', function(e) {
            e.preventDefault();
            dropdownMenu.classList.toggle('show');
        });
        
        // Fechar dropdown ao clicar fora
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.nav-dropdown')) {
                dropdownMenu.classList.remove('show');
            }
        });
    }
}

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
    
    // Cabeçalho com números dos requisitos e sentido de melhoria
    roofHTML += '<div class="roof-header">';
    for (let i = 0; i < requisitos.length; i++) {
        const req = requisitos[i];
        roofHTML += `<div class="roof-header-cell" 
            title="Requisito ${i + 1}: ${escapeHtml(req.descricao)} | Sentido: ${getSentidoLabel(req.sentidoMelhoria)} ${getSentidoSymbol(req.sentidoMelhoria)}"
            data-tooltip="Requisito ${i + 1}: ${escapeHtml(req.descricao)}<br>Sentido: ${getSentidoLabel(req.sentidoMelhoria)} ${getSentidoSymbol(req.sentidoMelhoria)}<br>Dificuldade: ${req.dificuldadeTecnica}">
            <span class="req-number">${i + 1}</span>
            <span class="req-direction">${getSentidoSymbol(req.sentidoMelhoria)}</span>
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
            
            const req1 = requisitos[i];
            const req2 = requisitos[j];
            
            const tooltipText = `Correlação entre:<br>
                <strong>Req ${i + 1}:</strong> ${escapeHtml(req1.descricao.substring(0, 50))}${req1.descricao.length > 50 ? '...' : ''}<br>
                <strong>Req ${j + 1}:</strong> ${escapeHtml(req2.descricao.substring(0, 50))}${req2.descricao.length > 50 ? '...' : ''}<br>
                <em>Clique para definir correlação</em>`;
            
            roofHTML += `<div class="roof-cell ${isCompleted ? 'completed' : ''}" 
                data-req1="${requisitos[i].id}" 
                data-req2="${requisitos[j].id}"
                data-i="${i}" 
                data-j="${j}"
                data-tooltip="${tooltipText}">
                ${getCorrelationDisplay(correlation)}
            </div>`;
        }
        
        roofHTML += '</div>';
    }
    
    roofHTML += '</div>';
    
    // Legenda dos requisitos com sentido de melhoria
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
        cell.addEventListener('click', () => openCorrelationPopup(cell));
        
        // Adiciona hover tooltip
        cell.addEventListener('mouseenter', showTooltip);
        cell.addEventListener('mouseleave', hideTooltip);
    });
    
    // Adiciona tooltips para cabeçalhos
    const headerCells = roofContainer.querySelectorAll('.roof-header-cell');
    headerCells.forEach(cell => {
        cell.addEventListener('mouseenter', showTooltip);
        cell.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(e) {
    const tooltipText = e.target.closest('[data-tooltip]').getAttribute('data-tooltip');
    if (!tooltipText) return;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.innerHTML = tooltipText;
    document.body.appendChild(tooltip);
    
    const rect = e.target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    let top = rect.top - tooltipRect.height - 10;
    
    // Ajusta posição se sair da tela
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top < 10) {
        top = rect.bottom + 10;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.style.opacity = '1';
}

function hideTooltip() {
    const tooltip = document.querySelector('.custom-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
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

function openCorrelationPopup(cell) {
    const req1Id = cell.dataset.req1;
    const req2Id = cell.dataset.req2;
    const i = parseInt(cell.dataset.i);
    const j = parseInt(cell.dataset.j);
    
    const req1 = requisitos[i];
    const req2 = requisitos[j];
    
    const currentCorrelation = qfdDB.getCorrelacaoProjeto(req1Id, req2Id);
    
    // Cria popup modal compacto
    const popup = document.createElement('div');
    popup.className = 'correlation-popup-overlay';
    popup.innerHTML = `
        <div class="correlation-popup">
            <div class="popup-header">
                <h4>Correlação: Req ${i + 1} ↔ Req ${j + 1}</h4>
                <button class="popup-close" onclick="closeCorrelationPopup()">&times;</button>
            </div>
            <div class="popup-body">
                <div class="requirements-compact">
                    <div class="req-compact">
                        <div class="req-info">
                            <span class="req-num">${i + 1}</span>
                            <span class="req-desc">${escapeHtml(req1.descricao.substring(0, 60))}${req1.descricao.length > 60 ? '...' : ''}</span>
                            <span class="req-direction-badge ${req1.sentidoMelhoria}">
                                ${getSentidoSymbol(req1.sentidoMelhoria)}
                            </span>
                        </div>
                    </div>
                    <div class="correlation-vs">↔</div>
                    <div class="req-compact">
                        <div class="req-info">
                            <span class="req-num">${j + 1}</span>
                            <span class="req-desc">${escapeHtml(req2.descricao.substring(0, 60))}${req2.descricao.length > 60 ? '...' : ''}</span>
                            <span class="req-direction-badge ${req2.sentidoMelhoria}">
                                ${getSentidoSymbol(req2.sentidoMelhoria)}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="correlation-quick-select">
                    <button class="corr-quick-btn ${currentCorrelation === '++' ? 'selected' : ''}" data-value="++">
                        <span class="corr-symbol strong-positive">++</span>
                    </button>
                    <button class="corr-quick-btn ${currentCorrelation === '+' ? 'selected' : ''}" data-value="+">
                        <span class="corr-symbol positive">+</span>
                    </button>
                    <button class="corr-quick-btn ${currentCorrelation === '0' ? 'selected' : ''}" data-value="0">
                        <span class="corr-symbol neutral">0</span>
                    </button>
                    <button class="corr-quick-btn ${currentCorrelation === '-' ? 'selected' : ''}" data-value="-">
                        <span class="corr-symbol negative">-</span>
                    </button>
                    <button class="corr-quick-btn ${currentCorrelation === '--' ? 'selected' : ''}" data-value="--">
                        <span class="corr-symbol strong-negative">--</span>
                    </button>
                </div>
                
                <div class="correlation-description" id="correlation-description">
                    ${getCorrelationDescription(currentCorrelation)}
                </div>
            </div>
            <div class="popup-footer">
                <button class="btn btn-sm btn-secondary" onclick="closeCorrelationPopup()">Cancelar</button>
                <button class="btn btn-sm btn-primary" id="save-correlation-popup" onclick="saveCorrelationFromPopup()">
                    Salvar
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(popup);
    
    // Adiciona estilos do popup se não existirem
    addPopupStyles();
    
    // Configura event listeners
    setupPopupEventListeners(req1Id, req2Id, currentCorrelation);
    
    // Posiciona o popup próximo à célula clicada
    positionPopup(popup, cell);
}

function positionPopup(popup, cell) {
    const popupContent = popup.querySelector('.correlation-popup');
    const cellRect = cell.getBoundingClientRect();
    const popupRect = popupContent.getBoundingClientRect();
    
    let left = cellRect.left + (cellRect.width / 2) - (popupRect.width / 2);
    let top = cellRect.bottom + 10;
    
    // Ajusta posição se sair da tela
    if (left < 10) left = 10;
    if (left + popupRect.width > window.innerWidth - 10) {
        left = window.innerWidth - popupRect.width - 10;
    }
    if (top + popupRect.height > window.innerHeight - 10) {
        top = cellRect.top - popupRect.height - 10;
    }
    
    popupContent.style.left = left + 'px';
    popupContent.style.top = top + 'px';
}

function setupPopupEventListeners(req1Id, req2Id, currentCorrelation) {
    let selectedCorrelation = currentCorrelation;
    
    // Event listeners para botões de correlação
    const correlationBtns = document.querySelectorAll('.corr-quick-btn');
    correlationBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            correlationBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedCorrelation = btn.dataset.value;
            
            // Atualiza descrição
            const descriptionDiv = document.getElementById('correlation-description');
            descriptionDiv.innerHTML = getCorrelationDescription(selectedCorrelation);
        });
    });
    
    // Salva referências globais
    window.currentPopupCorrelationData = {
        req1Id, req2Id, selectedCorrelation
    };
}

function getCorrelationDescription(correlation) {
    const descriptions = {
        '++': '<i class="fas fa-arrow-up text-success"></i> <strong>Positiva Muito Forte:</strong> Os requisitos se reforçam significativamente',
        '+': '<i class="fas fa-plus text-success"></i> <strong>Positiva:</strong> Os requisitos se complementam',
        '0': '<i class="fas fa-circle text-muted"></i> <strong>Neutra:</strong> Os requisitos são independentes',
        '-': '<i class="fas fa-minus text-warning"></i> <strong>Negativa:</strong> Os requisitos competem entre si',
        '--': '<i class="fas fa-arrow-down text-danger"></i> <strong>Negativa Muito Forte:</strong> Os requisitos são conflitantes'
    };
    
    return descriptions[correlation] || '<i class="fas fa-question text-muted"></i> <strong>Indefinida:</strong> Selecione uma correlação';
}

function saveCorrelationFromPopup() {
    const data = window.currentPopupCorrelationData;
    if (!data) return;
    
    try {
        qfdDB.setCorrelacaoProjeto(data.req1Id, data.req2Id, data.selectedCorrelation);
        
        closeCorrelationPopup();
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

function closeCorrelationPopup() {
    const popup = document.querySelector('.correlation-popup-overlay');
    if (popup) {
        popup.remove();
    }
    delete window.currentPopupCorrelationData;
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
                <p>Nenhum conflito identificado entre os requisitos!</p>
                <small>Isso indica que os requisitos são bem alinhados ou independentes.</small>
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
                            <i class="fas fa-exclamation-triangle"></i>
                            <span>
                                ${conflict.correlacao === '--' ? 
                                    'Conflito forte: melhorar um prejudica significativamente o outro.' :
                                    'Conflito moderado: estes requisitos competem por recursos ou prioridades.'
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
                <p>Nenhuma sinergia identificada entre os requisitos.</p>
                <small>Considere revisar se alguns requisitos podem se beneficiar mutuamente.</small>
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
    const headers = ['Requisito 1', 'Requisito 2', 'Correlação', 'Tipo', 'Descrição 1', 'Descrição 2', 'Sentido 1', 'Sentido 2'];
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
            req2 ? `"${req2.descricao.replace(/"/g, '""')}"` : 'N/A',
            req1 ? getSentidoLabel(req1.sentidoMelhoria) : 'N/A',
            req2 ? getSentidoLabel(req2.sentidoMelhoria) : 'N/A'
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

function addPopupStyles() {
    if (document.getElementById('correlation-popup-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'correlation-popup-styles';
    styles.textContent = `
        /* Dropdown Menu Styles */
        .nav-dropdown {
            position: relative;
        }
        
        .dropdown-menu {
            position: absolute;
            top: 100%;
            left: 0;
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            min-width: 200px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            z-index: 1000;
        }
        
        .dropdown-menu.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }
        
        .dropdown-menu li {
            list-style: none;
        }
        
        .dropdown-menu a {
            display: block;
            padding: 0.75rem 1rem;
            color: #555;
            text-decoration: none;
            border-bottom: none;
            transition: all 0.2s ease;
        }
        
        .dropdown-menu a:hover,
        .dropdown-menu a.active {
            background: #f8f9ff;
            color: #667eea;
        }
        
        .dropdown-toggle {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .dropdown-toggle .fa-chevron-down {
            transition: transform 0.3s ease;
        }
        
        .dropdown-menu.show + .dropdown-toggle .fa-chevron-down {
            transform: rotate(180deg);
        }
        
        /* Popup Styles */
        .correlation-popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .correlation-popup {
            position: absolute;
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        }
        
        .popup-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 1.5rem;
            border-bottom: 1px solid #e9ecef;
            background: linear-gradient(135deg, #f8f9ff, #e3f2fd);
        }
        
        .popup-header h4 {
            margin: 0;
            color: #333;
            font-size: 1.1rem;
        }
        
        .popup-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #666;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s ease;
        }
        
        .popup-close:hover {
            background: rgba(0, 0, 0, 0.1);
            color: #333;
        }
        
        .popup-body {
            padding: 1.5rem;
        }
        
        .requirements-compact {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
        }
        
        .req-compact {
            flex: 1;
        }
        
        .req-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            flex-wrap: wrap;
        }
        
        .req-num {
            background: #667eea;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: bold;
            flex-shrink: 0;
        }
        
        .req-desc {
            font-size: 0.9rem;
            color: #333;
            line-height: 1.3;
        }
        
        .req-direction-badge {
            padding: 0.2rem 0.4rem;
            border-radius: 3px;
            font-size: 0.7rem;
            font-weight: bold;
            color: white;
            flex-shrink: 0;
        }
        
        .req-direction-badge.up {
            background: #28a745;
        }
        
        .req-direction-badge.down {
            background: #dc3545;
        }
        
        .req-direction-badge.none {
            background: #6c757d;
        }
        
        .correlation-vs {
            font-size: 1.2rem;
            color: #667eea;
            font-weight: bold;
        }
        
        .correlation-quick-select {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
            justify-content: center;
        }
        
        .corr-quick-btn {
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 0.75rem;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 50px;
            height: 50px;
        }
        
        .corr-quick-btn:hover {
            border-color: #667eea;
            background: #f8f9ff;
            transform: scale(1.05);
        }
        
        .corr-quick-btn.selected {
            border-color: #667eea;
            background: linear-gradient(135deg, #f8f9ff, #e3f2fd);
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }
        
        .corr-quick-btn .corr-symbol {
            font-size: 1.2rem;
            font-weight: bold;
        }
        
        .correlation-description {
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            margin-bottom: 1rem;
            font-size: 0.9rem;
        }
        
        .popup-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
            padding: 1rem 1.5rem;
            border-top: 1px solid #e9ecef;
            background: #f8f9fa;
        }
        
        .text-success { color: #28a745 !important; }
        .text-warning { color: #ffc107 !important; }
        .text-danger { color: #dc3545 !important; }
        .text-muted { color: #6c757d !important; }
        
        /* Custom Tooltip */
        .custom-tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 0.75rem;
            border-radius: 6px;
            font-size: 0.8rem;
            line-height: 1.4;
            max-width: 300px;
            z-index: 3000;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        }
        
        .custom-tooltip::before {
            content: '';
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            border: 5px solid transparent;
            border-top-color: rgba(0, 0, 0, 0.9);
        }
        
        /* Enhanced Matrix Styles */
        .roof-header-cell {
            position: relative;
            cursor: help;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
        }
        
        .req-direction {
            font-size: 0.7rem;
            opacity: 0.9;
        }
        
        .roof-cell {
            position: relative;
            cursor: pointer;
        }
        
        .roof-cell::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(102, 126, 234, 0.1);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .roof-cell:hover::after {
            opacity: 1;
        }
        
        @media (max-width: 768px) {
            .correlation-popup {
                width: 95%;
                max-width: none;
            }
            
            .requirements-compact {
                flex-direction: column;
                text-align: center;
            }
            
            .correlation-vs {
                transform: rotate(90deg);
            }
            
            .correlation-quick-select {
                flex-wrap: wrap;
            }
            
            .dropdown-menu {
                position: fixed;
                top: auto;
                left: 10px;
                right: 10px;
                width: auto;
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



// ============================================
// NOVAS FUNCIONALIDADES - MODAL E FILTROS
// ============================================

let currentModalReq1 = null;
let currentModalReq2 = null;
let currentFilterType = 'all';

// Funcao para abrir modal de correlacao instantanea
function openCorrelationModal(req1, req2, i, j) {
    currentModalReq1 = { ...req1, index: i };
    currentModalReq2 = { ...req2, index: j };
    
    const modal = document.getElementById('correlation-modal');
    const modalRequisitos = document.getElementById('modal-requisitos');
    
    const html = `
        <div class="req-info">Requisito ${i + 1}: ${escapeHtml(req1.descricao.substring(0, 60))}${req1.descricao.length > 60 ? '...' : ''}</div>
        <div class="req-desc">Sentido: ${getSentidoLabel(req1.sentidoMelhoria)} ${getSentidoSymbol(req1.sentidoMelhoria)}</div>
        <hr style="margin: 0.75rem 0; border: none; border-top: 1px solid #ddd;">
        <div class="req-info">Requisito ${j + 1}: ${escapeHtml(req2.descricao.substring(0, 60))}${req2.descricao.length > 60 ? '...' : ''}</div>
        <div class="req-desc">Sentido: ${getSentidoLabel(req2.sentidoMelhoria)} ${getSentidoSymbol(req2.sentidoMelhoria)}</div>
    `;
    
    modalRequisitos.innerHTML = html;
    modal.style.display = 'flex';
}

// Funcao para fechar modal
function closeCorrelationModal() {
    const modal = document.getElementById('correlation-modal');
    modal.style.display = 'none';
    currentModalReq1 = null;
    currentModalReq2 = null;
}

// Funcao para definir correlacao via modal
function setCorrelation(value) {
    if (!currentModalReq1 || !currentModalReq2) return;
    
    qfdDB.setCorrelacaoProjeto(currentModalReq1.id, currentModalReq2.id, value);
    
    // Atualizar celula na matriz
    const cell = document.querySelector(
        `.roof-cell[data-req1="${currentModalReq1.id}"][data-req2="${currentModalReq2.id}"]`
    );
    if (cell) {
        cell.innerHTML = getCorrelationDisplay(value);
        cell.classList.add('completed');
    }
    
    // Atualizar status
    loadRequisitos();
    updateStatus();
    
    // Fechar modal
    closeCorrelationModal();
    
    // Atualizar analise se houver correlacoes
    if (correlacoesFeitas > 0) {
        showAnalysis();
    }
}

// Funcao para filtrar analise por tipo de correlacao
function filterAnalysis(type) {
    currentFilterType = type;
    
    // Atualizar botoes ativos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Filtrar itens de analise
    const analysisItems = document.querySelectorAll('.analysis-item');
    analysisItems.forEach(item => {
        const itemType = item.getAttribute('data-correlation-type');
        
        if (type === 'all' || itemType === type) {
            item.classList.remove('hidden');
            item.classList.add('visible');
        } else {
            item.classList.remove('visible');
            item.classList.add('hidden');
        }
    });
}

// Funcao para exportar correlacoes em CSV
function exportCorrelacoes(format) {
    if (format === 'csv') {
        const correlacoes = qfdDB.getCorrelacoesProjeto();
        
        let csv = 'Requisito 1,Requisito 2,Correlacao,Descricao\n';
        
        correlacoes.forEach(corr => {
            const req1 = requisitos.find(r => r.id === corr.req1);
            const req2 = requisitos.find(r => r.id === corr.req2);
            
            if (req1 && req2) {
                const descricao = getCorrelationDescription(corr.value);
                csv += `"${req1.descricao}","${req2.descricao}","${corr.value}","${descricao}"\n`;
            }
        });
        
        downloadCSV(csv, 'correlacoes-projeto.csv');
    }
}

// Funcao para importar correlacoes em CSV
function importCorrelacoes() {
    document.getElementById('import-csv-correlacoes').click();
}

// Funcao para processar importacao de correlacoes CSV
function importCorrelacoesCsv(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csv = e.target.result;
        const lines = csv.split('\n');
        
        let imported = 0;
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '') continue;
            
            const parts = lines[i].split(',');
            if (parts.length >= 3) {
                const descricao1 = parts[0].replace(/"/g, '').trim();
                const descricao2 = parts[1].replace(/"/g, '').trim();
                const valor = parts[2].replace(/"/g, '').trim();
                
                const req1 = requisitos.find(r => r.descricao === descricao1);
                const req2 = requisitos.find(r => r.descricao === descricao2);
                
                if (req1 && req2) {
                    qfdDB.setCorrelacaoProjeto(req1.id, req2.id, valor);
                    imported++;
                }
            }
        }
        
        loadRequisitos();
        setupCorrelation();
        updateStatus();
        
        alert(`${imported} correlacoes importadas com sucesso!`);
    };
    reader.readAsText(file);
    
    // Limpar input
    event.target.value = '';
}

// Funcao auxiliar para descarregar CSV
function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Funcao para obter descricao da correlacao
function getCorrelationDescription(value) {
    const descriptions = {
        '++': 'Correlacao Positiva Muito Forte',
        '+': 'Correlacao Positiva',
        '0': 'Sem Correlacao',
        '-': 'Correlacao Negativa',
        '--': 'Correlacao Negativa Muito Forte'
    };
    return descriptions[value] || 'Nao definida';
}

// Fechar modal ao clicar fora
document.addEventListener('click', function(e) {
    const modal = document.getElementById('correlation-modal');
    if (modal && e.target === modal) {
        closeCorrelationModal();
    }
});

// Fechar modal ao pressionar ESC
// Fechar modal ao pressionar ESC e atalhos de teclado
document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('correlation-modal');
    const isModalOpen = modal && modal.style.display === 'flex';
    
    // ESC para fechar modal
    if (e.key === 'Escape' && isModalOpen) {
        closeCorrelationModal();
        return;
    }
    
    // Atalhos de teclado para definir correlacoes
    if (isModalOpen && currentModalReq1 && currentModalReq2) {
        let correlationValue = null;
        
        // Verificar qual tecla foi pressionada
        if (e.key === '*' || (e.shiftKey && e.key === '8')) {
            correlationValue = '++';
        } else if (e.key === '+' || (e.shiftKey && e.key === '=')) {
            correlationValue = '+';
        } else if (e.key === '0') {
            correlationValue = '0';
        } else if (e.key === '-') {
            correlationValue = '-';
        } else if (e.key === '/' || e.key === '?') {
            correlationValue = '--';
        }
        
        if (correlationValue) {
            e.preventDefault();
            console.log('Atalho de teclado acionado: ' + e.key + ' -> ' + correlationValue);
            setCorrelation(correlationValue);
        }
    }
});
