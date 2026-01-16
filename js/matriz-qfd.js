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
    let roofHTML = `<thead id="qfd-roof" class="qfd-roof">`;
    
    // Linhas do telhado
    for (let i = 0; i < requisitosProjeto.length - 1; i++) {
        roofHTML += '<tr>';
        roofHTML += '<th class="roof-spacer"></th>';
        
        for (let k = 0; k <= i; k++) {
            roofHTML += '<th class="roof-empty"></th>';
        }
        
        for (let j = i + 1; j < requisitosProjeto.length; j++) {
            const correlation = qfdDB.getCorrelacaoProjeto(requisitosProjeto[i].id, requisitosProjeto[j].id);
            const tooltipText = `<strong>Correlação de Projeto</strong>Req ${i+1}: ${requisitosProjeto[i].descricao}<br>Req ${j+1}: ${requisitosProjeto[j].descricao}`;
            
            roofHTML += `<th class="roof-cell" data-tooltip="${escapeHtml(tooltipText)}">
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
        const tooltipText = `<strong>Requisito de Projeto ${i+1}</strong>${requisitosProjeto[i].descricao}`;
        headerHTML += `<th class="req-number-cell" data-tooltip="${escapeHtml(tooltipText)}">
            <div class="req-number">${i + 1}</div>
        </th>`;
    }
    
    headerHTML += '<th class="importance-header">Importância Cliente</th>';
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
        const rowTooltip = `<strong>Requisito de Cliente ${i+1}</strong>${reqCliente.descricao}`;
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
            
            const cellTooltip = `<strong>Comparação</strong>Cliente: ${reqCliente.descricao}<br>Projeto: ${reqProjeto.descricao}<br>Influência: ${influencia > 0 ? influencia : '0'}`;
            
            rowsHTML += `<td class="influence-cell matriz-cell ${influencia > 0 ? 'filled' : ''}" 
                data-cliente="${reqCliente.id}" 
                data-projeto="${reqProjeto.id}"
                data-i="${i}" 
                data-j="${j}"
                data-tooltip="${escapeHtml(cellTooltip)}">
                ${influencia > 0 ? `<span class="influence-value level-${influencia}">${influencia}</span>` : ''}
            </td>`;
        }
        
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
    
    // Importância Absoluta
    footerHTML += '<tr><td class="footer-label">Importância Absoluta</td>';
    for (let j = 0; j < requisitosProjeto.length; j++) {
        footerHTML += `<td class="absolute-importance"><span>${requisitosProjeto[j].importanciaAbsoluta.toFixed(1)}</span></td>`;
    }
    footerHTML += '<td class="footer-spacer"></td></tr>';
    
    // Ranking
    footerHTML += '<tr><td class="footer-label">Ranking</td>';
    for (let j = 0; j < requisitosProjeto.length; j++) {
        const req = requisitosProjeto[j];
        footerHTML += `<td class="ranking-cell"><span class="ranking-value ${req.importanciaRelativa <= 3 ? 'top-rank' : ''}">${req.importanciaRelativa}º</span></td>`;
    }
    footerHTML += '<td class="footer-spacer"></td></tr>';
    
    // Peso Relativo
    footerHTML += '<tr><td class="footer-label">Peso Relativo (%)</td>';
    for (let j = 0; j < requisitosProjeto.length; j++) {
        footerHTML += `<td class="relative-weight"><span>${(requisitosProjeto[j].pesoRelativo * 100).toFixed(1)}%</span></td>`;
    }
    footerHTML += '<td class="footer-spacer"></td></tr>';
    
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
    
    const moveTooltip = (ev) => {
        tooltip.style.left = (ev.clientX + 15) + 'px';
        tooltip.style.top = (ev.clientY + 15) + 'px';
    };
    
    e.currentTarget.addEventListener('mousemove', moveTooltip);
    e.currentTarget._moveTooltip = moveTooltip;
}

function hideTooltip(e) {
    const tooltip = document.getElementById('qfd-tooltip');
    tooltip.style.display = 'none';
    e.currentTarget.removeEventListener('mousemove', e.currentTarget._moveTooltip);
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
    updateStatus();
    showResults();
    closeInfluenceModal();
}

// Controle de Seções
function toggleRoof() {
    const roof = document.getElementById('qfd-roof');
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
    row.classList.toggle('collapsed');
    
    if (row.classList.contains('collapsed')) {
        btn.innerHTML = '<i class="fas fa-expand-alt"></i> Mostrar Direções';
    } else {
        btn.innerHTML = '<i class="fas fa-compress-alt"></i> Recolher Direções';
    }
}

// Menu Dropdown
function setupDropdownMenu() {
    const dropdowns = document.querySelectorAll('.nav-dropdown');
    dropdowns.forEach(drop => {
        const toggle = drop.querySelector('.dropdown-toggle');
        const menu = drop.querySelector('.dropdown-menu');
        
        toggle.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Fecha outros
            document.querySelectorAll('.dropdown-menu.show').forEach(m => {
                if (m !== menu) m.classList.remove('show');
            });
            
            menu.classList.toggle('show');
        };
    });
}

function setupGlobalEvents() {
    window.onclick = (e) => {
        if (!e.target.closest('.nav-dropdown')) {
            document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
        }
        if (e.target.id === 'influence-modal') {
            closeInfluenceModal();
        }
    };
}

// Funções Auxiliares (Mantendo Legado)
function getCorrelationSymbol(type) {
    switch(type) {
        case 'strong_positive': return '++';
        case 'positive': return '+';
        case 'negative': return '-';
        case 'strong_negative': return '--';
        default: return '';
    }
}

function getSentidoSymbol(sentido) {
    switch(sentido) {
        case 'up': return '<i class="fas fa-arrow-up"></i>';
        case 'down': return '<i class="fas fa-arrow-down"></i>';
        case 'none': return '<i class="fas fa-circle"></i>';
        default: return '';
    }
}

function truncateText(text, length) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateStatus() {
    document.getElementById('total-req-cliente').textContent = requisitosCliente.length;
    document.getElementById('total-req-projeto').textContent = requisitosProjeto.length;
    document.getElementById('relacoes-feitas').textContent = `${relacoesFeitas} / ${totalRelacoes}`;
    
    const percent = totalRelacoes > 0 ? Math.round((relacoesFeitas / totalRelacoes) * 100) : 0;
    document.getElementById('progresso-percentual').textContent = `${percent}%`;
    document.getElementById('progress-fill').style.width = `${percent}%`;
}

function showResults() {
    document.getElementById('results-section').style.display = 'block';
    // Aqui chamaria a lógica de ranking e métricas (mantendo legado)
    if (typeof updateRanking === 'function') updateRanking();
}

// Funções de Exportação (Mantendo Legado)
function exportProjectData() {
    const data = qfdDB.loadData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_qfd_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

function importProjectData(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            qfdDB.saveData(data);
            location.reload();
        } catch (err) {
            alert('Erro ao importar arquivo JSON.');
        }
    };
    reader.readAsText(file);
}
