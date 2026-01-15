/**
 * Dashboard JavaScript para Sistema QFD
 * Atualiza o progresso em tempo real
 */

document.addEventListener('DOMContentLoaded', function() {
    updateDashboard();
    setupDropdownMenu();
    
    // Atualiza dashboard a cada 5 segundos se a página estiver ativa
    setInterval(() => {
        if (!document.hidden) {
            updateDashboard();
        }
    }, 5000);
});

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

function updateDashboard() {
    const stats = qfdDB.getProjectStats();
    
    // Atualiza cards de progresso
    updateProgressCard('cliente', stats.requisitosCliente, 'requisitos');
    updateProgressCard('projeto', stats.requisitosProjeto, 'requisitos');
    
    // Calcula progresso das comparações
    const totalComparacoesCliente = calculateTotalComparisons(stats.requisitosCliente);
    const progressComparacao = totalComparacoesCliente > 0 ? 
        Math.round((stats.comparacoesCliente / totalComparacoesCliente) * 100) : 0;
    updateProgressCard('comparacao', progressComparacao, '% completo');
    
    // Calcula progresso das correlações
    const totalCorrelacoesProjeto = calculateTotalComparisons(stats.requisitosProjeto);
    const progressCorrelacao = totalCorrelacoesProjeto > 0 ? 
        Math.round((stats.correlacoesProjeto / totalCorrelacoesProjeto) * 100) : 0;
    updateProgressCard('correlacao', progressCorrelacao, '% completo');
    
    // Calcula progresso da matriz QFD
    const totalRelacoesQFD = stats.requisitosCliente * stats.requisitosProjeto;
    const progressQFD = totalRelacoesQFD > 0 ? 
        Math.round((stats.relacoesQFD / totalRelacoesQFD) * 100) : 0;
    updateProgressCard('qfd', progressQFD, '% completo');
    
    // Atualiza status do relatório
    const canGenerateReport = stats.requisitosCliente > 0 && stats.requisitosProjeto > 0 && 
                             stats.relacoesQFD > 0;
    updateReportStatus(canGenerateReport);
    
    // Atualiza última modificação
    updateLastModified(stats.lastModified);
}

function updateProgressCard(type, value, unit) {
    const statusElement = document.getElementById(`status-${type}`);
    const countElement = document.getElementById(`count-${type}`);
    const cardElement = document.getElementById(`progress-${type}`);
    
    if (!statusElement || !countElement || !cardElement) return;
    
    // Determina status baseado no valor
    let status, statusClass;
    if (value === 0) {
        status = 'Não iniciado';
        statusClass = 'not-started';
    } else if (type === 'cliente' || type === 'projeto') {
        status = 'Concluído';
        statusClass = 'completed';
    } else if (value < 50) {
        status = 'Em andamento';
        statusClass = 'in-progress';
    } else if (value < 100) {
        status = 'Quase completo';
        statusClass = 'in-progress';
    } else {
        status = 'Concluído';
        statusClass = 'completed';
    }
    
    // Atualiza elementos
    statusElement.textContent = status;
    statusElement.className = `status ${statusClass}`;
    countElement.textContent = `${value} ${unit}`;
    
    // Atualiza cor do card baseado no progresso
    cardElement.style.borderLeftColor = getProgressColor(value, type);
}

function updateReportStatus(canGenerate) {
    const statusElement = document.getElementById('status-relatorio');
    const countElement = document.getElementById('count-relatorio');
    
    if (!statusElement || !countElement) return;
    
    if (canGenerate) {
        statusElement.textContent = 'Disponível';
        statusElement.className = 'status completed';
        countElement.textContent = 'Pronto para gerar';
    } else {
        statusElement.textContent = 'Não disponível';
        statusElement.className = 'status not-started';
        countElement.textContent = 'Aguardando dados';
    }
}

function updateLastModified(lastModified) {
    const date = new Date(lastModified);
    const formattedDate = date.toLocaleString('pt-BR');
    
    // Adiciona informação de última modificação se não existir
    let lastModifiedElement = document.getElementById('last-modified');
    if (!lastModifiedElement) {
        lastModifiedElement = document.createElement('div');
        lastModifiedElement.id = 'last-modified';
        lastModifiedElement.className = 'last-modified-info';
        lastModifiedElement.innerHTML = `
            <small><i class="fas fa-clock"></i> Última modificação: <span id="last-modified-date">${formattedDate}</span></small>
        `;
        
        const dashboard = document.querySelector('.dashboard');
        if (dashboard) {
            dashboard.appendChild(lastModifiedElement);
        }
    } else {
        const dateSpan = document.getElementById('last-modified-date');
        if (dateSpan) {
            dateSpan.textContent = formattedDate;
        }
    }
}

function calculateTotalComparisons(count) {
    // Fórmula para combinações: n * (n-1) / 2
    return count > 1 ? (count * (count - 1)) / 2 : 0;
}

function getProgressColor(value, type) {
    if (type === 'cliente' || type === 'projeto') {
        return value > 0 ? '#28a745' : '#6c757d';
    }
    
    if (value === 0) return '#6c757d';
    if (value < 50) return '#ffc107';
    if (value < 100) return '#17a2b8';
    return '#28a745';
}

// Função para mostrar detalhes do progresso
function showProgressDetails() {
    const stats = qfdDB.getProjectStats();
    const validation = qfdDB.validateData();
    
    let detailsHTML = `
        <div class="progress-details">
            <h3>Detalhes do Progresso</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <strong>Requisitos de Cliente:</strong> ${stats.requisitosCliente}
                </div>
                <div class="stat-item">
                    <strong>Requisitos de Projeto:</strong> ${stats.requisitosProjeto}
                </div>
                <div class="stat-item">
                    <strong>Comparações Cliente:</strong> ${stats.comparacoesCliente}
                </div>
                <div class="stat-item">
                    <strong>Correlações Projeto:</strong> ${stats.correlacoesProjeto}
                </div>
                <div class="stat-item">
                    <strong>Relações QFD:</strong> ${stats.relacoesQFD}
                </div>
            </div>
    `;
    
    if (!validation.isValid) {
        detailsHTML += `
            <div class="validation-errors">
                <h4>Problemas Encontrados:</h4>
                <ul>
                    ${validation.errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    detailsHTML += '</div>';
    
    // Cria modal simples
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content">
            ${detailsHTML}
            <button class="btn btn-primary" onclick="closeModal()">Fechar</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Adiciona estilos do modal se não existirem
    if (!document.getElementById('modal-styles')) {
        const styles = document.createElement('style');
        styles.id = 'modal-styles';
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
            .modal-content {
                background: white;
                padding: 2rem;
                border-radius: 12px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin: 1rem 0;
            }
            .stat-item {
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid #667eea;
            }
            .validation-errors {
                margin-top: 1rem;
                padding: 1rem;
                background: #f8d7da;
                border-radius: 8px;
                border-left: 4px solid #dc3545;
            }
            .validation-errors ul {
                margin: 0.5rem 0 0 1rem;
            }
            .last-modified-info {
                text-align: center;
                margin-top: 2rem;
                padding-top: 1rem;
                border-top: 1px solid #e9ecef;
                color: #666;
            }
        `;
        document.head.appendChild(styles);
    }
}

function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}

// Adiciona botão de detalhes se não existir
document.addEventListener('DOMContentLoaded', function() {
    const quickActions = document.querySelector('.action-buttons');
    if (quickActions && !document.getElementById('details-btn')) {
        const detailsBtn = document.createElement('button');
        detailsBtn.id = 'details-btn';
        detailsBtn.className = 'btn btn-secondary';
        detailsBtn.innerHTML = '<i class="fas fa-info-circle"></i> Ver Detalhes';
        detailsBtn.onclick = showProgressDetails;
        quickActions.appendChild(detailsBtn);
    }
});

// Função para criar backup automático
function createAutoBackup() {
    const data = qfdDB.exportData();
    const backup = {
        ...data,
        backup: {
            created: new Date().toISOString(),
            type: 'auto'
        }
    };
    
    localStorage.setItem('qfd_backup', JSON.stringify(backup));
}

// Cria backup automático a cada mudança significativa
function setupAutoBackup() {
    const originalSaveData = qfdDB.saveData;
    qfdDB.saveData = function(data) {
        originalSaveData.call(this, data);
        createAutoBackup();
    };
}

// Inicializa backup automático
document.addEventListener('DOMContentLoaded', function() {
    setupAutoBackup();
});

// Função para restaurar backup
function restoreBackup() {
    const backup = localStorage.getItem('qfd_backup');
    if (!backup) {
        alert('Nenhum backup encontrado.');
        return;
    }
    
    if (confirm('Tem certeza que deseja restaurar o backup? Os dados atuais serão perdidos.')) {
        try {
            const backupData = JSON.parse(backup);
            delete backupData.backup; // Remove metadados do backup
            qfdDB.importData(backupData);
            alert('Backup restaurado com sucesso!');
            location.reload();
        } catch (error) {
            alert('Erro ao restaurar backup: ' + error.message);
        }
    }
}

// Adiciona botão de backup se não existir
document.addEventListener('DOMContentLoaded', function() {
    const quickActions = document.querySelector('.action-buttons');
    if (quickActions && !document.getElementById('backup-btn')) {
        const backupBtn = document.createElement('button');
        backupBtn.id = 'backup-btn';
        backupBtn.className = 'btn btn-secondary';
        backupBtn.innerHTML = '<i class="fas fa-download"></i> Backup';
        backupBtn.onclick = exportProjectData;
        quickActions.appendChild(backupBtn);
        
        const restoreBtn = document.createElement('button');
        restoreBtn.id = 'restore-btn';
        restoreBtn.className = 'btn btn-secondary';
        restoreBtn.innerHTML = '<i class="fas fa-upload"></i> Restaurar';
        restoreBtn.onclick = () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = importProjectData;
            input.click();
        };
        quickActions.appendChild(restoreBtn);
    }
});

