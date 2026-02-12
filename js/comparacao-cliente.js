/**
 * ============================================================================
 * COMPARAÇÃO DE REQUISITOS DE CLIENTE - DIAGRAMA DE MUDGE
 * ============================================================================
 * 
 * Este módulo implementa o Diagrama de Mudge para hierarquização de
 * requisitos de cliente através de comparações pareadas.
 * 
 * O Diagrama de Mudge permite determinar a importância relativa de cada
 * requisito comparando-os dois a dois. Cada comparação indica qual requisito
 * é mais importante e em que grau:
 * - Valor 1: Pouco mais importante
 * - Valor 3: Moderadamente mais importante  
 * - Valor 5: Muito mais importante
 * 
 * Funcionalidades:
 * - Matriz triangular de comparações
 * - Modal interativo para comparações
 * - Cálculo automático de importância e pesos
 * - Visualização de resultados
 */

// ========================================================================
// SEÇÃO 1: VARIÁVEIS GLOBAIS E INICIALIZAÇÃO
// ========================================================================

let requisitos = [];
let totalComparacoes = 0;
let comparacoesFeitas = 0;

/**
 * Inicializa a página quando o DOM está pronto
 */
document.addEventListener('DOMContentLoaded', function() {
    loadRequisitos();
    setupComparison();
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
        
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.nav-dropdown')) {
                dropdownMenu.classList.remove('show');
            }
        });
    }
}

function loadRequisitos() {
    requisitos = qfdDB.getRequisitosCliente();
    totalComparacoes = calculateTotalComparisons(requisitos.length);
    
    const comparacoes = qfdDB.getComparacoesCliente();
    comparacoesFeitas = comparacoes.length;
}

function calculateTotalComparisons(count) {
    return count > 1 ? (count * (count - 1)) / 2 : 0;
}

function setupComparison() {
    const insufficientDiv = document.getElementById('insufficient-requirements');
    const instructionsSection = document.getElementById('instructions-section');
    const comparisonSection = document.getElementById('comparison-section');
    const legendSection = document.getElementById('legend-section');
    const resultsSection = document.getElementById('results-section');
    
    if (requisitos.length < 2) {
        insufficientDiv.style.display = 'block';
        if (instructionsSection) instructionsSection.style.display = 'none';
        comparisonSection.style.display = 'none';
        if (legendSection) legendSection.style.display = 'none';
        resultsSection.style.display = 'none';
        return;
    }
    
    insufficientDiv.style.display = 'none';
    if (instructionsSection) instructionsSection.style.display = 'block';
    comparisonSection.style.display = 'block';
    if (legendSection) legendSection.style.display = 'block';
    
    generateComparisonMatrix();
    generateLegend();
    
    if (comparacoesFeitas === totalComparacoes) {
        showResults();
    }
}

function generateComparisonMatrix() {
    const matrixContainer = document.getElementById('comparison-matrix');
    if (!matrixContainer) return;
    
    const somatorios = calculateSummaries();
    
    let matrixHTML = '<div class="matrix-table-wrapper">';
    matrixHTML += '<div class="matrix-table">';
    
    // Cabeçalho
    matrixHTML += '<div class="matrix-row matrix-header">';
    matrixHTML += '<div class="matrix-cell matrix-corner">Req.</div>';
    
    for (let i = 0; i < requisitos.length; i++) {
        const tooltipText = `Requisito ${i + 1}: ${escapeHtml(requisitos[i].descricao)}`;
        matrixHTML += `<div class="matrix-cell matrix-header-cell" data-tooltip="${tooltipText}">
            <div class="header-content">
                <span class="req-number">${i + 1}</span>
                <div class="req-desc-mini">${truncateText(requisitos[i].descricao, 15)}</div>
                <span class="req-summary">${somatorios.colunas[i] || 0}</span>
            </div>
        </div>`;
    }
    
    matrixHTML += `<div class="matrix-cell matrix-total-header">
        <div class="total-content"><span class="total-label">Total</span><span class="total-value">${somatorios.total}</span></div>
    </div></div>`;
    
    // Linhas
    for (let i = 0; i < requisitos.length; i++) {
        matrixHTML += '<div class="matrix-row">';
        const tooltipText = `Requisito ${i + 1}: ${escapeHtml(requisitos[i].descricao)}`;
        matrixHTML += `<div class="matrix-cell matrix-row-header" data-tooltip="${tooltipText}">
            <div class="row-header-content">
                <span class="req-number">${i + 1}</span>
                <span class="req-text">${truncateText(requisitos[i].descricao, 25)}</span>
            </div>
        </div>`;
        
        for (let j = 0; j < requisitos.length; j++) {
            const req1 = requisitos[i];
            const req2 = requisitos[j];
            const cellTooltip = `Comparação entre:<br><strong>Req ${i + 1}:</strong> ${escapeHtml(truncateText(req1.descricao, 50))}<br><strong>Req ${j + 1}:</strong> ${escapeHtml(truncateText(req2.descricao, 50))}`;

            if (i === j) {
                matrixHTML += `<div class="matrix-cell matrix-diagonal" data-tooltip="${cellTooltip}">-</div>`;
            } else if (i < j) {
                const req1Id = requisitos[i].id;
                const req2Id = requisitos[j].id;
                const storedComparison = qfdDB.getComparacoesCliente().find(
                    c => (c.requisito1 === req1Id && c.requisito2 === req2Id) ||
                         (c.requisito1 === req2Id && c.requisito2 === req1Id)
                );
                const isCompleted = !!storedComparison;
                
                matrixHTML += `<div class="matrix-cell matrix-comparison ${isCompleted ? 'completed' : ''}" 
                    data-req1="${req1Id}" data-req2="${req2Id}" data-i="${i}" data-j="${j}"
                    data-tooltip="${cellTooltip}<br><em>Clique para comparar</em>">
                    ${isCompleted ? getComparisonDisplay(storedComparison, i, j) : '<span class="comparison-placeholder">?</span>'}
                </div>`;
            } else {
                matrixHTML += `<div class="matrix-cell matrix-mirror" data-tooltip="${cellTooltip}"></div>`;
            }
        }
        
        matrixHTML += `<div class="matrix-cell matrix-row-total"><div class="row-total-content"><span class="total-value">${somatorios.linhas[i] || 0}</span></div></div></div>`;
    }
    
    // Rodapé Totais
    matrixHTML += '<div class="matrix-row matrix-column-totals"><div class="matrix-cell matrix-total-label">Total</div>';
    for (let j = 0; j < requisitos.length; j++) {
        matrixHTML += `<div class="matrix-cell matrix-column-total"><span class="total-value">${somatorios.colunas[j] || 0}</span></div>`;
    }
    matrixHTML += `<div class="matrix-cell matrix-grand-total"><span class="grand-total-value">${somatorios.total}</span></div></div>`;
    matrixHTML += '</div></div>';
    
    matrixContainer.innerHTML = matrixHTML;
    addMatrixEventListeners();
}

function calculateSummaries() {
    const linhas = new Array(requisitos.length).fill(0);
    const colunas = new Array(requisitos.length).fill(0);
    let total = 0;
    
    const comparacoes = qfdDB.getComparacoesCliente();
    comparacoes.forEach(c => {
        const i = requisitos.findIndex(r => r.id === c.requisito1);
        const j = requisitos.findIndex(r => r.id === c.requisito2);
        if (i !== -1 && j !== -1) {
            linhas[i] += c.valor;
            colunas[j] += c.valor;
            total += c.valor;
        }
    });
    
    return { linhas, colunas, total };
}

function getComparisonDisplay(storedComparison, i, j) {
    const req1Id = requisitos[i].id;
    let winnerIndex, value;
    if (storedComparison.requisito1 === req1Id) {
        winnerIndex = i;
        value = storedComparison.valor;
    } else {
        winnerIndex = j;
        value = storedComparison.valor;
    }
    return `<div class="comparison-result"><span class="winner-indicator">${winnerIndex + 1}</span><span class="value-indicator value-${value}">${value}</span></div>`;
}

function addMatrixEventListeners() {
    const cells = document.querySelectorAll('[data-tooltip]');
    cells.forEach(cell => {
        cell.addEventListener('mouseenter', showTooltip);
        cell.addEventListener('mouseleave', hideTooltip);
        if (cell.classList.contains('matrix-comparison')) {
            cell.addEventListener('click', () => openComparisonModal(cell));
        }
    });
    
    // Após carregar a matriz, verifica se deve abrir alguma célula (fluxo "salvar e ir para próxima")
    const openNext = sessionStorage.getItem('comparacaoOpenNext');
    if (openNext) {
        try {
            const { i: nextI, j: nextJ } = JSON.parse(openNext);
            sessionStorage.removeItem('comparacaoOpenNext');
            const nextCell = document.querySelector(
                `.matrix-comparison[data-i="${nextI}"][data-j="${nextJ}"]`
            );
            if (nextCell) {
                setTimeout(() => openComparisonModal(nextCell), 100);
            }
        } catch (e) {
            sessionStorage.removeItem('comparacaoOpenNext');
        }
    }
}

/**
 * Retorna as coordenadas da próxima célula de comparação na ordem:
 * da esquerda para a direita, e ao fim da linha passa para a próxima.
 * Matriz triangular superior: (0,1), (0,2), ... (0,n-1), (1,2), ... (n-2, n-1).
 * @param {number} i - Índice da linha da célula atual
 * @param {number} j - Índice da coluna da célula atual
 * @returns {{ i: number, j: number } | null} Próxima célula ou null se for a última
 */
function getNextComparisonCell(i, j) {
    const n = requisitos.length;
    if (n < 2) return null;
    if (j < n - 1) return { i, j: j + 1 };
    if (i < n - 2) return { i: i + 1, j: i + 2 };
    return null;
}

function showTooltip(e) {
    const text = e.currentTarget.getAttribute('data-tooltip');
    if (!text) return;
    
    hideTooltip();
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.innerHTML = text;
    document.body.appendChild(tooltip);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    let top = rect.top - tooltipRect.height - 10;
    
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) left = window.innerWidth - tooltipRect.width - 10;
    if (top < 10) top = rect.bottom + 10;
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.style.opacity = '1';
}

function hideTooltip() {
    const tooltip = document.querySelector('.custom-tooltip');
    if (tooltip) tooltip.remove();
}

function openComparisonModal(cell) {
    const req1Id = cell.dataset.req1;
    const req2Id = cell.dataset.req2;
    const i = parseInt(cell.dataset.i);
    const j = parseInt(cell.dataset.j);
    
    const req1 = requisitos[i];
    const req2 = requisitos[j];
    
    const storedComparison = qfdDB.getComparacoesCliente().find(
        c => (c.requisito1 === req1Id && c.requisito2 === req2Id) ||
             (c.requisito1 === req2Id && c.requisito2 === req1Id)
    );
    
    // Remove qualquer modal existente antes de criar um novo
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex'; // Garante que o modal seja exibido como flex
    modal.innerHTML = `
        <div class="modal-content comparison-modal">
            <div class="modal-header">
                <h3>Comparar Requisitos</h3>
                <button class="modal-close" onclick="closeModal()" title="Fechar">&times;</button>
            </div>
            <div class="modal-body">
                <div class="comparison-question">
                    <h4>Qual requisito é mais importante?</h4>
                </div>
                <div class="requirements-comparison">
                    <div class="requirement-option ${storedComparison && storedComparison.requisito1 === req1Id ? 'selected' : ''}" data-req="${req1Id}" data-index="${i}">
                        <div class="req-header">
                            <span class="req-number">${i + 1}</span>
                            <span class="req-label">Requisito A</span>
                        </div>
                        <div class="req-description">${escapeHtml(req1.descricao)}</div>
                    </div>
                    <div class="vs-divider">VS</div>
                    <div class="requirement-option ${storedComparison && storedComparison.requisito1 === req2Id ? 'selected' : ''}" data-req="${req2Id}" data-index="${j}">
                        <div class="req-header">
                            <span class="req-number">${j + 1}</span>
                            <span class="req-label">Requisito B</span>
                        </div>
                        <div class="req-description">${escapeHtml(req2.descricao)}</div>
                    </div>
                </div>
                <div class="importance-levels" id="importance-levels" style="${storedComparison ? 'display:block' : 'display:none'}">
                    <h4>Quanto mais importante?</h4>
                    <div class="level-options">
                        ${[1, 3, 5].map(v => `
                            <button class="level-btn ${storedComparison && storedComparison.valor === v ? 'selected' : ''}" data-value="${v}">
                                <span class="level-number">${v}</span>
                                <small>${v === 1 ? 'Pouco' : v === 3 ? 'Moderado' : 'Muito'}</small>
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <small class="modal-footer-hint" style="margin-right: auto; align-self: center; color: #6c757d;"><kbd>Enter</kbd> salva e abre a próxima</small>
                <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button class="btn btn-primary" id="save-comparison" ${storedComparison ? '' : 'disabled'} onclick="saveComparison(false)">Salvar</button>
                ${storedComparison ? `<button class="btn btn-danger" onclick="removeComparison('${req1Id}', '${req2Id}')">Remover</button>` : ''}
            </div>
        </div>
    `;
    
    // Fecha o modal ao clicar no overlay (fora do conteúdo)
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });
    
    // Fecha o modal ao pressionar ESC
    const escHandler = function(e) {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
    
    // Previne scroll do body quando o modal estiver aberto
    document.body.style.overflow = 'hidden';
    
    document.body.appendChild(modal);
    
    const modalBox = modal.querySelector('.comparison-modal');
    if (modalBox) {
        modalBox.setAttribute('tabindex', '0');
        modalBox.focus();
    }
    
    setupModalLogic(req1Id, req2Id, i, j);
}

function setupModalLogic(req1Id, req2Id, cellI, cellJ) {
    let selectedReq = document.querySelector('.requirement-option.selected')?.dataset.req || null;
    let selectedValue = document.querySelector('.level-btn.selected')?.dataset.value || null;

    document.querySelectorAll('.requirement-option').forEach(opt => {
        opt.onclick = () => {
            document.querySelectorAll('.requirement-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedReq = opt.dataset.req;
            document.getElementById('importance-levels').style.display = 'block';
        };
    });

    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.level-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedValue = btn.dataset.value;
            document.getElementById('save-comparison').disabled = false;
        };
    });

    /**
     * Salva a comparação e, se desejado, abre a próxima célula após recarregar.
     * @param {boolean} openNextCell - Se true, após reload abre a próxima célula na ordem (usado pelo Enter)
     */
    window.saveComparison = (openNextCell) => {
        if (selectedReq && selectedValue) {
            const otherReq = selectedReq === req1Id ? req2Id : req1Id;
            qfdDB.setComparacaoCliente(selectedReq, otherReq, parseInt(selectedValue));
            if (openNextCell) {
                const next = getNextComparisonCell(cellI, cellJ);
                if (next) {
                    sessionStorage.setItem('comparacaoOpenNext', JSON.stringify(next));
                }
            }
            closeModal();
            location.reload();
        }
    };
    
    // Enter no modal: salva e abre a próxima célula
    const modalContent = document.querySelector('.comparison-modal');
    if (modalContent) {
        modalContent.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                const saveBtn = document.getElementById('save-comparison');
                if (saveBtn && !saveBtn.disabled) {
                    saveComparison(true);
                }
            }
        });
    }

    window.removeComparison = (r1, r2) => {
        const comps = qfdDB.getComparacoesCliente().filter(c => 
            !((c.requisito1 === r1 && c.requisito2 === r2) || (c.requisito1 === r2 && c.requisito2 === r1))
        );
        const data = qfdDB.loadData();
        data.comparacaoCliente = comps;
        qfdDB.saveData(data);
        closeModal();
        location.reload();
    };
}

window.closeModal = () => {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        // Restaura scroll do body
        document.body.style.overflow = '';
        
        // Animação de fechamento
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
};

function updateStatus() {
    const totalPossible = calculateTotalComparisons(requisitos.length);
    const feitas = qfdDB.getComparacoesCliente().length;
    const statusEl = document.getElementById('comparacoes-feitas');
    if (statusEl) statusEl.textContent = `${feitas} / ${totalPossible}`;
}

function truncateText(text, limit) {
    return text.length > limit ? text.substring(0, limit) + '...' : text;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showResults() {
    const resultsSection = document.getElementById('results-section');
    if (resultsSection) resultsSection.style.display = 'block';
}
/**
 * Reseta todas as comparações realizadas
 * Requer confirmação do usuário antes de executar a ação
 */
function resetComparisons() {
    if (confirm('Tem certeza que deseja resetar todas as comparações? Esta ação não pode ser desfeita.')) {
        try {
            const data = qfdDB.loadData();
            data.comparacaoCliente = [];
            qfdDB.saveData(data);
            
            loadRequisitos();
            setupComparison();
            updateStatus();
            
            const resultsSection = document.getElementById('results-section');
            if (resultsSection) {
                resultsSection.style.display = 'none';
            }
            
            showAlert('Todas as comparações foram resetadas!', 'success');
        } catch (error) {
            console.error('Erro ao resetar comparações:', error);
            showAlert('Erro ao resetar comparações. Verifique o console.', 'danger');
        }
    }
}

/**
 * Exporta os resultados das comparações (hierarquização) em formato CSV
 */
function exportResults() {
    const comparacoes = qfdDB.getComparacoesCliente();
    
    if (requisitos.length === 0) {
        showAlert('Não há requisitos para exportar.', 'info');
        return;
    }
    
    const csvContent = generateResultsCSV();
    const filename = `hierarquizacao-requisitos-${new Date().toISOString().split('T')[0]}.csv`;
    downloadFile(csvContent, filename, 'text/csv');
    
    showAlert('Resultados exportados com sucesso!', 'success');
}

/**
 * Gera CSV com os resultados da hierarquização
 */
function generateResultsCSV() {
    const somatorios = calculateSummaries();
    
    // Cria ranking ordenado por importância
    const ranking = requisitos.map((req, index) => ({
        numero: index + 1,
        descricao: req.descricao,
        importancia: somatorios.linhas[index] || 0,
        peso: ((somatorios.linhas[index] || 0) / somatorios.total * 100).toFixed(2)
    })).sort((a, b) => b.importancia - a.importancia);
    
    const headers = ['Rank', 'Número', 'Requisito', 'Importância', 'Peso (%)'];
    const rows = ranking.map((item, rank) => [
        rank + 1,
        item.numero,
        `"${item.descricao.replace(/"/g, '""')}"`,
        item.importancia,
        item.peso
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * Exporta as comparações realizadas em formato CSV
 */
function exportComparacoesCSV() {
    const comparacoes = qfdDB.getComparacoesCliente();
    
    if (comparacoes.length === 0) {
        showAlert('Não há comparações para exportar.', 'info');
        return;
    }
    
    const csvContent = generateComparacoesCSV();
    const filename = `comparacoes-requisitos-${new Date().toISOString().split('T')[0]}.csv`;
    downloadFile(csvContent, filename, 'text/csv');
    
    showAlert('Comparações exportadas com sucesso!', 'success');
}

/**
 * Gera CSV com todas as comparações realizadas
 */
function generateComparacoesCSV() {
    const comparacoes = qfdDB.getComparacoesCliente();
    
    const headers = ['Requisito 1 (Num)', 'Requisito 2 (Num)', 'Vencedor', 'Importância', 'Requisito 1 (Descrição)', 'Requisito 2 (Descrição)'];
    const rows = comparacoes.map(comp => {
        const req1Index = requisitos.findIndex(r => r.id === comp.requisito1);
        const req2Index = requisitos.findIndex(r => r.id === comp.requisito2);
        const req1 = requisitos[req1Index];
        const req2 = requisitos[req2Index];
        
        let winner, importance;
        if (comp.requisito1 === (comp.requisito1 || comp.requisito1)) {
            winner = req1Index + 1;
        } else {
            winner = req2Index + 1;
        }
        
        const importanceText = comp.valor === 1 ? 'Pouco' : comp.valor === 3 ? 'Moderado' : 'Muito';
        
        return [
            req1Index + 1,
            req2Index + 1,
            winner,
            `${comp.valor} (${importanceText})`,
            req1 ? `"${req1.descricao.replace(/"/g, '""')}"` : 'N/A',
            req2 ? `"${req2.descricao.replace(/"/g, '""')}"` : 'N/A'
        ];
    });
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

/**
 * Função utilitária para download de arquivo
 */
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

/**
 * Função utilitária para mostrar alertas
 */
function showAlert(message, type = 'info') {
    // Implementação simples usando alert nativo
    // Uma versão mais sofisticada poderia usar um toast ou modal
    console.log(`[${type.toUpperCase()}] ${message}`);
    alert(message);
}

/**
 * Gera a legenda dos requisitos no container
 */
function generateLegend() {
    const legendContainer = document.getElementById('matrix-legend-container');
    if (!legendContainer) return;
    
    let legendHTML = '<div class="legend-list">';
    legendHTML += '<h5>Numeração dos Requisitos</h5>';
    legendHTML += '<div class="legend-items">';
    
    requisitos.forEach((req, index) => {
        legendHTML += `
            <div class="legend-item">
                <span class="legend-number">${index + 1}</span>
                <span class="legend-text">${escapeHtml(req.descricao)}</span>
            </div>
        `;
    });
    
    legendHTML += '</div></div>';
    
    legendContainer.innerHTML = legendHTML;
}
