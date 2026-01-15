/**
 * JavaScript para Página de Comparação de Requisitos de Cliente - Versão Modificada
 * Implementa o Diagrama de Mudge para hierarquização com melhorias
 */

let requisitos = [];
let totalComparacoes = 0;
let comparacoesFeitas = 0;

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
        
        // Fechar dropdown ao clicar fora
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
    
    if (comparacoesFeitas === totalComparacoes) {
        showResults();
    }
}

function generateComparisonMatrix() {
    const matrixContainer = document.getElementById('comparison-matrix');
    if (!matrixContainer) return;
    
    // Calcula somatórios para cada requisito
    const somatorios = calculateSummaries();
    
    let matrixHTML = '<div class="matrix-table-wrapper">';
    matrixHTML += '<div class="matrix-table">';
    
    // Cabeçalho da matriz com somatórios
    matrixHTML += '<div class="matrix-row matrix-header">';
    matrixHTML += '<div class="matrix-cell matrix-corner">Req.</div>';
    
    for (let i = 0; i < requisitos.length; i++) {
        const tooltipText = `Requisito ${i + 1}: ${escapeHtml(requisitos[i].descricao)}`;
        matrixHTML += `<div class="matrix-cell matrix-header-cell" 
            title="${tooltipText}"
            data-tooltip="${tooltipText}">
            <div class="header-content">
                <span class="req-number">${i + 1}</span>
                <span class="req-summary">${somatorios.colunas[i] || 0}</span>
            </div>
        </div>`;
    }
    
    // Célula de somatório total no canto superior direito
    matrixHTML += `<div class="matrix-cell matrix-total-header">
        <div class="total-content">
            <span class="total-label">Total</span>
            <span class="total-value">${somatorios.total}</span>
        </div>
    </div>`;
    
    matrixHTML += '</div>';
    
    // Linhas da matriz com somatórios
    for (let i = 0; i < requisitos.length; i++) {
        matrixHTML += '<div class="matrix-row">';
        
        // Cabeçalho da linha com tooltip
        const tooltipText = `Requisito ${i + 1}: ${escapeHtml(requisitos[i].descricao)}`;
        matrixHTML += `<div class="matrix-cell matrix-row-header" 
            title="${tooltipText}"
            data-tooltip="${tooltipText}">
            <div class="row-header-content">
                <span class="req-number">${i + 1}</span>
                <span class="req-text">${truncateText(requisitos[i].descricao, 25)}</span>
            </div>
        </div>`;
        
        // Células de comparação
        for (let j = 0; j < requisitos.length; j++) {
            const req1 = requisitos[i];
            const req2 = requisitos[j];
            const cellTooltip = `Comparação entre:<br>
                <strong>Req ${i + 1}:</strong> ${escapeHtml(req1.descricao.substring(0, 50))}${req1.descricao.length > 50 ? '...' : ''}<br>
                <strong>Req ${j + 1}:</strong> ${escapeHtml(req2.descricao.substring(0, 50))}${req2.descricao.length > 50 ? '...' : ''}`;

            if (i === j) {
                // Diagonal principal
                matrixHTML += `<div class="matrix-cell matrix-diagonal" data-tooltip="${cellTooltip}">-</div>`;
            } else if (i < j) {
                // Parte superior da matriz (comparações ativas)
                const req1Id = requisitos[i].id;
                const req2Id = requisitos[j].id;
                const storedComparison = qfdDB.getComparacoesCliente().find(
                    c => (c.requisito1 === req1Id && c.requisito2 === req2Id) ||
                         (c.requisito1 === req2Id && c.requisito2 === req1Id)
                );
                const isCompleted = !!storedComparison;
                
                matrixHTML += `<div class="matrix-cell matrix-comparison ${isCompleted ? 'completed' : ''}" 
                    data-req1="${req1Id}" 
                    data-req2="${req2Id}"
                    data-i="${i}" 
                    data-j="${j}"
                    data-tooltip="${cellTooltip}<br><em>Clique para comparar</em>">
                    ${isCompleted ? getComparisonDisplay(0, i, j) : '<span class="comparison-placeholder">?</span>'}
                </div>`;
            } else {
                // Parte inferior da matriz (espelhada)
                matrixHTML += `<div class="matrix-cell matrix-mirror" data-tooltip="${cellTooltip}"></div>`;
            }
        }
        
        // Célula de somatório da linha
        matrixHTML += `<div class="matrix-cell matrix-row-total">
            <div class="row-total-content">
                <span class="total-value">${somatorios.linhas[i] || 0}</span>
            </div>
        </div>`;
        
        matrixHTML += '</div>';
    }
    
    // Linha de somatórios das colunas
    matrixHTML += '<div class="matrix-row matrix-column-totals">';
    matrixHTML += '<div class="matrix-cell matrix-total-label">Total</div>';
    
    for (let j = 0; j < requisitos.length; j++) {
        matrixHTML += `<div class="matrix-cell matrix-column-total">
            <span class="total-value">${somatorios.colunas[j] || 0}</span>
        </div>`;
    }
    
    // Célula de somatório geral
    matrixHTML += `<div class="matrix-cell matrix-grand-total">
        <span class="grand-total-value">${somatorios.total}</span>
    </div>`;
    
    matrixHTML += '</div>';
    matrixHTML += '</div>'; // Fecha matrix-table
    matrixHTML += '</div>'; // Fecha matrix-table-wrapper
    
    matrixContainer.innerHTML = matrixHTML;

    // Gerar legenda em div separada
    const legendContainer = document.getElementById('matrix-legend-container');
    if (legendContainer) {
        let legendHTML = '<div class="matrix-legend">';
        legendHTML += '<div class="legend-items">';
        for (let i = 0; i < requisitos.length; i++) {
            legendHTML += `<div class="legend-item" title="${escapeHtml(requisitos[i].descricao)}">
                <span class="legend-number">${i + 1}</span>
                <span class="legend-text">${escapeHtml(requisitos[i].descricao)}</span>
                <span class="legend-score">Pontos: ${somatorios.linhas[i] || 0}</span>
            </div>`;
        }
        legendHTML += '</div></div>';
        legendContainer.innerHTML = legendHTML;
    }
    
    // Adiciona event listeners para as células de comparação
    const comparisonCells = matrixContainer.querySelectorAll('.matrix-comparison');
    comparisonCells.forEach(cell => {
        cell.addEventListener('click', () => openComparisonModal(cell));
        
        // Adiciona hover tooltip
        cell.addEventListener('mouseenter', showTooltip);
        cell.addEventListener('mouseleave', hideTooltip);
    });
    
    // Adiciona tooltips para cabeçalhos
    const headerCells = matrixContainer.querySelectorAll('.matrix-header-cell, .matrix-row-header');
    headerCells.forEach(cell => {
        cell.addEventListener('mouseenter', showTooltip);
        cell.addEventListener('mouseleave', hideTooltip);
    });
}

function calculateSummaries() {
    const linhas = new Array(requisitos.length).fill(0);
    const colunas = new Array(requisitos.length).fill(0);
    let total = 0;
    
    requisitos.forEach((req1, i) => {
        requisitos.forEach((req2, j) => {
            if (i < j) {
                const valor = qfdDB.getComparacaoCliente(req1.id, req2.id);
                if (valor > 0) {
                    // Se valor > 0, req1 venceu ou empatou
                    // No Diagrama de Mudge, o valor é atribuído ao vencedor
                    // Se req1 vence, ele ganha o valor. Se req2 vence, ele ganha o valor.
                    // A função getComparacaoCliente retorna o valor do ponto de vista de req1
                    // Se retornar 1, 3 ou 5, req1 venceu.
                    // Se retornar o "inverso" (que o DB trata), req2 venceu.
                    
                    // Precisamos saber QUEM venceu para somar corretamente
                    const rawComp = qfdDB.loadData().comparacaoCliente.find(
                        c => (c.requisito1 === req1.id && c.requisito2 === req2.id) ||
                             (c.requisito1 === req2.id && c.requisito2 === req1.id)
                    );
                    
                    if (rawComp) {
                        if (rawComp.requisito1 === req1.id) {
                            linhas[i] += rawComp.valor;
                            colunas[j] += rawComp.valor;
                        } else {
                            linhas[j] += rawComp.valor;
                            colunas[i] += rawComp.valor;
                        }
                        total += rawComp.valor;
                    }
                }
            }
        });
    });
    
    return { linhas, colunas, total };
}

function exportComparacoesCSV() {
    const comparacoes = qfdDB.getComparacoesCliente();
    if (comparacoes.length === 0) {
        alert('Não há comparações para exportar.');
        return;
    }

    let csvContent = "requisito1_id,requisito2_id,valor\n";
    comparacoes.forEach(c => {
        csvContent += `${c.requisito1},${c.requisito2},${c.valor}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comparacoes-cliente.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function importComparacoesCSV(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const lines = text.split('\n');
        let count = 0;

        lines.forEach((line, index) => {
            if (index === 0 || !line.trim()) return;
            const [req1, req2, valor] = line.split(',');
            if (req1 && req2 && valor) {
                qfdDB.setComparacaoCliente(req1.trim(), req2.trim(), parseInt(valor.trim()));
                count++;
            }
        });

        alert(`${count} comparações importadas com sucesso!`);
        location.reload();
    };
    reader.readAsText(file);
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

function getComparisonDisplay(comparison, i, j) {
    // Busca a comparação bruta no banco para saber quem é o requisito1 (vencedor)
    const req1Id = requisitos[i].id;
    const req2Id = requisitos[j].id;
    const storedComparison = qfdDB.getComparacoesCliente().find(
        c => (c.requisito1 === req1Id && c.requisito2 === req2Id) ||
             (c.requisito1 === req2Id && c.requisito2 === req1Id)
    );
    
    if (!storedComparison) return '<span class="comparison-placeholder">?</span>';
    
    let winnerIndex, value;
    if (storedComparison.requisito1 === req1Id) {
        winnerIndex = i;
        value = storedComparison.valor;
    } else {
        winnerIndex = j;
        value = storedComparison.valor;
    }
    
    return `<div class="comparison-result">
        <span class="winner-indicator">${winnerIndex + 1}</span>
        <span class="value-indicator value-${value}">${value}</span>
    </div>`;
}

function openComparisonModal(cell) {
    const req1Id = cell.dataset.req1;
    const req2Id = cell.dataset.req2;
    const i = parseInt(cell.dataset.i);
    const j = parseInt(cell.dataset.j);
    
    const req1 = requisitos[i];
    const req2 = requisitos[j];
    
    const currentComparison = qfdDB.getComparacaoCliente(req1Id, req2Id);
    
    // Cria modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content comparison-modal">
            <div class="modal-header">
                <h3>Comparar Requisitos</h3>
                <button class="modal-close" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="comparison-question">
                    <h4>Qual requisito é mais importante?</h4>
                </div>
                
                <div class="requirements-comparison">
                    <div class="requirement-option" data-req="${req1Id}" data-index="${i}">
                        <div class="req-header">
                            <span class="req-number">${i + 1}</span>
                            <span class="req-label">Requisito A</span>
                        </div>
                        <div class="req-description">${escapeHtml(req1.descricao)}</div>
                    </div>
                    
                    <div class="vs-divider">VS</div>
                    
                    <div class="requirement-option" data-req="${req2Id}" data-index="${j}">
                        <div class="req-header">
                            <span class="req-number">${j + 1}</span>
                            <span class="req-label">Requisito B</span>
                        </div>
                        <div class="req-description">${escapeHtml(req2.descricao)}</div>
                    </div>
                </div>
                
                <div class="importance-levels" id="importance-levels" style="display: none;">
                    <h4>Quanto mais importante?</h4>
                    <div class="level-options">
                        <button class="level-btn" data-value="1">
                            <span class="level-number">1</span>
                            <span class="level-label">Pouco mais importante</span>
                        </button>
                        <button class="level-btn" data-value="3">
                            <span class="level-number">3</span>
                            <span class="level-label">Moderadamente mais importante</span>
                        </button>
                        <button class="level-btn" data-value="5">
                            <span class="level-number">5</span>
                            <span class="level-label">Muito mais importante</span>
                        </button>
                    </div>
                </div>
                
                <div class="current-selection" id="current-selection" style="display: none;">
                    <div class="selection-info">
                        <span id="selected-req"></span> é <span id="selected-level"></span> que <span id="other-req"></span>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
                <button class="btn btn-primary" id="save-comparison" onclick="saveComparison()" disabled>
                    Salvar Comparação
                </button>
                ${currentComparison > 0 ? '<button class="btn btn-danger" onclick="removeComparison()">Remover</button>' : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Adiciona estilos do modal se não existirem
    addModalStyles();
    
    // Configura event listeners
    setupModalEventListeners(req1Id, req2Id, i, j, currentComparison);
}

function setupModalEventListeners(req1Id, req2Id, i, j, currentComparison) {
    let selectedReq = null;
    let selectedValue = null;
    
    // Se já existe comparação, pré-seleciona
    if (currentComparison > 0) {
        const storedComparison = qfdDB.getComparacoesCliente().find(
            c => (c.requisito1 === req1Id && c.requisito2 === req2Id) ||
                 (c.requisito1 === req2Id && c.requisito2 === req1Id)
        );
        
        if (storedComparison) {
            // Corrige a lógica de pré-seleção
            selectedReq = storedComparison.requisito1;
            selectedValue = storedComparison.valor;
            
            updateModalSelection(selectedReq, selectedValue, req1Id, req2Id, i, j);
        }
    }
    
    // Event listeners para seleção de requisito
    const reqOptions = document.querySelectorAll('.requirement-option');
    reqOptions.forEach(option => {
        option.addEventListener('click', () => {
            reqOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedReq = option.dataset.req;
            
            document.getElementById('importance-levels').style.display = 'block';
            
            // Remove seleção anterior de nível
            document.querySelectorAll('.level-btn').forEach(btn => btn.classList.remove('selected'));
            selectedValue = null;
            document.getElementById('save-comparison').disabled = true;
            document.getElementById('current-selection').style.display = 'none';
        });
    });
    
    // Event listeners para seleção de nível
    const levelBtns = document.querySelectorAll('.level-btn');
    levelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            levelBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedValue = parseInt(btn.dataset.value);
            
            updateModalSelection(selectedReq, selectedValue, req1Id, req2Id, i, j);
            document.getElementById('save-comparison').disabled = false;
        });
    });
    
    // Salva referências globais para uso nas funções de callback
    window.currentComparisonData = {
        req1Id, req2Id, selectedReq, selectedValue
    };
}

function updateModalSelection(selectedReq, selectedValue, req1Id, req2Id, i, j) {
    const selectedReqElement = document.getElementById('selected-req');
    const selectedLevelElement = document.getElementById('selected-level');
    const otherReqElement = document.getElementById('other-req');
    const currentSelectionDiv = document.getElementById('current-selection');
    
    if (selectedReqElement && selectedLevelElement && otherReqElement) {
        const selectedIndex = selectedReq === req1Id ? i : j;
        const otherIndex = selectedReq === req1Id ? j : i;
        
        selectedReqElement.textContent = `Requisito ${selectedIndex + 1}`;
        otherReqElement.textContent = `Requisito ${otherIndex + 1}`;
        
        const levelLabels = {
            1: 'pouco mais importante',
            3: 'moderadamente mais importante',
            5: 'muito mais importante'
        };
        
        selectedLevelElement.textContent = levelLabels[selectedValue];
        currentSelectionDiv.style.display = 'block';
    }
    
    // Atualiza seleções visuais
    document.querySelectorAll('.requirement-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.req === selectedReq);
    });
    
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.classList.toggle('selected', parseInt(btn.dataset.value) === selectedValue);
    });
    
    document.getElementById('importance-levels').style.display = 'block';
    
    // Atualiza dados globais
    window.currentComparisonData = {
        req1Id, req2Id, selectedReq, selectedValue
    };
}

function saveComparison() {
    const data = window.currentComparisonData;
    if (!data || !data.selectedReq || !data.selectedValue) return;
    
    try {
        // Sempre salva com o requisito selecionado como "vencedor" (requisito1)
        qfdDB.setComparacaoCliente(data.selectedReq, 
            data.selectedReq === data.req1Id ? data.req2Id : data.req1Id, 
            data.selectedValue);
        
        closeModal();
        loadRequisitos();
        generateComparisonMatrix();
        updateStatus();
        
        if (comparacoesFeitas === totalComparacoes) {
            showResults();
        }
        
        showAlert('Comparação salva com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar comparação:', error);
        showAlert('Erro ao salvar comparação.', 'danger');
    }
}

function removeComparison() {
    const data = window.currentComparisonData;
    if (!data) return;
    
    if (confirm('Tem certeza que deseja remover esta comparação?')) {
        try {
            qfdDB.setComparacaoCliente(data.req1Id, data.req2Id, 0);
            
            closeModal();
            loadRequisitos();
            generateComparisonMatrix();
            updateStatus();
            
            const resultsSection = document.getElementById('results-section');
            if (resultsSection) {
                resultsSection.style.display = 'none';
            }
            
            showAlert('Comparação removida com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao remover comparação:', error);
            showAlert('Erro ao remover comparação.', 'danger');
        }
    }
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
    delete window.currentComparisonData;
}

function updateStatus() {
    const totalReqElement = document.getElementById('total-requisitos');
    const comparacoesElement = document.getElementById('comparacoes-feitas');
    const progressoElement = document.getElementById('progresso-percentual');
    const progressFill = document.getElementById('progress-fill');
    
    if (totalReqElement) {
        totalReqElement.textContent = `${requisitos.length} Requisitos`;
    }
    
    if (comparacoesElement) {
        comparacoesElement.textContent = `${comparacoesFeitas} / ${totalComparacoes}`;
    }
    
    const progresso = totalComparacoes > 0 ? Math.round((comparacoesFeitas / totalComparacoes) * 100) : 0;
    
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
    generateChart();
}

function generateRanking() {
    const rankingContainer = document.getElementById('ranking-list');
    if (!rankingContainer) return;
    
    const requisitosOrdenados = qfdDB.getRequisitosCliente()
        .sort((a, b) => b.importancia - a.importancia);
    
    let rankingHTML = '<div class="ranking-items">';
    
    requisitosOrdenados.forEach((req, index) => {
        const posicao = index + 1;
        const medalClass = posicao <= 3 ? `medal-${posicao}` : '';
        
        rankingHTML += `
            <div class="ranking-item ${medalClass}">
                <div class="ranking-position">
                    <span class="position-number">${posicao}</span>
                    ${posicao <= 3 ? `<i class="fas fa-medal"></i>` : ''}
                </div>
                <div class="ranking-content">
                    <div class="req-description">${escapeHtml(req.descricao)}</div>
                    <div class="req-metrics">
                        <span class="metric">
                            <i class="fas fa-trophy"></i>
                            Pontuação: <strong>${req.importancia.toFixed(1)}</strong>
                        </span>
                        <span class="metric">
                            <i class="fas fa-percentage"></i>
                            Peso: <strong>${(req.peso * 100).toFixed(1)}%</strong>
                        </span>
                    </div>
                </div>
            </div>
        `;
    });
    
    rankingHTML += '</div>';
    rankingContainer.innerHTML = rankingHTML;
}

function generateChart() {
    const canvas = document.getElementById('importance-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const requisitosOrdenados = qfdDB.getRequisitosCliente()
        .sort((a, b) => b.importancia - a.importancia);
    
    if (requisitosOrdenados.length === 0) return;
    
    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const width = canvas.width;
    const height = canvas.height;
    const margin = 40;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin - 40; // Espaço extra para labels
    
    const barWidth = chartWidth / requisitosOrdenados.length;
    const maxImportancia = Math.max(...requisitosOrdenados.map(r => r.importancia));
    
    // Desenha barras
    requisitosOrdenados.forEach((req, index) => {
        const barHeight = (req.importancia / maxImportancia) * chartHeight;
        const x = margin + index * barWidth;
        const y = margin + chartHeight - barHeight;
        
        // Gradiente para a barra
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 5, y, barWidth - 10, barHeight);
        
        // Número do requisito
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(index + 1, x + barWidth / 2, margin + chartHeight + 20);
        
        // Valor da importância
        ctx.fillStyle = '#666';
        ctx.font = '10px Arial';
        ctx.fillText(req.importancia.toFixed(1), x + barWidth / 2, y - 5);
    });
    
    // Título do gráfico
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Pontuação de Importância por Requisito', width / 2, 20);
}

function resetComparisons() {
    if (confirm('Tem certeza que deseja resetar todas as comparações? Esta ação não pode ser desfeita.')) {
        try {
            // Remove todas as comparações
            const comparacoes = qfdDB.getComparacoesCliente();
            comparacoes.forEach(comp => {
                qfdDB.setComparacaoCliente(comp.requisito1, comp.requisito2, 0);
            });
            
            loadRequisitos();
            generateComparisonMatrix();
            updateStatus();
            
            const resultsSection = document.getElementById('results-section');
            if (resultsSection) {
                resultsSection.style.display = 'none';
            }
            
            showAlert('Todas as comparações foram resetadas!', 'success');
        } catch (error) {
            console.error('Erro ao resetar comparações:', error);
            showAlert('Erro ao resetar comparações.', 'danger');
        }
    }
}

function exportResults() {
    const requisitosOrdenados = qfdDB.getRequisitosCliente()
        .sort((a, b) => b.importancia - a.importancia);
    
    if (requisitosOrdenados.length === 0) {
        showAlert('Não há resultados para exportar.', 'info');
        return;
    }
    
    const csvContent = generateResultsCSV(requisitosOrdenados);
    downloadFile(csvContent, `hierarquizacao-requisitos-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    
    showAlert('Resultados exportados com sucesso!', 'success');
}

function generateResultsCSV(requisitosOrdenados) {
    const headers = ['Posição', 'Descrição', 'Pontuação', 'Peso (%)', 'Peso Normalizado'];
    const rows = requisitosOrdenados.map((req, index) => [
        index + 1,
        `"${req.descricao.replace(/"/g, '""')}"`,
        req.importancia.toFixed(2),
        (req.peso * 100).toFixed(2),
        req.peso.toFixed(4)
    ]);
    
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
    if (document.getElementById('comparison-modal-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'comparison-modal-styles';
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
        
        /* Matrix Styles with Fixed Header */
        .comparison-matrix-container {
            overflow: auto;
            max-height: 70vh;
            border: 1px solid #e9ecef;
            border-radius: 8px;
        }
        
        .matrix-table-wrapper {
            position: relative;
            min-width: max-content;
        }
        
        .matrix-table {
            display: table;
            border-collapse: separate;
            border-spacing: 0;
            width: 100%;
        }
        
        .matrix-row {
            display: table-row;
        }
        
        .matrix-cell {
            display: table-cell;
            border: 1px solid #e9ecef;
            padding: 0.5rem;
            text-align: center;
            vertical-align: middle;
            min-width: 60px;
            height: 60px;
            position: relative;
        }
        
        .matrix-header {
            position: sticky;
            top: 0;
            z-index: 10;
            background: #f8f9fa;
        }
        
        .matrix-corner,
        .matrix-total-header {
            background: #667eea;
            color: white;
            font-weight: bold;
            position: sticky;
            top: 0;
            z-index: 11;
        }
        
        .matrix-header-cell {
            background: #667eea;
            color: white;
            font-weight: bold;
            cursor: help;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        .matrix-row-header {
            background: #667eea;
            color: white;
            font-weight: bold;
            cursor: help;
            position: sticky;
            left: 0;
            z-index: 9;
            min-width: 120px;
            max-width: 120px;
        }
        
        .header-content,
        .row-header-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
        }
        
        .req-number {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: bold;
        }
        
        .req-summary,
        .req-text {
            font-size: 0.7rem;
            opacity: 0.9;
        }
        
        .matrix-diagonal {
            background: #f8f9fa;
            color: #6c757d;
            font-weight: bold;
        }
        
        .matrix-comparison {
            cursor: pointer;
            transition: all 0.3s ease;
            background: white;
        }
        
        .matrix-comparison:hover {
            background: #f8f9ff;
            border-color: #667eea;
            transform: scale(1.05);
        }
        
        .matrix-comparison.completed {
            background: #e8f5e8;
            border-color: #28a745;
        }
        
        .comparison-result {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
        }
        
        .winner-indicator {
            background: #28a745;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
            font-weight: bold;
        }
        
        .value-indicator {
            font-weight: bold;
            font-size: 0.8rem;
        }
        
        .value-indicator.value-1 {
            color: #28a745;
        }
        
        .value-indicator.value-3 {
            color: #ffc107;
        }
        
        .value-indicator.value-5 {
            color: #dc3545;
        }
        
        .comparison-placeholder {
            color: #6c757d;
            font-size: 1.2rem;
        }
        
        .matrix-mirror {
            background: #f8f9fa;
        }
        
        .matrix-row-total,
        .matrix-column-total {
            background: #e3f2fd;
            font-weight: bold;
            color: #1976d2;
        }
        
        .matrix-total-label {
            background: #1976d2;
            color: white;
            font-weight: bold;
            position: sticky;
            left: 0;
            z-index: 9;
        }
        
        .matrix-grand-total {
            background: #1976d2;
            color: white;
            font-weight: bold;
            font-size: 1.1rem;
        }
        
        .matrix-column-totals {
            position: sticky;
            bottom: 0;
            z-index: 8;
        }
        
        .total-content,
        .row-total-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;
        }
        
        .total-label {
            font-size: 0.7rem;
            opacity: 0.9;
        }
        
        .total-value,
        .grand-total-value {
            font-size: 1rem;
            font-weight: bold;
        }
        
        /* Modal Styles */
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        .comparison-modal {
            background: white;
            border-radius: 12px;
            max-width: 600px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid #e9ecef;
        }
        
        .modal-header h3 {
            margin: 0;
            color: #333;
        }
        
        .modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6c757d;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-close:hover {
            color: #333;
        }
        
        .modal-body {
            padding: 1.5rem;
        }
        
        .comparison-question {
            text-align: center;
            margin-bottom: 1.5rem;
        }
        
        .comparison-question h4 {
            color: #333;
            margin: 0;
        }
        
        .requirements-comparison {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        
        .requirement-option {
            flex: 1;
            padding: 1rem;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .requirement-option:hover {
            border-color: #667eea;
            background: #f8f9ff;
        }
        
        .requirement-option.selected {
            border-color: #667eea;
            background: linear-gradient(135deg, #f8f9ff, #e3f2fd);
            box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
        }
        
        .req-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
        }
        
        .requirement-option .req-number {
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
        }
        
        .req-label {
            font-weight: 600;
            color: #333;
        }
        
        .req-description {
            font-size: 0.9rem;
            color: #666;
            line-height: 1.4;
        }
        
        .vs-divider {
            background: #667eea;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9rem;
        }
        
        .importance-levels {
            margin-bottom: 1.5rem;
        }
        
        .importance-levels h4 {
            text-align: center;
            color: #333;
            margin-bottom: 1rem;
        }
        
        .level-options {
            display: flex;
            gap: 0.5rem;
            justify-content: center;
        }
        
        .level-btn {
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            padding: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            text-align: center;
            flex: 1;
            max-width: 150px;
        }
        
        .level-btn:hover {
            border-color: #667eea;
            background: #f8f9ff;
        }
        
        .level-btn.selected {
            border-color: #667eea;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
        }
        
        .level-number {
            display: block;
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 0.5rem;
        }
        
        .level-label {
            display: block;
            font-size: 0.8rem;
            line-height: 1.2;
        }
        
        .current-selection {
            background: #e8f5e8;
            border: 1px solid #28a745;
            border-radius: 8px;
            padding: 1rem;
            text-align: center;
            margin-bottom: 1rem;
        }
        
        .selection-info {
            color: #155724;
            font-weight: 600;
        }
        
        .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 0.5rem;
            padding: 1.5rem;
            border-top: 1px solid #e9ecef;
        }
        
        /* Legend Styles */
        .matrix-legend {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 1rem;
            margin-top: 1rem;
        }
        
        .matrix-legend h4 {
            margin: 0 0 1rem 0;
            color: #333;
        }
        
        .legend-items {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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
        
        .legend-number {
            background: #667eea;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            flex-shrink: 0;
        }
        
        .legend-text {
            flex: 1;
            font-size: 0.9rem;
            line-height: 1.3;
        }
        
        .legend-score {
            background: #e3f2fd;
            color: #1976d2;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        
        @media (max-width: 768px) {
            .requirements-comparison {
                flex-direction: column;
            }
            
            .vs-divider {
                transform: rotate(90deg);
            }
            
            .level-options {
                flex-direction: column;
            }
            
            .level-btn {
                max-width: none;
            }
            
            .dropdown-menu {
                position: fixed;
                top: auto;
                left: 10px;
                right: 10px;
                width: auto;
            }
            
            .matrix-cell {
                min-width: 50px;
                height: 50px;
                padding: 0.25rem;
            }
            
            .matrix-row-header {
                min-width: 100px;
                max-width: 100px;
            }
            
            .legend-items {
                grid-template-columns: 1fr;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

// Adiciona estilos específicos da página
document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('comparacao-cliente-styles')) {
        const styles = document.createElement('style');
        styles.id = 'comparacao-cliente-styles';
        styles.textContent = `
            .status-card {
                margin-bottom: 2rem;
            }
            
            .status-info {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1.5rem;
                margin-bottom: 1rem;
            }
            
            .status-item {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .status-icon {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.2rem;
            }
            
            .status-content h4 {
                margin: 0 0 0.25rem 0;
                color: #333;
                font-size: 1.1rem;
            }
            
            .status-content p {
                margin: 0;
                color: #666;
                font-size: 0.9rem;
            }
            
            .progress-bar {
                background: #e9ecef;
                height: 8px;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .progress-fill {
                background: linear-gradient(135deg, #667eea, #764ba2);
                height: 100%;
                transition: width 0.3s ease;
            }
            
            .alert-card {
                border-left: 4px solid #ffc107;
                background: #fff3cd;
            }
            
            .alert-content {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
            }
            
            .alert-icon {
                color: #856404;
                font-size: 2rem;
            }
            
            .alert-text h3 {
                margin: 0 0 0.5rem 0;
                color: #856404;
            }
            
            .alert-text p {
                margin: 0 0 1rem 0;
                color: #856404;
            }
            
            .comparison-instructions {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
            }
            
            .comparison-instructions h4 {
                margin: 0 0 1rem 0;
                color: #333;
            }
            
            .instruction-grid {
                display: flex;
                gap: 1rem;
                margin-bottom: 1rem;
                flex-wrap: wrap;
            }
            
            .instruction-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .value-badge {
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
            }
            
            .value-badge.value-1 {
                background: #28a745;
            }
            
            .value-badge.value-3 {
                background: #ffc107;
                color: #212529;
            }
            
            .value-badge.value-5 {
                background: #dc3545;
            }
            
            /* Results Styles */
            .ranking-items {
                display: grid;
                gap: 1rem;
                margin-bottom: 2rem;
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
            
            .ranking-item.medal-1 {
                border-left: 4px solid #ffd700;
                background: linear-gradient(135deg, #fff9e6, #ffffff);
            }
            
            .ranking-item.medal-2 {
                border-left: 4px solid #c0c0c0;
                background: linear-gradient(135deg, #f5f5f5, #ffffff);
            }
            
            .ranking-item.medal-3 {
                border-left: 4px solid #cd7f32;
                background: linear-gradient(135deg, #fdf6f0, #ffffff);
            }
            
            .ranking-position {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.25rem;
                min-width: 60px;
            }
            
            .position-number {
                background: #667eea;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 1.1rem;
            }
            
            .ranking-item.medal-1 .position-number {
                background: #ffd700;
                color: #333;
            }
            
            .ranking-item.medal-2 .position-number {
                background: #c0c0c0;
                color: #333;
            }
            
            .ranking-item.medal-3 .position-number {
                background: #cd7f32;
                color: white;
            }
            
            .fa-medal {
                color: #ffd700;
                font-size: 0.8rem;
            }
            
            .ranking-content {
                flex: 1;
            }
            
            .req-description {
                font-size: 1rem;
                color: #333;
                margin-bottom: 0.5rem;
                line-height: 1.4;
            }
            
            .req-metrics {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }
            
            .metric {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                font-size: 0.9rem;
                color: #666;
            }
            
            .metric i {
                color: #667eea;
            }
            
            .results-chart {
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 1rem;
            }
            
            .results-chart h4 {
                margin: 0 0 1rem 0;
                color: #333;
                text-align: center;
            }
            
            .chart-container {
                display: flex;
                justify-content: center;
            }
            
            @media (max-width: 768px) {
                .instruction-grid {
                    flex-direction: column;
                }
                
                .req-metrics {
                    flex-direction: column;
                    gap: 0.5rem;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
});

