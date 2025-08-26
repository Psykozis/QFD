/**
 * JavaScript para Página de Comparação de Requisitos de Cliente
 * Implementa o Diagrama de Mudge para hierarquização
 */

let requisitos = [];
let totalComparacoes = 0;
let comparacoesFeitas = 0;

document.addEventListener('DOMContentLoaded', function() {
    loadRequisitos();
    setupComparison();
    updateStatus();
});

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
    const comparisonSection = document.getElementById('comparison-section');
    const resultsSection = document.getElementById('results-section');
    
    if (requisitos.length < 2) {
        insufficientDiv.style.display = 'block';
        comparisonSection.style.display = 'none';
        resultsSection.style.display = 'none';
        return;
    }
    
    insufficientDiv.style.display = 'none';
    comparisonSection.style.display = 'block';
    
    generateComparisonMatrix();
    
    if (comparacoesFeitas === totalComparacoes) {
        showResults();
    }
}

function generateComparisonMatrix() {
    const matrixContainer = document.getElementById('comparison-matrix');
    if (!matrixContainer) return;
    
    // Calcula os somatórios
    const comparacoes = qfdDB.getComparacoesCliente();
    const scores = {};
    requisitos.forEach(req => {
        scores[req.id] = { vence: 0, cessa: 0 };
    });

    comparacoes.forEach(comp => {
        if (comp.valor > 0) {
            scores[comp.requisito1].vence += comp.valor;
            scores[comp.requisito2].cessa += comp.valor;
        }
    });

    // Calcula os totais e ordena para o ranking
    const ranking = Object.keys(scores).map(reqId => {
        const total = scores[reqId].vence + scores[reqId].cessa;
        return {
            id: reqId,
            total: total
        };
    }).sort((a, b) => b.total - a.total);

    const rankMap = {};
    ranking.forEach((item, index) => {
        rankMap[item.id] = index + 1;
    });

    let matrixHTML = '<div class="matrix-table">';
    
    // Cabeçalho da matriz
    matrixHTML += '<div class="matrix-row matrix-header">';
    matrixHTML += '<div class="matrix-cell matrix-corner"></div>';
    
    for (let i = 0; i < requisitos.length; i++) {
        matrixHTML += `<div class="matrix-cell matrix-header-cell" title="${escapeHtml(requisitos[i].descricao)}">
            <span class="req-number">${i + 1}</span>
        </div>`;
    }
    // Células de somatório do cabeçalho
    matrixHTML += '<div class="matrix-cell matrix-header-cell matrix-score-header">Vence</div>';
    matrixHTML += '<div class="matrix-cell matrix-header-cell matrix-score-header">Cessa</div>';
    matrixHTML += '<div class="matrix-cell matrix-header-cell matrix-score-header">Total</div>';
    matrixHTML += '<div class="matrix-cell matrix-header-cell matrix-score-header">Rank</div>';
    matrixHTML += '</div>';
    
    // Linhas da matriz
    for (let i = 0; i < requisitos.length; i++) {
        matrixHTML += '<div class="matrix-row">';
        
        // Cabeçalho da linha
        matrixHTML += `<div class="matrix-cell matrix-row-header" title="${escapeHtml(requisitos[i].descricao)}">
            <span class="req-number">${i + 1}</span>
            <span class="req-text">${truncateText(requisitos[i].descricao, 30)}</span>
        </div>`;
        
        // Células de comparação
        for (let j = 0; j < requisitos.length; j++) {
            if (i === j) {
                // Diagonal principal
                matrixHTML += '<div class="matrix-cell matrix-diagonal">-</div>';
            } else if (i < j) {
                // Parte superior da matriz (comparações ativas)
                const comparison = qfdDB.getComparacaoCliente(requisitos[i].id, requisitos[j].id);
                const isCompleted = comparison > 0;
                
                matrixHTML += `<div class="matrix-cell matrix-comparison ${isCompleted ? 'completed' : ''}" 
                    data-req1="${requisitos[i].id}" 
                    data-req2="${requisitos[j].id}"
                    data-i="${i}" 
                    data-j="${j}">
                    ${isCompleted ? getComparisonDisplay(comparison, i, j) : '<span class="comparison-placeholder">?</span>'}
                </div>`;
            } else {
                // Parte inferior da matriz (espelhada)
                matrixHTML += '<div class="matrix-cell matrix-mirror"></div>';
            }
        }
        
        // Células de somatório da linha
        const reqId = requisitos[i].id;
        matrixHTML += `<div class="matrix-cell matrix-score-cell">${scores[reqId].vence}</div>`;
        matrixHTML += `<div class="matrix-cell matrix-score-cell">${scores[reqId].cessa}</div>`;
        matrixHTML += `<div class="matrix-cell matrix-score-cell">${scores[reqId].vence + scores[reqId].cessa}</div>`;
        matrixHTML += `<div class="matrix-cell matrix-score-cell rank-cell">${rankMap[reqId]}</div>`;
        
        matrixHTML += '</div>';
    }
    
    matrixHTML += '</div>';
    
    // Legenda dos requisitos
    matrixHTML += '<div class="matrix-legend">';
    matrixHTML += '<h4>Legenda dos Requisitos:</h4>';
    matrixHTML += '<div class="legend-items">';
    
    for (let i = 0; i < requisitos.length; i++) {
        matrixHTML += `<div class="legend-item">
            <span class="legend-number">${i + 1}</span>
            <span class="legend-text">${escapeHtml(requisitos[i].descricao)}</span>
        </div>`;
    }
    
    matrixHTML += '</div></div>';
    
    matrixContainer.innerHTML = matrixHTML;
    
    // Adiciona event listeners para as células de comparação
    const comparisonCells = matrixContainer.querySelectorAll('.matrix-comparison');
    comparisonCells.forEach(cell => {
        cell.addEventListener('click', () => openComparisonModal(cell));
    });
}

function getComparisonDisplay(comparison, i, j) {
    if (comparison === 0) return '<span class="comparison-placeholder">?</span>';
    
    const req1Id = requisitos[i].id;
    const req2Id = requisitos[j].id;
    const storedComparison = qfdDB.getComparacoesCliente().find(
        c => (c.requisito1 === req1Id && c.requisito2 === req2Id) ||
             (c.requisito1 === req2Id && c.requisito2 === req1Id)
    );
    
    if (!storedComparison || storedComparison.valor === 0) return '<span class="comparison-placeholder">?</span>';
    
    let winnerIndex, value;
    if (storedComparison.requisito1 === req1Id) {
        winnerIndex = i;
        value = storedComparison.valor;
    } else {
        winnerIndex = j;
        // Inverte o valor para o espelhamento da matriz
        value = storedComparison.valor === 1 ? 5 : storedComparison.valor === 5 ? 1 : storedComparison.valor;
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
    
    const currentComparison = qfdDB.getComparacoesCliente().find(
        c => (c.requisito1 === req1Id && c.requisito2 === req2Id) || (c.requisito1 === req2Id && c.requisito2 === req1Id)
    );
    
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
                <button class="btn btn-secondary" onclick="closeModal()">Cancelar (Esc)</button>
                <button class="btn btn-primary" id="save-comparison" onclick="saveComparison()" disabled>
                    Salvar Comparação (Enter)
                </button>
                ${currentComparison && currentComparison.valor > 0 ? '<button class="btn btn-danger" onclick="removeComparison()">Remover</button>' : ''}
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
    if (currentComparison && currentComparison.valor > 0) {
        if (currentComparison.requisito1 === req1Id) {
            selectedReq = req1Id;
            selectedValue = currentComparison.valor;
        } else {
            selectedReq = req2Id;
            selectedValue = currentComparison.valor === 1 ? 5 : currentComparison.valor === 5 ? 1 : currentComparison.valor;
        }
        updateModalSelection(selectedReq, selectedValue, req1Id, req2Id, i, j);
        document.getElementById('save-comparison').disabled = false;
    }
    
    // Event listeners para seleção de requisito
    const reqOptions = document.querySelectorAll('.requirement-option');
    reqOptions.forEach(option => {
        option.addEventListener('click', () => {
            reqOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedReq = option.dataset.req;
            
            document.getElementById('importance-levels').style.display = 'block';
            
            // Re-avalia o botão de salvar
            if (selectedReq && selectedValue) {
                document.getElementById('save-comparison').disabled = false;
                updateModalSelection(selectedReq, selectedValue, req1Id, req2Id, i, j);
            }
        });
    });
    
    // Event listeners para seleção de nível
    const levelBtns = document.querySelectorAll('.level-btn');
    levelBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            levelBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedValue = parseInt(btn.dataset.value);
            
            if (selectedReq && selectedValue) {
                document.getElementById('save-comparison').disabled = false;
                updateModalSelection(selectedReq, selectedValue, req1Id, req2Id, i, j);
            }
        });
    });

    // Atalhos de teclado
    document.addEventListener('keydown', handleKeyShortcuts);
    function handleKeyShortcuts(e) {
        if (!document.querySelector('.modal-overlay')) {
            document.removeEventListener('keydown', handleKeyShortcuts);
            return;
        }
        
        switch (e.key) {
            case 'a':
            case 'A':
                reqOptions[0].click();
                break;
            case 'b':
            case 'B':
                reqOptions[1].click();
                break;
            case '1':
                levelBtns[0].click();
                break;
            case '3':
                levelBtns[1].click();
                break;
            case '5':
                levelBtns[2].click();
                break;
            case 'Enter':
                if (!document.getElementById('save-comparison').disabled) {
                    e.preventDefault();
                    saveComparison();
                }
                break;
            case 'Escape':
                e.preventDefault();
                closeModal();
                break;
        }
    }
    
    // Salva referências globais para uso nas funções de callback
    window.currentComparisonData = {
        req1Id, req2Id, selectedReq, selectedValue, i, j
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
        req1Id, req2Id, selectedReq, selectedValue, i, j
    };
}

function saveComparison() {
    const data = window.currentComparisonData;
    if (!data || !data.selectedReq || !data.selectedValue) return;
    
    try {
        if (data.selectedReq === data.req1Id) {
            qfdDB.setComparacaoCliente(data.req1Id, data.req2Id, data.selectedValue);
        } else {
            qfdDB.setComparacaoCliente(data.req2Id, data.req1Id, data.selectedValue);
        }
        
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
    
    // Carrega requisitos atualizados com importância calculada
    const requisitosAtualizados = qfdDB.getRequisitosCliente();
    
    // Ordena por importância (decrescente)
    const requisitosOrdenados = [...requisitosAtualizados].sort((a, b) => b.importancia - a.importancia);
    
    generateRankingList(requisitosOrdenados);
    generateImportanceChart(requisitosOrdenados);
}

function generateRankingList(requisitosOrdenados) {
    const rankingList = document.getElementById('ranking-list');
    if (!rankingList) return;
    
    const rankingHTML = requisitosOrdenados.map((req, index) => `
        <div class="ranking-item">
            <div class="ranking-position">
                <span class="position-number">${index + 1}</span>
                ${index === 0 ? '<i class="fas fa-crown crown-icon"></i>' : ''}
            </div>
            <div class="ranking-content">
                <div class="ranking-description">${escapeHtml(req.descricao)}</div>
                <div class="ranking-metrics">
                    <span class="metric">
                        <i class="fas fa-star"></i>
                        Pontuação: <strong>${req.importancia.toFixed(1)}</strong>
                    </span>
                    <span class="metric">
                        <i class="fas fa-percentage"></i>
                        Peso: <strong>${(req.peso * 100).toFixed(1)}%</strong>
                    </span>
                </div>
            </div>
        </div>
    `).join('');
    
    rankingList.innerHTML = rankingHTML;
}

function generateImportanceChart(requisitosOrdenados) {
    const canvas = document.getElementById('importance-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Limpa canvas
    ctx.clearRect(0, 0, width, height);
    
    if (requisitosOrdenados.length === 0) return;
    
    // Configurações do gráfico
    const margin = 40;
    const chartWidth = width - 2 * margin;
    const chartHeight = height - 2 * margin;
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
        
        .req-number {
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
            
            .matrix-table {
                overflow-x: auto;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                margin-bottom: 1.5rem;
                display: flex;
                flex-direction: column;
            }
            
            .matrix-row {
                display: flex;
                min-width: fit-content;
            }
            
            .matrix-cell {
                border: 1px solid #dee2e6;
                padding: 0.5rem;
                min-width: 60px;
                min-height: 60px;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                font-size: 0.9rem;
                flex-shrink: 0;
            }
            
            .matrix-corner {
                background: #f8f9fa;
                font-weight: bold;
            }
            
            .matrix-header-cell {
                background: #667eea;
                color: white;
                font-weight: bold;
            }

            .matrix-score-header {
                font-size: 0.8rem;
                min-width: 45px;
            }
            
            .matrix-row-header {
                background: #f8f9fa;
                font-weight: bold;
                min-width: 200px;
                text-align: left;
                padding: 0.5rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .matrix-row-header .req-number {
                background: #667eea;
                color: white;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
                flex-shrink: 0;
            }
            
            .matrix-row-header .req-text {
                font-size: 0.8rem;
                line-height: 1.2;
            }
            
            .matrix-diagonal {
                background: #e9ecef;
                color: #6c757d;
                font-weight: bold;
            }
            
            .matrix-comparison {
                cursor: pointer;
                transition: all 0.3s ease;
                background: #fff;
            }
            
            .matrix-comparison:hover {
                background: #f8f9ff;
                border-color: #667eea;
            }
            
            .matrix-comparison.completed {
                background: #e8f5e8;
                border-color: #28a745;
            }
            
            .matrix-mirror {
                background: #f8f9fa;
            }
            
            .comparison-placeholder {
                color: #6c757d;
                font-size: 1.2rem;
            }
            
            .comparison-result {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }
            
            .winner-indicator {
                background: #667eea;
                color: white;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.7rem;
                font-weight: bold;
                margin: 0 auto;
            }
            
            .value-indicator {
                font-weight: bold;
                font-size: 0.8rem;
            }
            
            .matrix-score-cell {
                background: #f1f3f5;
                font-weight: bold;
                min-width: 45px;
            }

            .rank-cell {
                background: #e8f5e8;
                border-color: #28a745;
            }
            
            .matrix-legend {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 1rem;
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
                gap: 0.5rem;
                padding: 0.5rem;
                background: white;
                border-radius: 4px;
            }
            
            .legend-number {
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
            
            .legend-text {
                font-size: 0.9rem;
                line-height: 1.3;
            }
            
            .results-content {
                display: grid;
                grid-template-columns: 1fr 400px;
                gap: 2rem;
            }
            
            .ranking-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                margin-bottom: 1rem;
                transition: all 0.3s ease;
            }
            
            .ranking-item:hover {
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
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
            
            .ranking-description {
                font-weight: 600;
                color: #333;
                margin-bottom: 0.5rem;
                line-height: 1.4;
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
            
            .results-chart {
                background: #f8f9fa;
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
                .status-info {
                    grid-template-columns: 1fr;
                }
                
                .instruction-grid {
                    flex-direction: column;
                }
                
                .matrix-table {
                    font-size: 0.8rem;
                }
                
                .matrix-cell {
                    min-width: 50px;
                    min-height: 50px;
                }
                
                .matrix-row-header {
                    min-width: 150px;
                }
                
                .results-content {
                    grid-template-columns: 1fr;
                }
                
                .legend-items {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
});
