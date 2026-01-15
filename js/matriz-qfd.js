/**
 * JavaScript para Página da Matriz QFD Principal
 * Implementa a Casa da Qualidade completa com cálculos
 */

let requisitosCliente = [];
let requisitosProjeto = [];
let totalRelacoes = 0;
let relacoesFeitas = 0;

document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupMatrix();
    updateStatus();
});

function loadData() {
    requisitosCliente = qfdDB.getRequisitosCliente();
    requisitosProjeto = qfdDB.getRequisitosProjeto();
    totalRelacoes = requisitosCliente.length * requisitosProjeto.length;
    
    const relacoes = qfdDB.getMatrizQFDCompleta();
    relacoesFeitas = relacoes.length;
}

function setupMatrix() {
    const insufficientDiv = document.getElementById('insufficient-data');
    const qfdSection = document.getElementById('qfd-section');
    const legendSection = document.getElementById('influence-legend');
    const resultsSection = document.getElementById('results-section');
    
    if (requisitosCliente.length === 0 || requisitosProjeto.length === 0) {
        insufficientDiv.style.display = 'block';
        qfdSection.style.display = 'none';
        legendSection.style.display = 'none';
        resultsSection.style.display = 'none';
        return;
    }
    
    insufficientDiv.style.display = 'none';
    qfdSection.style.display = 'block';
    legendSection.style.display = 'block';
    
    generateQFDMatrix();
    
    if (relacoesFeitas > 0) {
        showResults();
    }
}

function generateQFDMatrix() {
    const matrixContainer = document.getElementById('qfd-matrix');
    if (!matrixContainer) return;
    
    let matrixHTML = '<table class="qfd-table">';
    
    // Cabeçalho com telhado (correlações)
    matrixHTML += generateRoofHeader();
    
    // Cabeçalho principal com requisitos de projeto
    matrixHTML += generateMainHeader();
    
    // Linhas da matriz com requisitos de cliente
    matrixHTML += generateMatrixRows();
    
    // Rodapé com cálculos
    matrixHTML += generateMatrixFooter();
    
    matrixHTML += '</table>';
    
    matrixContainer.innerHTML = matrixHTML;
    
    // Adiciona event listeners para as células
    addMatrixEventListeners();
}

function generateRoofHeader() {
    const correlacoes = qfdDB.getCorrelacoesProjeto();
    
    let roofHTML = '<thead class="qfd-roof">';
    
    // Linhas do telhado
    for (let i = 0; i < requisitosProjeto.length - 1; i++) {
        roofHTML += '<tr>';
        
        // Célula vazia para requisitos de cliente
        roofHTML += '<th class="roof-spacer"></th>';
        
        // Células vazias à esquerda
        for (let k = 0; k <= i; k++) {
            roofHTML += '<th class="roof-empty"></th>';
        }
        
        // Células de correlação
        for (let j = i + 1; j < requisitosProjeto.length; j++) {
            const correlation = qfdDB.getCorrelacaoProjeto(requisitosProjeto[i].id, requisitosProjeto[j].id);
            roofHTML += `<th class="roof-cell" title="Correlação entre ${i+1} e ${j+1}">
                ${getCorrelationSymbol(correlation)}
            </th>`;
        }
        
        roofHTML += '</tr>';
    }
    
    roofHTML += '</thead>';
    return roofHTML;
}

function generateMainHeader() {
    let headerHTML = '<thead class="qfd-header">';
    
    // Linha com números dos requisitos
    headerHTML += '<tr>';
    headerHTML += '<th class="corner-cell">Requisitos</th>';
    
    for (let i = 0; i < requisitosProjeto.length; i++) {
        headerHTML += `<th class="req-number-cell" data-tooltip="${escapeHtml(requisitosProjeto[i].descricao)}">
            <div class="req-number">${i + 1}</div>
        </th>`;
    }
    
    headerHTML += '<th class="importance-header">Importância Cliente</th>';
    headerHTML += '</tr>';
    
    // Linha com sentidos de melhoria
    headerHTML += '<tr>';
    headerHTML += '<th class="direction-label">Sentido</th>';
    
    for (let i = 0; i < requisitosProjeto.length; i++) {
        const req = requisitosProjeto[i];
        headerHTML += `<th class="direction-cell">
            <div class="direction-symbol ${req.sentidoMelhoria}">
                ${getSentidoSymbol(req.sentidoMelhoria)}
            </div>
        </th>`;
    }
    
    headerHTML += '<th class="importance-cell">Peso (%)</th>';
    headerHTML += '</tr>';
    
    headerHTML += '</thead>';
    return headerHTML;
}

function generateMatrixRows() {
    let rowsHTML = '<tbody class="qfd-body">';
    
    for (let i = 0; i < requisitosCliente.length; i++) {
        const reqCliente = requisitosCliente[i];
        
        rowsHTML += '<tr class="matrix-row">';
        
        // Cabeçalho da linha (requisito de cliente)
        rowsHTML += `<td class="row-header" data-tooltip="${escapeHtml(reqCliente.descricao)}">
            <div class="req-info">
                <span class="req-number">${i + 1}</span>
                <span class="req-text">${truncateText(reqCliente.descricao, 40)}</span>
            </div>
        </td>`;
        
        // Células de influência
        for (let j = 0; j < requisitosProjeto.length; j++) {
            const reqProjeto = requisitosProjeto[j];
            const influencia = qfdDB.getMatrizQFD(reqCliente.id, reqProjeto.id);
            const tooltipText = `Cliente: ${escapeHtml(reqCliente.descricao)} | Projeto: ${escapeHtml(reqProjeto.descricao)}`;
            
            rowsHTML += `<td class="influence-cell ${influencia > 0 ? 'filled' : ''}" 
                data-cliente="${reqCliente.id}" 
                data-projeto="${reqProjeto.id}"
                data-i="${i}" 
                data-j="${j}"
                data-tooltip="${tooltipText}">
                ${influencia > 0 ? `<span class="influence-value level-${influencia}">${influencia}</span>` : ''}
            </td>`;
        }
        
        // Célula de importância do cliente
        rowsHTML += `<td class="client-importance">
            <div class="importance-info">
                <span class="importance-value">${reqCliente.importancia.toFixed(1)}</span>
                <span class="importance-percent">${(reqCliente.peso * 100).toFixed(1)}%</span>
            </div>
        </td>`;
        
        rowsHTML += '</tr>';
    }
    
    rowsHTML += '</tbody>';
    return rowsHTML;
}

function generateMatrixFooter() {
    let footerHTML = '<tfoot class="qfd-footer">';
    
    // Linha de importância absoluta
    footerHTML += '<tr>';
    footerHTML += '<td class="footer-label">Importância Absoluta</td>';
    
    for (let j = 0; j < requisitosProjeto.length; j++) {
        const req = requisitosProjeto[j];
        footerHTML += `<td class="absolute-importance">
            <span class="abs-value">${req.importanciaAbsoluta.toFixed(1)}</span>
        </td>`;
    }
    
    footerHTML += '<td class="footer-spacer"></td>';
    footerHTML += '</tr>';
    
    // Linha de ranking
    footerHTML += '<tr>';
    footerHTML += '<td class="footer-label">Ranking</td>';
    
    for (let j = 0; j < requisitosProjeto.length; j++) {
        const req = requisitosProjeto[j];
        footerHTML += `<td class="ranking-cell">
            <span class="ranking-value ${req.importanciaRelativa <= 3 ? 'top-rank' : ''}">${req.importanciaRelativa}º</span>
        </td>`;
    }
    
    footerHTML += '<td class="footer-spacer"></td>';
    footerHTML += '</tr>';
    
    // Linha de peso relativo
    footerHTML += '<tr>';
    footerHTML += '<td class="footer-label">Peso Relativo (%)</td>';
    
    for (let j = 0; j < requisitosProjeto.length; j++) {
        const req = requisitosProjeto[j];
        footerHTML += `<td class="relative-weight">
            <span class="weight-value">${(req.pesoRelativo * 100).toFixed(1)}%</span>
        </td>`;
    }
    
    footerHTML += '<td class="footer-spacer"></td>';
    footerHTML += '</tr>';
    
    // Linha de dificuldade técnica
    footerHTML += '<tr>';
    footerHTML += '<td class="footer-label">Dificuldade Técnica</td>';
    
    for (let j = 0; j < requisitosProjeto.length; j++) {
        const req = requisitosProjeto[j];
        footerHTML += `<td class="technical-difficulty">
            <span class="difficulty-value level-${req.dificuldadeTecnica}">${req.dificuldadeTecnica}</span>
        </td>`;
    }
    
    footerHTML += '<td class="footer-spacer"></td>';
    footerHTML += '</tr>';
    
    footerHTML += '</tfoot>';
    return footerHTML;
}

function addMatrixEventListeners() {
    const influenceCells = document.querySelectorAll('.influence-cell');
    influenceCells.forEach(cell => {
        cell.addEventListener('click', () => openInfluenceModal(cell));
        
        // Adiciona hover tooltip
        cell.addEventListener('mouseenter', showTooltip);
        cell.addEventListener('mouseleave', hideTooltip);
    });

    // Adiciona tooltips para cabeçalhos
    const headerCells = document.querySelectorAll('.row-header, .req-number-cell');
    headerCells.forEach(cell => {
        cell.addEventListener('mouseenter', showTooltip);
        cell.addEventListener('mouseleave', hideTooltip);
    });

    setupDropdownMenu();
}

function setupDropdownMenu() {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const menu = this.nextElementSibling;
            if (menu) {
                document.querySelectorAll('.dropdown-menu.show').forEach(openMenu => {
                    if (openMenu !== menu) openMenu.classList.remove('show');
                });
                menu.classList.toggle('show');
            }
        });
    });
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-dropdown')) {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
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

function openInfluenceModal(cell) {
    const clienteId = cell.dataset.cliente;
    const projetoId = cell.dataset.projeto;
    const i = parseInt(cell.dataset.i);
    const j = parseInt(cell.dataset.j);
    
    const reqCliente = requisitosCliente[i];
    const reqProjeto = requisitosProjeto[j];
    
    const currentInfluence = qfdDB.getMatrizQFD(clienteId, projetoId);
    
    // Cria modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content influence-modal">
            <div class="modal-header">
                <h3>Definir Influência</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="influence-question">
                    <h4>Qual a influência do requisito técnico no atendimento da necessidade do cliente?</h4>
                </div>
                
                <div class="requirements-display">
                    <div class="requirement-display client">
                        <div class="req-header">
                            <i class="fas fa-user"></i>
                            <span class="req-label">Requisito de Cliente ${i + 1}</span>
                        </div>
                        <div class="req-description">${escapeHtml(reqCliente.descricao)}</div>
                        <div class="req-meta">
                            <span class="importance-badge">
                                <i class="fas fa-star"></i> Importância: ${reqCliente.importancia.toFixed(1)}
                            </span>
                        </div>
                    </div>
                    
                    <div class="influence-arrow">
                        <i class="fas fa-arrow-down"></i>
                        <span>influencia</span>
                    </div>
                    
                    <div class="requirement-display project">
                        <div class="req-header">
                            <i class="fas fa-cog"></i>
                            <span class="req-label">Requisito de Projeto ${j + 1}</span>
                        </div>
                        <div class="req-description">${escapeHtml(reqProjeto.descricao)}</div>
                        <div class="req-meta">
                            <span class="direction-badge ${reqProjeto.sentidoMelhoria}">
                                ${getSentidoSymbol(reqProjeto.sentidoMelhoria)} ${getSentidoLabel(reqProjeto.sentidoMelhoria)}
                            </span>
                            <span class="difficulty-badge level-${reqProjeto.dificuldadeTecnica}">
                                Dif: ${reqProjeto.dificuldadeTecnica}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="influence-options">
                    <h4>Selecione o nível de influência:</h4>
                    <div class="influence-buttons">
                        <button class="influence-btn ${currentInfluence === 0 ? 'selected' : ''}" data-value="0">
                            <span class="influence-symbol">∅</span>
                            <span class="influence-label">Sem Influência</span>
                            <small>Não há relação significativa</small>
                        </button>
                        <button class="influence-btn ${currentInfluence === 1 ? 'selected' : ''}" data-value="1">
                            <span class="influence-symbol level-1">1</span>
                            <span class="influence-label">Influência Fraca</span>
                            <small>Pouco impacto no atendimento</small>
                        </button>
                        <button class="influence-btn ${currentInfluence === 3 ? 'selected' : ''}" data-value="3">
                            <span class="influence-symbol level-3">3</span>
                            <span class="influence-label">Influência Moderada</span>
                            <small>Impacto moderado no atendimento</small>
                        </button>
                        <button class="influence-btn ${currentInfluence === 5 ? 'selected' : ''}" data-value="5">
                            <span class="influence-symbol level-5">5</span>
                            <span class="influence-label">Influência Forte</span>
                            <small>Grande impacto no atendimento</small>
                        </button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button class="btn btn-primary" id="save-influence" onclick="saveInfluence()">
                    Salvar Influência
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Adiciona estilos do modal se não existirem
    addModalStyles();
    
    // Configura event listeners
    setupInfluenceModalEventListeners(clienteId, projetoId, currentInfluence);
}

function setupInfluenceModalEventListeners(clienteId, projetoId, currentInfluence) {
    let selectedInfluence = currentInfluence;
    
    // Event listeners para botões de influência
    const influenceBtns = document.querySelectorAll('.influence-btn');
    influenceBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            influenceBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedInfluence = parseInt(btn.dataset.value);
        });
    });
    
    // Salva referências globais
    window.currentInfluenceData = {
        clienteId, projetoId, selectedInfluence
    };
}

function saveInfluence() {
    const data = window.currentInfluenceData;
    if (!data) return;
    
    try {
        qfdDB.setMatrizQFD(data.clienteId, data.projetoId, data.selectedInfluence);
        
        closeModal();
        loadData();
        generateQFDMatrix();
        updateStatus();
        showResults();
        
        showAlert('Influência salva com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar influência:', error);
        showAlert('Erro ao salvar influência.', 'danger');
    }
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
    delete window.currentInfluenceData;
}

function updateStatus() {
    const totalClienteElement = document.getElementById('total-req-cliente');
    const totalProjetoElement = document.getElementById('total-req-projeto');
    const relacoesElement = document.getElementById('relacoes-feitas');
    const progressoElement = document.getElementById('progresso-percentual');
    const progressFill = document.getElementById('progress-fill');
    
    if (totalClienteElement) {
        totalClienteElement.textContent = requisitosCliente.length;
    }
    
    if (totalProjetoElement) {
        totalProjetoElement.textContent = requisitosProjeto.length;
    }
    
    if (relacoesElement) {
        relacoesElement.textContent = `${relacoesFeitas} / ${totalRelacoes}`;
    }
    
    const progresso = totalRelacoes > 0 ? Math.round((relacoesFeitas / totalRelacoes) * 100) : 0;
    
    if (progressoElement) {
        progressoElement.textContent = `${progresso}%`;
    }
    
    if (progressFill) {
        progressFill.style.width = `${progresso}%`;
    }
}

function showResults() {
    const resultsSection = document.getElementById('results-section');
    if (!resultsSection) return;
    
    resultsSection.style.display = 'block';
    
    generateRanking();
    generateMetrics();
    generateAnalysis();
}

function generateRanking() {
    const rankingContent = document.getElementById('ranking-content');
    if (!rankingContent) return;
    
    // Ordena requisitos de projeto por importância absoluta
    const sortedRequisitos = [...requisitosProjeto].sort((a, b) => b.importanciaAbsoluta - a.importanciaAbsoluta);
    
    let rankingHTML = '<div class="ranking-list">';
    
    sortedRequisitos.forEach((req, index) => {
        const originalIndex = requisitosProjeto.indexOf(req);
        
        rankingHTML += `
            <div class="ranking-item ${index < 3 ? 'top-rank' : ''}">
                <div class="ranking-position">
                    <span class="position-number">${index + 1}</span>
                    ${index === 0 ? '<i class="fas fa-crown crown-icon"></i>' : ''}
                </div>
                <div class="ranking-content">
                    <div class="ranking-header">
                        <span class="req-number">Req ${originalIndex + 1}</span>
                        <span class="ranking-description">${escapeHtml(req.descricao)}</span>
                    </div>
                    <div class="ranking-attributes">
                        <span class="direction-badge ${req.sentidoMelhoria}">
                            ${getSentidoSymbol(req.sentidoMelhoria)} ${getSentidoLabel(req.sentidoMelhoria)}
                        </span>
                        <span class="difficulty-badge level-${req.dificuldadeTecnica}">
                            Dificuldade: ${req.dificuldadeTecnica}
                        </span>
                    </div>
                    <div class="ranking-metrics">
                        <span class="metric">
                            <i class="fas fa-star"></i>
                            Imp. Abs: <strong>${req.importanciaAbsoluta.toFixed(1)}</strong>
                        </span>
                        <span class="metric">
                            <i class="fas fa-percentage"></i>
                            Peso: <strong>${(req.pesoRelativo * 100).toFixed(1)}%</strong>
                        </span>
                    </div>
                </div>
            </div>
        `;
    });
    
    rankingHTML += '</div>';
    rankingContent.innerHTML = rankingHTML;
}

function generateMetrics() {
    const metricsContent = document.getElementById('metrics-content');
    if (!metricsContent) return;
    
    // Calcula estatísticas
    const totalImportanciaAbsoluta = requisitosProjeto.reduce((sum, req) => sum + req.importanciaAbsoluta, 0);
    const mediaImportancia = totalImportanciaAbsoluta / requisitosProjeto.length;
    const maxImportancia = Math.max(...requisitosProjeto.map(req => req.importanciaAbsoluta));
    const minImportancia = Math.min(...requisitosProjeto.map(req => req.importanciaAbsoluta));
    
    // Distribução por dificuldade
    const dificuldadeDistrib = {};
    requisitosProjeto.forEach(req => {
        dificuldadeDistrib[req.dificuldadeTecnica] = (dificuldadeDistrib[req.dificuldadeTecnica] || 0) + 1;
    });
    
    let metricsHTML = `
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-icon">
                    <i class="fas fa-calculator"></i>
                </div>
                <div class="metric-content">
                    <h4>Importância Total</h4>
                    <span class="metric-value">${totalImportanciaAbsoluta.toFixed(1)}</span>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="metric-content">
                    <h4>Importância Média</h4>
                    <span class="metric-value">${mediaImportancia.toFixed(1)}</span>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-icon">
                    <i class="fas fa-arrow-up"></i>
                </div>
                <div class="metric-content">
                    <h4>Maior Importância</h4>
                    <span class="metric-value">${maxImportancia.toFixed(1)}</span>
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-icon">
                    <i class="fas fa-arrow-down"></i>
                </div>
                <div class="metric-content">
                    <h4>Menor Importância</h4>
                    <span class="metric-value">${minImportancia.toFixed(1)}</span>
                </div>
            </div>
        </div>
        
        <div class="distribution-analysis">
            <h4>Distribuição por Dificuldade Técnica</h4>
            <div class="difficulty-distribution">
    `;
    
    for (let i = 1; i <= 5; i++) {
        const count = dificuldadeDistrib[i] || 0;
        const percentage = requisitosProjeto.length > 0 ? (count / requisitosProjeto.length) * 100 : 0;
        
        metricsHTML += `
            <div class="difficulty-bar">
                <div class="difficulty-label">Nível ${i}</div>
                <div class="difficulty-progress">
                    <div class="difficulty-fill level-${i}" style="width: ${percentage}%"></div>
                </div>
                <div class="difficulty-count">${count}</div>
            </div>
        `;
    }
    
    metricsHTML += '</div></div>';
    metricsContent.innerHTML = metricsHTML;
}

function generateAnalysis() {
    const analysisContent = document.getElementById('analysis-content');
    if (!analysisContent) return;
    
    // Análise de cobertura
    const totalCelulas = requisitosCliente.length * requisitosProjeto.length;
    const celulasPreenchidas = qfdDB.getMatrizQFDCompleta().length;
    const cobertura = totalCelulas > 0 ? (celulasPreenchidas / totalCelulas) * 100 : 0;
    
    // Requisitos críticos (top 20%)
    const sortedRequisitos = [...requisitosProjeto].sort((a, b) => b.importanciaAbsoluta - a.importanciaAbsoluta);
    const numCriticos = Math.max(1, Math.ceil(sortedRequisitos.length * 0.2));
    const requisitosCriticos = sortedRequisitos.slice(0, numCriticos);
    
    // Requisitos subutilizados (com poucas relações)
    const relacoesCount = {};
    qfdDB.getMatrizQFDCompleta().forEach(rel => {
        relacoesCount[rel.requisitoProjeto] = (relacoesCount[rel.requisitoProjeto] || 0) + 1;
    });
    
    const requisitosSubutilizados = requisitosProjeto.filter(req => {
        const count = relacoesCount[req.id] || 0;
        return count < requisitosCliente.length * 0.3; // Menos de 30% de cobertura
    });
    
    let analysisHTML = `
        <div class="analysis-sections">
            <div class="analysis-section">
                <h4><i class="fas fa-chart-pie"></i> Cobertura da Matriz</h4>
                <div class="coverage-info">
                    <div class="coverage-circle">
                        <span class="coverage-percentage">${cobertura.toFixed(1)}%</span>
                    </div>
                    <div class="coverage-details">
                        <p><strong>${celulasPreenchidas}</strong> de <strong>${totalCelulas}</strong> relações definidas</p>
                        <p class="coverage-status ${cobertura >= 50 ? 'good' : cobertura >= 25 ? 'moderate' : 'low'}">
                            ${cobertura >= 50 ? 'Boa cobertura' : cobertura >= 25 ? 'Cobertura moderada' : 'Cobertura baixa'}
                        </p>
                    </div>
                </div>
            </div>
            
            <div class="analysis-section">
                <h4><i class="fas fa-exclamation-circle"></i> Requisitos Críticos</h4>
                <div class="critical-requirements">
    `;
    
    if (requisitosCriticos.length > 0) {
        requisitosCriticos.forEach((req, index) => {
            const originalIndex = requisitosProjeto.indexOf(req);
            analysisHTML += `
                <div class="critical-item">
                    <span class="critical-rank">${index + 1}º</span>
                    <div class="critical-content">
                        <span class="critical-title">Req ${originalIndex + 1}: ${truncateText(req.descricao, 50)}</span>
                        <span class="critical-value">Imp: ${req.importanciaAbsoluta.toFixed(1)}</span>
                    </div>
                </div>
            `;
        });
    } else {
        analysisHTML += '<p class="no-data">Nenhum requisito crítico identificado.</p>';
    }
    
    analysisHTML += `
                </div>
            </div>
            
            <div class="analysis-section">
                <h4><i class="fas fa-exclamation-triangle"></i> Requisitos Subutilizados</h4>
                <div class="underutilized-requirements">
    `;
    
    if (requisitosSubutilizados.length > 0) {
        requisitosSubutilizados.forEach(req => {
            const originalIndex = requisitosProjeto.indexOf(req);
            const count = relacoesCount[req.id] || 0;
            
            analysisHTML += `
                <div class="underutilized-item">
                    <div class="underutilized-content">
                        <span class="underutilized-title">Req ${originalIndex + 1}: ${truncateText(req.descricao, 50)}</span>
                        <span class="underutilized-count">${count} relações</span>
                    </div>
                    <div class="underutilized-suggestion">
                        <i class="fas fa-lightbulb"></i>
                        <span>Considere revisar as relações deste requisito</span>
                    </div>
                </div>
            `;
        });
    } else {
        analysisHTML += '<p class="no-data">Todos os requisitos estão bem utilizados.</p>';
    }
    
    analysisHTML += `
                </div>
            </div>
        </div>
    `;
    
    analysisContent.innerHTML = analysisHTML;
}

function showTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));
    
    // Add active class to selected tab
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

function resetMatrix() {
    if (confirm('Tem certeza que deseja resetar toda a matriz QFD? Esta ação não pode ser desfeita.')) {
        try {
            const relacoes = qfdDB.getMatrizQFDCompleta();
            relacoes.forEach(rel => {
                qfdDB.setMatrizQFD(rel.requisitoCliente, rel.requisitoProjeto, 0);
            });
            
            loadData();
            generateQFDMatrix();
            updateStatus();
            
            const resultsSection = document.getElementById('results-section');
            if (resultsSection) {
                resultsSection.style.display = 'none';
            }
            
            showAlert('Matriz QFD resetada com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao resetar matriz:', error);
            showAlert('Erro ao resetar matriz.', 'danger');
        }
    }
}

function autoFillSuggestions() {
    if (confirm('Deseja preencher automaticamente sugestões baseadas em palavras-chave similares? Isso não substituirá relações já definidas.')) {
        try {
            let sugestoes = 0;
            
            requisitosCliente.forEach(reqCliente => {
                requisitosProjeto.forEach(reqProjeto => {
                    const influenciaAtual = qfdDB.getMatrizQFD(reqCliente.id, reqProjeto.id);
                    
                    if (influenciaAtual === 0) {
                        const similaridade = calculateSimilarity(reqCliente.descricao, reqProjeto.descricao);
                        
                        if (similaridade > 0.3) {
                            const influenciaSugerida = similaridade > 0.7 ? 5 : similaridade > 0.5 ? 3 : 1;
                            qfdDB.setMatrizQFD(reqCliente.id, reqProjeto.id, influenciaSugerida);
                            sugestoes++;
                        }
                    }
                });
            });
            
            if (sugestoes > 0) {
                loadData();
                generateQFDMatrix();
                updateStatus();
                showResults();
                showAlert(`${sugestoes} sugestões aplicadas com sucesso!`, 'success');
            } else {
                showAlert('Nenhuma sugestão encontrada.', 'info');
            }
        } catch (error) {
            console.error('Erro ao aplicar sugestões:', error);
            showAlert('Erro ao aplicar sugestões.', 'danger');
        }
    }
}

function calculateSimilarity(text1, text2) {
    // Algoritmo simples de similaridade baseado em palavras comuns
    const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    const commonWords = words1.filter(word => words2.includes(word));
    const similarity = (commonWords.length * 2) / (words1.length + words2.length);
    
    return similarity;
}

function exportMatrix() {
    try {
        const csvContent = generateMatrixCSV();
        downloadFile(csvContent, `matriz-qfd-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
        showAlert('Matriz QFD exportada com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao exportar matriz:', error);
        showAlert('Erro ao exportar matriz.', 'danger');
    }
}

function generateMatrixCSV() {
    // Cabeçalho
    const headers = ['Requisito Cliente', ...requisitosProjeto.map((req, i) => `Req Proj ${i + 1}`), 'Importância Cliente', 'Peso Cliente (%)'];
    
    // Linhas de dados
    const rows = requisitosCliente.map((reqCliente, i) => {
        const row = [`"${reqCliente.descricao.replace(/"/g, '""')}"`];
        
        // Influências
        requisitosProjeto.forEach(reqProjeto => {
            const influencia = qfdDB.getMatrizQFD(reqCliente.id, reqProjeto.id);
            row.push(influencia || '');
        });
        
        // Importância e peso do cliente
        row.push(reqCliente.importancia.toFixed(2));
        row.push((reqCliente.peso * 100).toFixed(2));
        
        return row;
    });
    
    // Linhas de rodapé
    const footerRows = [
        ['Importância Absoluta', ...requisitosProjeto.map(req => req.importanciaAbsoluta.toFixed(2)), '', ''],
        ['Ranking', ...requisitosProjeto.map(req => req.importanciaRelativa), '', ''],
        ['Peso Relativo (%)', ...requisitosProjeto.map(req => (req.pesoRelativo * 100).toFixed(2)), '', ''],
        ['Dificuldade Técnica', ...requisitosProjeto.map(req => req.dificuldadeTecnica), '', ''],
        ['Descrição Req Projeto', ...requisitosProjeto.map(req => `"${req.descricao.replace(/"/g, '""')}"`), '', '']
    ];
    
    return [headers, ...rows, [], ...footerRows].map(row => row.join(',')).join('\n');
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

// Funções utilitárias
function getCorrelationSymbol(correlation) {
    const symbols = {
        '++': '<span class="corr-symbol strong-positive">++</span>',
        '+': '<span class="corr-symbol positive">+</span>',
        '0': '<span class="corr-symbol neutral">0</span>',
        '-': '<span class="corr-symbol negative">-</span>',
        '--': '<span class="corr-symbol strong-negative">--</span>'
    };
    return symbols[correlation] || '';
}

function getSentidoSymbol(sentido) {
    const symbols = { 'up': '↑', 'down': '↓', 'none': '*' };
    return symbols[sentido] || '?';
}

function getSentidoLabel(sentido) {
    const labels = { 'up': 'Crescente', 'down': 'Decrescente', 'none': 'Nominal' };
    return labels[sentido] || 'Indefinido';
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
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
    if (document.getElementById('influence-modal-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'influence-modal-styles';
    styles.textContent = `
        .influence-modal {
            max-width: 700px;
            width: 95%;
        }
        
        .requirements-display {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .requirement-display {
            padding: 1rem;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            background: #f8f9fa;
        }
        
        .requirement-display.client {
            border-left-color: #667eea;
        }
        
        .requirement-display.project {
            border-left-color: #28a745;
        }
        
        .influence-arrow {
            text-align: center;
            color: #667eea;
            font-size: 1.2rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
        }
        
        .req-meta {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.5rem;
            flex-wrap: wrap;
        }
        
        .importance-badge, .direction-badge, .difficulty-badge {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            color: white;
        }
        
        .importance-badge {
            background: #ffc107;
            color: #212529;
        }
        
        .influence-options h4 {
            text-align: center;
            margin-bottom: 1rem;
            color: #333;
        }
        
        .influence-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 0.5rem;
        }
        
        .influence-btn {
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
        
        .influence-btn:hover {
            border-color: #667eea;
            background: #f8f9ff;
        }
        
        .influence-btn.selected {
            border-color: #667eea;
            background: linear-gradient(135deg, #f8f9ff, #e3f2fd);
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
        }
        
        .influence-symbol {
            font-size: 1.5rem;
            font-weight: bold;
            color: #6c757d;
        }
        
        .influence-symbol.level-1 {
            color: #28a745;
        }
        
        .influence-symbol.level-3 {
            color: #ffc107;
        }
        
        .influence-symbol.level-5 {
            color: #dc3545;
        }
        
        .influence-label {
            font-weight: 600;
            font-size: 0.9rem;
            color: #333;
        }
        
        .influence-btn small {
            font-size: 0.8rem;
            color: #666;
            line-height: 1.2;
        }
        
        @media (max-width: 768px) {
            .influence-buttons {
                grid-template-columns: 1fr;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

// Adiciona estilos específicos da página
document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('matriz-qfd-styles')) {
        const styles = document.createElement('style');
        styles.id = 'matriz-qfd-styles';
        styles.textContent = `
            .qfd-card {
                overflow-x: auto;
            }
            
            .qfd-actions {
                display: flex;
                gap: 0.5rem;
                margin-left: auto;
            }
            
            .qfd-instructions {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
            }
            
            .qfd-instructions h4 {
                margin: 0 0 1rem 0;
                color: #333;
            }
            
            .qfd-container {
                overflow-x: auto;
                padding: 1rem 0;
            }
            
            .qfd-matrix-wrapper {
                min-width: fit-content;
            }
            
            .qfd-table {
                border-collapse: collapse;
                width: 100%;
                min-width: 800px;
                background: white;
                border: 2px solid #667eea;
                border-radius: 8px;
            }
            
            .qfd-table th,
            .qfd-table td {
                border: 1px solid #dee2e6;
                padding: 0.5rem;
                text-align: center;
                vertical-align: middle;
                min-width: 60px;
                min-height: 40px;
            }
            
            .qfd-roof th {
                background: #f8f9fa;
                height: 30px;
            }
            
            .roof-spacer {
                background: #667eea;
                color: white;
                font-weight: bold;
                writing-mode: vertical-rl;
                text-orientation: mixed;
                width: 200px;
            }
            
            .roof-empty {
                background: transparent;
                border: none;
            }
            
            .roof-cell {
                background: #e8f5e8;
                font-weight: bold;
            }
            
            .qfd-header th {
                background: #667eea;
                color: white;
                font-weight: bold;
            }
            
            .corner-cell {
                background: #495057 !important;
                width: 200px;
            }
            
            .req-number-cell {
                width: 60px;
            }
            
            .req-number {
                background: white;
                color: #667eea;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 0.9rem;
            }
            
            .direction-label {
                background: #6c757d !important;
            }
            
            .direction-cell {
                background: #f8f9fa !important;
                color: #333 !important;
            }
            
            .direction-symbol {
                font-size: 1.2rem;
                font-weight: bold;
            }
            
            .direction-symbol.up {
                color: #28a745;
            }
            
            .direction-symbol.down {
                color: #dc3545;
            }
            
            .direction-symbol.none {
                color: #6c757d;
            }
            
            .importance-header,
            .importance-cell {
                background: #ffc107 !important;
                color: #212529 !important;
                width: 120px;
            }
            
            .row-header {
                background: #f8f9fa !important;
                text-align: left !important;
                width: 200px;
                padding: 0.75rem !important;
            }
            
            .req-info {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .req-info .req-number {
                background: #667eea;
                color: white;
                flex-shrink: 0;
            }
            
            .req-text {
                font-size: 0.85rem;
                line-height: 1.2;
            }
            
            .influence-cell {
                cursor: pointer;
                transition: all 0.3s ease;
                background: white;
                position: relative;
            }
            
            .influence-cell:hover {
                background: #f8f9ff;
                border-color: #667eea;
                transform: scale(1.05);
            }
            
            .influence-cell.filled {
                background: #e8f5e8;
            }
            
            .influence-value {
                font-weight: bold;
                font-size: 1.1rem;
                color: white;
                background: #6c757d;
                width: 25px;
                height: 25px;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }
            
            .influence-value.level-1 {
                background: #28a745;
            }
            
            .influence-value.level-3 {
                background: #ffc107;
                color: #212529;
            }
            
            .influence-value.level-5 {
                background: #dc3545;
            }
            
            .client-importance {
                background: #fff3cd !important;
                border-left: 3px solid #ffc107 !important;
            }
            
            .importance-info {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }
            
            .importance-value {
                font-weight: bold;
                font-size: 1rem;
                color: #856404;
            }
            
            .importance-percent {
                font-size: 0.8rem;
                color: #6c757d;
            }
            
            .qfd-footer td {
                background: #f8f9fa;
                font-weight: 600;
            }
            
            .footer-label {
                background: #6c757d !important;
                color: white !important;
                text-align: left !important;
                padding: 0.75rem !important;
            }
            
            .absolute-importance {
                background: #e3f2fd !important;
                color: #1976d2 !important;
            }
            
            .abs-value {
                font-weight: bold;
                font-size: 1rem;
            }
            
            .ranking-cell {
                background: #fff3e0 !important;
                color: #f57c00 !important;
            }
            
            .ranking-value {
                font-weight: bold;
                font-size: 1rem;
            }
            
            .ranking-value.top-rank {
                color: #d32f2f !important;
                background: #ffebee;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
            }
            
            .relative-weight {
                background: #e8f5e8 !important;
                color: #2e7d32 !important;
            }
            
            .weight-value {
                font-weight: bold;
                font-size: 1rem;
            }
            
            .technical-difficulty {
                background: #fce4ec !important;
                color: #c2185b !important;
            }
            
            .difficulty-value {
                font-weight: bold;
                font-size: 1rem;
                color: white;
                background: #6c757d;
                width: 25px;
                height: 25px;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
            }
            
            .difficulty-value.level-1 {
                background: #28a745;
            }
            
            .difficulty-value.level-2 {
                background: #20c997;
            }
            
            .difficulty-value.level-3 {
                background: #ffc107;
                color: #212529;
            }
            
            .difficulty-value.level-4 {
                background: #fd7e14;
            }
            
            .difficulty-value.level-5 {
                background: #dc3545;
            }
            
            .footer-spacer {
                background: transparent !important;
                border: none !important;
            }
            
            .influence-levels {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1rem;
            }
            
            .influence-level {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid #667eea;
            }
            
            .influence-symbol {
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
            
            .influence-symbol.level-1 {
                background: #28a745;
            }
            
            .influence-symbol.level-3 {
                background: #ffc107;
                color: #212529;
            }
            
            .influence-symbol.level-5 {
                background: #dc3545;
            }
            
            .influence-info h4 {
                margin: 0 0 0.5rem 0;
                color: #333;
                font-size: 1rem;
            }
            
            .influence-info p {
                margin: 0;
                color: #666;
                font-size: 0.9rem;
                line-height: 1.4;
            }
            
            .results-tabs {
                margin-top: 1rem;
            }
            
            .tab-buttons {
                display: flex;
                border-bottom: 2px solid #e9ecef;
                margin-bottom: 1.5rem;
            }
            
            .tab-btn {
                background: none;
                border: none;
                padding: 1rem 1.5rem;
                cursor: pointer;
                font-weight: 600;
                color: #6c757d;
                border-bottom: 3px solid transparent;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .tab-btn:hover {
                color: #667eea;
                background: #f8f9ff;
            }
            
            .tab-btn.active {
                color: #667eea;
                border-bottom-color: #667eea;
                background: #f8f9ff;
            }
            
            .tab-panel {
                display: none;
            }
            
            .tab-panel.active {
                display: block;
            }
            
            .ranking-list {
                display: grid;
                gap: 1rem;
            }
            
            .ranking-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                transition: all 0.3s ease;
            }
            
            .ranking-item:hover {
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .ranking-item.top-rank {
                border-left: 4px solid #ffd700;
                background: linear-gradient(135deg, #fff9c4, #ffffff);
            }
            
            .ranking-position {
                position: relative;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 1.2rem;
                flex-shrink: 0;
            }
            
            .crown-icon {
                position: absolute;
                top: -10px;
                right: -5px;
                color: #ffd700;
                font-size: 1rem;
            }
            
            .ranking-content {
                flex: 1;
            }
            
            .ranking-header {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
            }
            
            .ranking-header .req-number {
                background: #667eea;
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: bold;
            }
            
            .ranking-description {
                font-weight: 600;
                color: #333;
                line-height: 1.4;
            }
            
            .ranking-attributes {
                display: flex;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
                flex-wrap: wrap;
            }
            
            .ranking-metrics {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }
            
            .metric {
                color: #666;
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 0.25rem;
            }
            
            .metric i {
                color: #667eea;
            }
            
            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .metric-card {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1.5rem;
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                border-left: 4px solid #667eea;
            }
            
            .metric-icon {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
                flex-shrink: 0;
            }
            
            .metric-content h4 {
                margin: 0 0 0.5rem 0;
                color: #333;
                font-size: 1rem;
            }
            
            .metric-value {
                font-size: 1.5rem;
                font-weight: bold;
                color: #667eea;
            }
            
            .distribution-analysis {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 1.5rem;
            }
            
            .distribution-analysis h4 {
                margin: 0 0 1rem 0;
                color: #333;
            }
            
            .difficulty-distribution {
                display: grid;
                gap: 0.75rem;
            }
            
            .difficulty-bar {
                display: grid;
                grid-template-columns: 80px 1fr 40px;
                align-items: center;
                gap: 1rem;
            }
            
            .difficulty-label {
                font-size: 0.9rem;
                font-weight: 600;
                color: #333;
            }
            
            .difficulty-progress {
                background: #e9ecef;
                height: 20px;
                border-radius: 10px;
                overflow: hidden;
            }
            
            .difficulty-fill {
                height: 100%;
                transition: width 0.3s ease;
            }
            
            .difficulty-fill.level-1 {
                background: #28a745;
            }
            
            .difficulty-fill.level-2 {
                background: #20c997;
            }
            
            .difficulty-fill.level-3 {
                background: #ffc107;
            }
            
            .difficulty-fill.level-4 {
                background: #fd7e14;
            }
            
            .difficulty-fill.level-5 {
                background: #dc3545;
            }
            
            .difficulty-count {
                font-weight: bold;
                color: #333;
                text-align: center;
            }
            
            .analysis-sections {
                display: grid;
                gap: 2rem;
            }
            
            .analysis-section {
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 1.5rem;
            }
            
            .analysis-section h4 {
                margin: 0 0 1rem 0;
                color: #333;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .coverage-info {
                display: flex;
                align-items: center;
                gap: 2rem;
            }
            
            .coverage-circle {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                background: conic-gradient(#667eea 0deg, #667eea calc(var(--coverage, 0) * 3.6deg), #e9ecef calc(var(--coverage, 0) * 3.6deg), #e9ecef 360deg);
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
                flex-shrink: 0;
            }
            
            .coverage-circle::before {
                content: '';
                width: 70px;
                height: 70px;
                background: white;
                border-radius: 50%;
                position: absolute;
            }
            
            .coverage-percentage {
                font-size: 1.2rem;
                font-weight: bold;
                color: #333;
                z-index: 1;
            }
            
            .coverage-details p {
                margin: 0 0 0.5rem 0;
                color: #666;
            }
            
            .coverage-status {
                font-weight: 600;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.9rem;
            }
            
            .coverage-status.good {
                background: #d4edda;
                color: #155724;
            }
            
            .coverage-status.moderate {
                background: #fff3cd;
                color: #856404;
            }
            
            .coverage-status.low {
                background: #f8d7da;
                color: #721c24;
            }
            
            .critical-requirements, .underutilized-requirements {
                display: grid;
                gap: 0.75rem;
            }
            
            .critical-item, .underutilized-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 0.75rem;
                background: #f8f9fa;
                border-radius: 6px;
                border-left: 3px solid #667eea;
            }
            
            .critical-rank {
                background: #667eea;
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 0.9rem;
                flex-shrink: 0;
            }
            
            .critical-content, .underutilized-content {
                flex: 1;
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 1rem;
            }
            
            .critical-title, .underutilized-title {
                font-weight: 600;
                color: #333;
                font-size: 0.9rem;
            }
            
            .critical-value, .underutilized-count {
                font-weight: bold;
                color: #667eea;
                font-size: 0.9rem;
            }
            
            .underutilized-suggestion {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.8rem;
                color: #856404;
                background: #fff3cd;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
            }
            
            .no-data {
                text-align: center;
                color: #6c757d;
                font-style: italic;
                padding: 2rem;
            }
            
            @media (max-width: 1200px) {
                .qfd-table {
                    min-width: 1000px;
                }
            }
            
            @media (max-width: 768px) {
                .qfd-actions {
                    flex-direction: column;
                }
                
                .tab-buttons {
                    flex-wrap: wrap;
                }
                
                .tab-btn {
                    padding: 0.75rem 1rem;
                    font-size: 0.9rem;
                }
                
                .metrics-grid {
                    grid-template-columns: 1fr;
                }
                
                .coverage-info {
                    flex-direction: column;
                    text-align: center;
                }
                
                .critical-content, .underutilized-content {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.5rem;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
});

