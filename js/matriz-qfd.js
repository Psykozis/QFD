/**
 * ============================================================================
 * MATRIZ QFD - CASA DA QUALIDADE
 * ============================================================================
 * 
 * Este módulo gerencia a matriz QFD principal, que relaciona requisitos
 * de cliente com requisitos de projeto. É o "corpo" da Casa da Qualidade.
 * 
 * A matriz exibe:
 * - Requisitos de cliente nas linhas
 * - Requisitos de projeto nas colunas
 * - Valores de influência nas células (0, 1, 3, 9)
 * - Importância e peso dos requisitos de cliente
 * - Telhado de correlações (roof) entre requisitos de projeto
 * 
 * Funcionalidades:
 * - Visualização interativa da matriz
 * - Edição de valores de influência
 * - Cálculo automático de importância de projeto
 * - Visualização do telhado de correlações
 */

// ========================================================================
// SEÇÃO 1: VARIÁVEIS GLOBAIS E INICIALIZAÇÃO
// ========================================================================

let requisitosCliente = [];
let requisitosProjeto = [];
let relacoesFeitas = 0;
let currentInfluenceCell = null;
let currentInfluenceI = null;
let currentInfluenceJ = null;

/**
 * Inicializa a página quando o DOM está pronto
 */
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupMatrix();
    setupGlobalEvents();
    // Garante que o modal não apareça ao abrir a página
    const influenceModal = document.getElementById('influence-modal');
    if (influenceModal) influenceModal.style.display = 'none';
});

function loadData() {
    requisitosCliente = qfdDB.getRequisitosCliente();
    requisitosProjeto = qfdDB.getRequisitosProjeto();
    relacoesFeitas = qfdDB.getMatrizQFDCompleta().length;
}

function setupMatrix() {
    const hasData = requisitosCliente.length > 0 && requisitosProjeto.length > 0;
    document.getElementById('insufficient-data').style.display = hasData ? 'none' : 'block';
    document.getElementById('qfd-section').style.display = hasData ? 'block' : 'none';
    
    if (hasData) {
        generateQFDMatrix();
        generateRoof();
        updateStatus();
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

    // O telhado é construído como uma grade de diamantes
    let roofHTML = '<div class="roof-grid" style="display: grid; grid-template-columns: repeat(' + n + ', 40px); justify-content: center;">';
    
    for (let row = 0; row < n - 1; row++) {
        for (let col = 0; col < n; col++) {
            if (col > row) {
                const i = row;
                const j = col;
                const correlation = qfdDB.getCorrelacaoProjeto(requisitosProjeto[i].id, requisitosProjeto[j].id);
                const tooltip = `Correlação: RP${i+1} vs RP${j+1}<br>${getCorrelationLabel(correlation)}`;
                
                // Cálculo de posição para o triângulo
                const left = (j + i) * 20;
                const top = (j - i) * 20;
                
                roofHTML += `
                    <div class="qfd-roof-cell" 
                         style="position: absolute; left: ${left}px; top: ${top}px;"
                         data-tooltip="${tooltip}">
                        <span class="symbol">${getCorrelationSymbol(correlation)}</span>
                    </div>`;
            }
        }
    }
    
    roofHTML += '</div>';
    roofContainer.innerHTML = roofHTML;
    
    // Altura dinâmica para o container do telhado
    roofContainer.style.height = (n * 20) + 'px';
    
    const cells = roofContainer.querySelectorAll('[data-tooltip]');
    cells.forEach(cell => {
        cell.addEventListener('mouseenter', showTooltip);
        cell.addEventListener('mouseleave', hideTooltip);
    });
}

function generateQFDMatrix() {
    const matrixContainer = document.getElementById('qfd-matrix');
    if (!matrixContainer) return;
    
    let html = '<table class="qfd-table">';
    
    // Header
    html += '<thead><tr><th class="row-header">Requisitos</th>';
    requisitosProjeto.forEach((_, i) => {
        html += `<th class="req-number-cell" data-tooltip="RP${i+1}: ${escapeHtml(requisitosProjeto[i].descricao)}">${i+1}</th>`;
    });
    html += '<th class="importance-header">Pontos</th><th class="importance-header">Peso %</th></tr></thead>';
    
    // Body
    html += '<tbody>';
    requisitosCliente.forEach((rc, i) => {
        html += `<tr><td class="row-header" data-tooltip="RC${i+1}: ${escapeHtml(rc.descricao)}">${i+1}. ${truncateText(rc.descricao, 30)}</td>`;
        requisitosProjeto.forEach((rp, j) => {
            const val = qfdDB.getMatrizQFD(rc.id, rp.id);
            html += `<td class="influence-cell" data-cliente="${rc.id}" data-projeto="${rp.id}" data-i="${i}" data-j="${j}" onclick="openInfluenceModal(this)">${val || ''}</td>`;
        });
        html += `<td class="importance-value-cell">${rc.importancia.toFixed(1)}</td>`;
        html += `<td class="importance-percent-cell">${(rc.peso * 100).toFixed(1)}%</td></tr>`;
    });
    html += '</tbody></table>';
    
    matrixContainer.innerHTML = html;
}

function showTooltip(e) {
    const text = e.currentTarget.getAttribute('data-tooltip');
    const tooltip = document.getElementById('qfd-tooltip');
    tooltip.innerHTML = text;
    tooltip.style.display = 'block';
    tooltip.style.left = (e.clientX + 15) + 'px';
    tooltip.style.top = (e.clientY + 15) + 'px';
}

function hideTooltip() {
    document.getElementById('qfd-tooltip').style.display = 'none';
}

function openInfluenceModal(cell) {
    const modal = document.getElementById('influence-modal');
    const info = document.getElementById('modal-comparison-info');
    if (!modal || !info) return;

    currentInfluenceCell = cell;
    currentInfluenceI = parseInt(cell.dataset.i);
    currentInfluenceJ = parseInt(cell.dataset.j);

    const clienteId = cell.dataset.cliente;
    const projetoId = cell.dataset.projeto;

    const rc = requisitosCliente[currentInfluenceI];
    const rp = requisitosProjeto[currentInfluenceJ];
    const currentVal = qfdDB.getMatrizQFD(clienteId, projetoId) || 0;

    info.innerHTML = `
        <strong>RC${currentInfluenceI + 1}:</strong> ${escapeHtml(rc?.descricao || '')}<br>
        <strong>RP${currentInfluenceJ + 1}:</strong> ${escapeHtml(rp?.descricao || '')}<br>
        <small>Valor atual: <strong>${currentVal}</strong> (pressione <kbd>Enter</kbd> para salvar e ir para a próxima célula)</small>
    `;

    // Exibe modal centralizado
    modal.style.display = 'flex';

    // Fecha no ESC
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeInfluenceModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

function closeInfluenceModal() {
    const modal = document.getElementById('influence-modal');
    if (modal) modal.style.display = 'none';
    currentInfluenceCell = null;
    currentInfluenceI = null;
    currentInfluenceJ = null;
}

function getNextInfluenceCell(i, j) {
    const rows = requisitosCliente.length;
    const cols = requisitosProjeto.length;
    if (rows === 0 || cols === 0) return null;
    if (j < cols - 1) return { i, j: j + 1 };
    if (i < rows - 1) return { i: i + 1, j: 0 };
    return null;
}

function setInfluence(value) {
    if (!currentInfluenceCell) return;
    const clienteId = currentInfluenceCell.dataset.cliente;
    const projetoId = currentInfluenceCell.dataset.projeto;

    qfdDB.setMatrizQFD(clienteId, projetoId, value);

    // Atualiza a célula imediatamente sem recarregar a página
    currentInfluenceCell.textContent = value === 0 ? '' : String(value);

    // Atualiza contagem de relações feitas e barra
    relacoesFeitas = qfdDB.getMatrizQFDCompleta().length;
    updateStatus();

    // Vai para próxima célula ao pressionar Enter (ou ao clicar e escolher, avançamos também)
    const next = getNextInfluenceCell(currentInfluenceI, currentInfluenceJ);
    if (!next) {
        closeInfluenceModal();
        return;
    }

    const nextCell = document.querySelector(`.influence-cell[data-i="${next.i}"][data-j="${next.j}"]`);
    if (!nextCell) {
        closeInfluenceModal();
        return;
    }

    // Abre automaticamente a próxima
    openInfluenceModal(nextCell);
}

function updateStatus() {
    const total = requisitosCliente.length * requisitosProjeto.length;
    const progresso = total > 0 ? Math.round((relacoesFeitas / total) * 100) : 0;
    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = progresso + '%';
    const text = document.getElementById('progresso-percentual');
    if (text) text.textContent = progresso + '%';
}

function getCorrelationSymbol(corr) {
    const symbols = { '++': '++', '+': '+', '-': '-', '--': '--' };
    return symbols[corr] || '';
}

function getCorrelationLabel(corr) {
    const labels = { '++': 'Forte Positiva', '+': 'Positiva', '-': 'Negativa', '--': 'Forte Negativa' };
    return labels[corr] || 'Neutra';
}

function truncateText(text, limit) {
    return text.length > limit ? text.substring(0, limit) + '...' : text;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setupGlobalEvents() {
    const btnToggleRoof = document.getElementById('btn-toggle-roof');
    if (btnToggleRoof) {
        btnToggleRoof.onclick = () => {
            const roof = document.getElementById('qfd-roof-container');
            roof.style.display = roof.style.display === 'none' ? 'block' : 'none';
        };
    }

    // Fecha modal de influência ao clicar fora do conteúdo
    const influenceModal = document.getElementById('influence-modal');
    if (influenceModal) {
        influenceModal.addEventListener('click', (e) => {
            if (e.target === influenceModal) closeInfluenceModal();
        });
    }

    // Enter: salva o valor atualmente "selecionado" (atalhos 0/1/3/9)
    document.addEventListener('keydown', (e) => {
        const modalOpen = influenceModal && influenceModal.style.display === 'flex';
        if (!modalOpen) return;

        // Enter salva repetindo o último valor escolhido? Preferimos atalhos diretos:
        // 0, 1, 3, 9 definem e avançam; Enter sozinho não muda nada sem uma escolha.
        // Para cumprir o requisito "Enter avança sempre", usamos Enter para repetir o valor atual da célula.
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!currentInfluenceCell) return;
            const clienteId = currentInfluenceCell.dataset.cliente;
            const projetoId = currentInfluenceCell.dataset.projeto;
            const currentVal = qfdDB.getMatrizQFD(clienteId, projetoId) || 0;
            setInfluence(currentVal);
            return;
        }

        // Atalhos: 0 / 1 / 3 / 9 definem diretamente
        if (e.key === '0') { e.preventDefault(); setInfluence(0); }
        if (e.key === '1') { e.preventDefault(); setInfluence(1); }
        if (e.key === '3') { e.preventDefault(); setInfluence(3); }
        if (e.key === '9') { e.preventDefault(); setInfluence(9); }
    });
}
