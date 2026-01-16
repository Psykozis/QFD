/**
 * JavaScript para Página da Matriz QFD Principal - Versão Multiagente
 * Implementa a Casa da Qualidade com escala 1-3-9, tooltips e popups
 */

let requisitosCliente = [];
let requisitosProjeto = [];
let totalRelacoes = 0;
let relacoesFeitas = 0;
let currentCellData = null;

document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupMatrix();
    updateStatus();
    setupGlobalEvents();
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
    generateRoof();
    
    if (relacoesFeitas > 0) {
        showResults();
    }
}

function generateRoof() {
    const roofContainer = document.getElementById('qfd-roof-container');
    if (!roofContainer) return;

    const n = requisitosProjeto.length;
    if (n < 2) {
        roofContainer.style.display = 'none';
        return;
    }

    let roofHTML = '<table class="qfd-roof-table">';
    
    // O telhado é uma matriz triangular rotacionada 45 graus
    // Para simplificar a implementação visual, usaremos uma estrutura de tabela
    // onde as células são rotacionadas via CSS.
    
    for (let i = 0; i < n - 1; i++) {
        roofHTML += '<tr>';
        // Espaçamento inicial para centralizar o triângulo
        for (let s = 0; s < i; s++) {
            roofHTML += '<td style="border:none; width:40px; height:40px;"></td>';
        }
        
        for (let j = i + 1; j < n; j++) {
            const correlation = qfdDB.getCorrelacaoProjeto(requisitosProjeto[i].id, requisitosProjeto[j].id);
            const tooltipText = `<strong>Correlação</strong><br>RP ${i+1}: ${requisitosProjeto[i].descricao}<br>RP ${j+1}: ${requisitosProjeto[j].descricao}<br>Tipo: ${getCorrelationLabel(correlation)}`;
            
            roofHTML += `
                <td class="qfd-roof-cell" data-tooltip="${escapeHtml(tooltipText)}">
                    <span class="symbol">${getCorrelationSymbol(correlation)}</span>
                </td>
            `;
        }
        roofHTML += '</tr>';
    }
    
    roofHTML += '</table>';
    roofContainer.innerHTML = roofHTML;
    
    // Adiciona tooltips ao telhado
    const roofCells = roofContainer.querySelectorAll('[data-tooltip]');
    roofCells.forEach(cell => {
        cell.addEventListener('mouseenter', showTooltip);
        cell.addEventListener('mouseleave', hideTooltip);
    });
}

function generateQFDMatrix() {
    const matrixContainer = document.getElementById('qfd-matrix');
    if (!matrixContainer) return;
    
    let matrixHTML = '<table class="qfd-table">';
    
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

function generateMainHeader() {
    let headerHTML = '<thead class="qfd-header">';
    
    // Linha com números dos requisitos
    headerHTML += '<tr>';
    headerHTML += '<th class="corner-cell">Requisitos</th>';
    
    for (let i = 0; i < requisitosProjeto.length; i++) {
        const tooltipText = `<strong>Requisito de Projeto ${i+1}</strong><br>${requisitosProjeto[i].descricao}`;
        headerHTML += `<th class="req-number-cell" data-tooltip="${escapeHtml(tooltipText)}">
            <div class="req-number">${i + 1}</div>
        </th>`;
    }
    
    headerHTML += '<th class="importance-header" colspan="2">Importância Cliente</th>';
    headerHTML += '</tr>';
    
    // Linha com sentidos de melhoria
    headerHTML += `<tr id="direction-row" class="direction-row">`;
    headerHTML += '<th class="direction-label">Sentido</th>';
    
    for (let i = 0; i < requisitosProjeto.length; i++) {
        const req = requisitosProjeto[i];
        headerHTML += `<th class="direction-cell">
            <div class="direction-symbol ${req.sentidoMelhoria}">
                ${getSentidoSymbol(req.sentidoMelhoria)}
            </div>
        </th>`;
    }
    
    headerHTML += '<th class="importance-cell">Pontos</th>';
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
        const rowTooltip = `<strong>Requisito de Cliente ${i+1}</strong><br>${reqCliente.descricao}`;
        rowsHTML += `<td class="row-header" data-tooltip="${escapeHtml(rowTooltip)}">
            <div class="req-info">
                <span class="req-number">${i + 1}</span>
                <span class="req-text">${truncateText(reqCliente.descricao, 40)}</span>
            </div>
        </td>`;
        
        // Células de influência
        for (let j = 0; j < requisitosProjeto.length; j++) {
            const reqProjeto = requisitosProjeto[j];
            const influencia = qfdDB.getMatrizQFD(reqCliente.id, reqProjeto.id);
            
            const cellTooltip = `<strong>Comparação</strong><br>Cliente: ${reqCliente.descricao}<br>Projeto: ${reqProjeto.descricao}<br>Influência: ${influencia > 0 ? influencia : '0'}`;
            
            rowsHTML += `<td class="influence-cell matriz-cell ${influencia > 0 ? 'filled' : ''}" 
                data-cliente="${reqCliente.id}" 
                data-projeto="${reqProjeto.id}"
                data-i="${i}" 
                data-j="${j}"
                data-tooltip="${escapeHtml(cellTooltip)}">
                ${influencia > 0 ? `<span class="influence-value level-${influencia}">${influencia}</span>` : ''}
            </td>`;
        }
        
        // Colunas de importância divididas
        rowsHTML += `<td class="importance-value-cell">${reqCliente.importancia.toFixed(1)}</td>`;
        rowsHTML += `<td class="importance-percent-cell">${(reqCliente.peso * 100).toFixed(1)}%</td>`;
        
        rowsHTML += '</tr>';
    }
    
    rowsHTML += '</tbody>';
    return rowsHTML;
}

function generateMatrixFooter() {
    let footerHTML = '<tfoot class="qfd-footer">';
    
    // Importância Absoluta
    footerHTML += '<tr><td class="footer-label">Importância Absoluta</td>';
    for (let j = 0; j < requisitosProjeto.length; j++) {
        footerHTML += `<td class="absolute-importance"><span>${requisitosProjeto[j].importanciaAbsoluta.toFixed(1)}</span></td>`;
    }
    footerHTML += '<td class="footer-spacer" colspan="2"></td></tr>';
    
    // Ranking
    footerHTML += '<tr><td class="footer-label">Ranking</td>';
    for (let j = 0; j < requisitosProjeto.length; j++) {
        const req = requisitosProjeto[j];
        footerHTML += `<td class="ranking-cell"><span class="ranking-value ${req.importanciaRelativa <= 3 ? 'top-rank' : ''}">${req.importanciaRelativa}º</span></td>`;
    }
    footerHTML += '<td class="footer-spacer" colspan="2"></td></tr>';
    
    // Peso Relativo
    footerHTML += '<tr><td class="footer-label">Peso Relativo (%)</td>';
    for (let j = 0; j < requisitosProjeto.length; j++) {
        footerHTML += `<td class="relative-weight"><span>${(requisitosProjeto[j].pesoRelativo * 100).toFixed(1)}%</span></td>`;
    }
    footerHTML += '<td class="footer-spacer" colspan="2"></td></tr>';
    
    footerHTML += '</tfoot>';
    return footerHTML;
}

// Event Listeners e Tooltips
function addMatrixEventListeners() {
    const cells = document.querySelectorAll('[data-tooltip]');
    cells.forEach(cell => {
        cell.addEventListener('mouseenter', showTooltip);
        cell.addEventListener('mouseleave', hideTooltip);
        if (cell.classList.contains('influence-cell')) {
            cell.addEventListener('click', () => openInfluenceModal(cell));
        }
    });
    
    setupDropdownMenu();
}

function showTooltip(e) {
    const text = e.currentTarget.getAttribute('data-tooltip');
    if (!text) return;
    
    const tooltip = document.getElementById('qfd-tooltip');
    tooltip.innerHTML = text;
    tooltip.style.display = 'block';
    
    const updatePos = (ev) => {
        let left = ev.clientX + 15;
        let top = ev.clientY + 15;
        
        // Ajuste para não sair da tela
        const tooltipRect = tooltip.getBoundingClientRect();
        if (left + tooltipRect.width > window.innerWidth) {
            left = ev.clientX - tooltipRect.width - 15;
        }
        if (top + tooltipRect.height > window.innerHeight) {
            top = ev.clientY - tooltipRect.height - 15;
        }
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
    };
    
    updatePos(e);
    e.currentTarget.addEventListener('mousemove', updatePos);
    e.currentTarget._updatePos = updatePos;
}

function hideTooltip(e) {
    const tooltip = document.getElementById('qfd-tooltip');
    tooltip.style.display = 'none';
    e.currentTarget.removeEventListener('mousemove', e.currentTarget._updatePos);
}

// Modal de Influência
function openInfluenceModal(cell) {
    currentCellData = {
        clienteId: cell.dataset.cliente,
        projetoId: cell.dataset.projeto,
        i: parseInt(cell.dataset.i),
        j: parseInt(cell.dataset.j)
    };
    
    const reqCliente = requisitosCliente[currentCellData.i];
    const reqProjeto = requisitosProjeto[currentCellData.j];
    
    const infoDiv = document.getElementById('modal-comparison-info');
    infoDiv.innerHTML = `
        <strong>Cliente:</strong> ${reqCliente.descricao}<br><br>
        <strong>Projeto:</strong> ${reqProjeto.descricao}
    `;
    
    document.getElementById('influence-modal').style.display = 'block';
}

function closeInfluenceModal() {
    document.getElementById('influence-modal').style.display = 'none';
    currentCellData = null;
}

function setInfluence(value) {
    if (!currentCellData) return;
    
    qfdDB.setMatrizQFD(currentCellData.clienteId, currentCellData.projetoId, value);
    
    // Recarregar dados e matriz
    loadData();
    generateQFDMatrix();
    generateRoof();
    updateStatus();
    showResults();
    closeInfluenceModal();
}

// Controle de Seções
function toggleRoof() {
    const roof = document.getElementById('qfd-roof-container');
    const btn = document.getElementById('btn-toggle-roof');
    roof.classList.toggle('collapsed');
    
    if (roof.classList.contains('collapsed')) {
        btn.innerHTML = '<i class="fas fa-expand-alt"></i> Mostrar Telhado';
    } else {
        btn.innerHTML = '<i class="fas fa-compress-alt"></i> Recolher Telhado';
    }
}

function toggleDirections() {
    const row = document.getElementById('direction-row');
    const btn = document.getElementById('btn-toggle-directions');
    
    if (row.style.display === 'none') {
        row.style.display = 'table-row';
        btn.innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar Sentidos';
    } else {
        row.style.display = 'none';
        btn.innerHTML = '<i class="fas fa-eye"></i> Mostrar Sentidos';
    }
}

// Funções Auxiliares
function getCorrelationSymbol(corr) {
    const symbols = { '++': '++', '+': '+', '-': '-', '--': '--', '0': '' };
    return symbols[corr] || '';
}

function getCorrelationLabel(corr) {
    const labels = { '++': 'Forte Positiva', '+': 'Positiva', '-': 'Negativa', '--': 'Forte Negativa', '0': 'Neutra' };
    return labels[corr] || 'Neutra';
}

function getSentidoSymbol(sentido) {
    const symbols = { 'up': '↑', 'down': '↓', 'none': '○' };
    return symbols[sentido] || '○';
}

function truncateText(text, limit) {
    if (text.length <= limit) return text;
    return text.substring(0, limit) + '...';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateStatus() {
    document.getElementById('total-req-cliente').textContent = requisitosCliente.length;
    document.getElementById('total-req-projeto').textContent = requisitosProjeto.length;
    
    const totalPossible = requisitosCliente.length * requisitosProjeto.length;
    document.getElementById('relacoes-feitas').textContent = `${relacoesFeitas} / ${totalPossible}`;
    
    const percent = totalPossible > 0 ? Math.round((relacoesFeitas / totalPossible) * 100) : 0;
    document.getElementById('progresso-percentual').textContent = `${percent}%`;
    document.getElementById('progress-fill').style.width = `${percent}%`;
}

function setupGlobalEvents() {
    // Fechar modal ao clicar fora
    window.onclick = function(event) {
        const modal = document.getElementById('influence-modal');
        if (event.target == modal) {
            closeInfluenceModal();
        }
    };
}

function setupDropdownMenu() {
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    
    if (dropdownToggle && dropdownMenu) {
        dropdownToggle.addEventListener('click', function(e) {
            e.preventDefault();
            dropdownMenu.classList.toggle('show');
        });
        
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.nav-dropdown')) {
                dropdownMenu.classList.remove('show');
            }
        });
    }
}

function showResults() {
    const resultsSection = document.getElementById('results-section');
    resultsSection.style.display = 'block';
    showTab('ranking');
}

function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab-panel');
    const buttons = document.querySelectorAll('.tab-btn');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    buttons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`tab-${tabName}`).classList.add('active');
    const activeBtn = Array.from(buttons).find(btn => btn.getAttribute('onclick').includes(tabName));
    if (activeBtn) activeBtn.classList.add('active');
    
    if (tabName === 'ranking') generateRanking();
    if (tabName === 'metrics') generateMetrics();
    if (tabName === 'analysis') generateAnalysis();
}

function generateRanking() {
    const content = document.getElementById('ranking-content');
    const sorted = [...requisitosProjeto].sort((a, b) => b.importanciaAbsoluta - a.importanciaAbsoluta);
    
    let html = '<div class="ranking-list">';
    sorted.forEach((req, index) => {
        html += `
            <div class="ranking-item">
                <div class="rank-number">${index + 1}</div>
                <div class="rank-info">
                    <h4>${req.descricao}</h4>
                    <p>Importância Absoluta: ${req.importanciaAbsoluta.toFixed(1)} | Peso: ${(req.pesoRelativo * 100).toFixed(1)}%</p>
                </div>
            </div>
        `;
    });
    html += '</div>';
    content.innerHTML = html;
}

function generateMetrics() {
    const content = document.getElementById('metrics-content');
    let html = '<table class="table"><thead><tr><th>Requisito de Projeto</th><th>Imp. Absoluta</th><th>Peso Relativo</th></tr></thead><tbody>';
    requisitosProjeto.forEach(req => {
        html += `<tr><td>${req.descricao}</td><td>${req.importanciaAbsoluta.toFixed(1)}</td><td>${(req.pesoRelativo * 100).toFixed(1)}%</td></tr>`;
    });
    html += '</tbody></table>';
    content.innerHTML = html;
}

function generateAnalysis() {
    const content = document.getElementById('analysis-content');
    content.innerHTML = '<p>Análise detalhada dos requisitos de projeto baseada nos pesos calculados.</p>';
}

function resetMatrix() {
    if (confirm('Tem certeza que deseja resetar todas as relações da matriz?')) {
        requisitosCliente.forEach(rc => {
            requisitosProjeto.forEach(rp => {
                qfdDB.setMatrizQFD(rc.id, rp.id, 0);
            });
        });
        loadData();
        generateQFDMatrix();
        generateRoof();
        updateStatus();
        showResults();
    }
}

function autoFillSuggestions() {
    alert('Funcionalidade de sugestões automáticas baseada em palavras-chave (Simulação).');
}

function exportMatrix() {
    alert('Exportando matriz QFD...');
}
