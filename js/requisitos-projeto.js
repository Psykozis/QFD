/**
 * JavaScript para Página de Requisitos de Projeto
 */

document.addEventListener('DOMContentLoaded', function() {
    loadRequisitos();
    setupEventListeners();
    updateNavigationState();
});

function setupEventListeners() {
    const form = document.getElementById('form-requisito-projeto');
    if (form) {
        form.addEventListener('submit', handleSubmitRequisito);
    }
    
    // Auto-resize textarea
    const textarea = document.getElementById('descricao-requisito');
    if (textarea) {
        textarea.addEventListener('input', autoResizeTextarea);
    }
}

function handleSubmitRequisito(event) {
    event.preventDefault();
    
    const descricao = document.getElementById('descricao-requisito').value.trim();
    const sentidoMelhoria = document.getElementById('sentido-melhoria').value;
    const dificuldadeTecnica = parseInt(document.getElementById('dificuldade-tecnica').value);
    
    if (!descricao) {
        showAlert('Por favor, insira uma descrição para o requisito.', 'warning');
        return;
    }
    
    if (descricao.length < 10) {
        showAlert('A descrição deve ter pelo menos 10 caracteres.', 'warning');
        return;
    }
    
    if (!sentidoMelhoria) {
        showAlert('Por favor, selecione o sentido da melhoria.', 'warning');
        return;
    }
    
    if (!dificuldadeTecnica || dificuldadeTecnica < 1 || dificuldadeTecnica > 5) {
        showAlert('Por favor, selecione a dificuldade técnica.', 'warning');
        return;
    }
    
    try {
        const novoRequisito = qfdDB.addRequisitoProjeto(descricao, sentidoMelhoria, dificuldadeTecnica);
        
        if (novoRequisito) {
            showAlert('Requisito de projeto adicionado com sucesso!', 'success');
            clearForm();
            loadRequisitos();
            updateNavigationState();
        } else {
            showAlert('Erro ao adicionar requisito. Tente novamente.', 'danger');
        }
    } catch (error) {
        console.error('Erro ao adicionar requisito:', error);
        showAlert('Erro interno. Verifique o console para mais detalhes.', 'danger');
    }
}

function loadRequisitos() {
    const requisitos = qfdDB.getRequisitosProjeto();
    const listaContainer = document.getElementById('lista-requisitos');
    const emptyState = document.getElementById('empty-state');
    const countBadge = document.getElementById('count-requisitos');
    
    if (!listaContainer) return;
    
    // Atualiza contador
    if (countBadge) {
        countBadge.textContent = requisitos.length;
    }
    
    // Mostra/esconde estado vazio
    if (emptyState) {
        emptyState.style.display = requisitos.length === 0 ? 'block' : 'none';
    }
    
    if (requisitos.length === 0) {
        listaContainer.innerHTML = '';
        return;
    }
    
    // Gera HTML dos requisitos
    const requisitosHTML = requisitos.map((requisito, index) => `
        <div class="requisito-item" data-id="${requisito.id}">
            <div class="requisito-header">
                <div class="requisito-number">
                    <span class="number">${index + 1}</span>
                </div>
                <div class="requisito-content">
                    <div class="requisito-description" id="desc-${requisito.id}">
                        ${escapeHtml(requisito.descricao)}
                    </div>
                    <div class="requisito-attributes">
                        <div class="attribute-item">
                            <span class="attribute-label">Sentido:</span>
                            <span class="sentido-badge ${requisito.sentidoMelhoria}">
                                ${getSentidoSymbol(requisito.sentidoMelhoria)} ${getSentidoLabel(requisito.sentidoMelhoria)}
                            </span>
                        </div>
                        <div class="attribute-item">
                            <span class="attribute-label">Dificuldade:</span>
                            <span class="dificuldade-badge level-${requisito.dificuldadeTecnica}">
                                ${getDificuldadeLabel(requisito.dificuldadeTecnica)}
                            </span>
                        </div>
                    </div>
                    <div class="requisito-meta">
                        <small class="text-muted">
                            <i class="fas fa-calendar"></i> 
                            Criado em ${formatDate(requisito.created)}
                            ${requisito.importanciaAbsoluta > 0 ? `| <i class="fas fa-star"></i> Imp. Abs.: ${requisito.importanciaAbsoluta.toFixed(1)}` : ''}
                            ${requisito.importanciaRelativa > 0 ? `| <i class="fas fa-sort-numeric-down"></i> Ranking: ${requisito.importanciaRelativa}º` : ''}
                            ${requisito.pesoRelativo > 0 ? `| <i class="fas fa-percentage"></i> Peso: ${(requisito.pesoRelativo * 100).toFixed(1)}%` : ''}
                        </small>
                    </div>
                </div>
                <div class="requisito-actions">
                    <button class="btn-icon btn-edit" onclick="editRequisito('${requisito.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="deleteRequisito('${requisito.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="requisito-edit-form" id="edit-form-${requisito.id}" style="display: none;">
                <div class="edit-form-content">
                    <div class="form-group">
                        <label>Descrição:</label>
                        <textarea class="form-control" id="edit-desc-${requisito.id}" rows="3">${escapeHtml(requisito.descricao)}</textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Sentido da Melhoria:</label>
                            <select class="form-control" id="edit-sentido-${requisito.id}">
                                <option value="up" ${requisito.sentidoMelhoria === 'up' ? 'selected' : ''}>↑ Crescente</option>
                                <option value="down" ${requisito.sentidoMelhoria === 'down' ? 'selected' : ''}>↓ Decrescente</option>
                                <option value="none" ${requisito.sentidoMelhoria === 'none' ? 'selected' : ''}>* Nominal</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Dificuldade Técnica:</label>
                            <select class="form-control" id="edit-dificuldade-${requisito.id}">
                                <option value="1" ${requisito.dificuldadeTecnica === 1 ? 'selected' : ''}>1 - Muito Fácil</option>
                                <option value="2" ${requisito.dificuldadeTecnica === 2 ? 'selected' : ''}>2 - Fácil</option>
                                <option value="3" ${requisito.dificuldadeTecnica === 3 ? 'selected' : ''}>3 - Moderada</option>
                                <option value="4" ${requisito.dificuldadeTecnica === 4 ? 'selected' : ''}>4 - Difícil</option>
                                <option value="5" ${requisito.dificuldadeTecnica === 5 ? 'selected' : ''}>5 - Muito Difícil</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="edit-actions">
                    <button class="btn btn-sm btn-success" onclick="saveEdit('${requisito.id}')">
                        <i class="fas fa-check"></i> Salvar
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="cancelEdit('${requisito.id}')">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    listaContainer.innerHTML = requisitosHTML;
}

function getSentidoSymbol(sentido) {
    const symbols = {
        'up': '↑',
        'down': '↓',
        'none': '*'
    };
    return symbols[sentido] || '?';
}

function getSentidoLabel(sentido) {
    const labels = {
        'up': 'Crescente',
        'down': 'Decrescente',
        'none': 'Nominal'
    };
    return labels[sentido] || 'Indefinido';
}

function getDificuldadeLabel(dificuldade) {
    const labels = {
        1: 'Muito Fácil',
        2: 'Fácil',
        3: 'Moderada',
        4: 'Difícil',
        5: 'Muito Difícil'
    };
    return labels[dificuldade] || 'Indefinida';
}

function editRequisito(id) {
    const descElement = document.getElementById(`desc-${id}`);
    const editForm = document.getElementById(`edit-form-${id}`);
    
    if (descElement && editForm) {
        descElement.style.display = 'none';
        editForm.style.display = 'block';
        
        const textarea = document.getElementById(`edit-desc-${id}`);
        if (textarea) {
            textarea.focus();
            autoResizeTextarea({ target: textarea });
        }
    }
}

function saveEdit(id) {
    const textarea = document.getElementById(`edit-desc-${id}`);
    const sentidoSelect = document.getElementById(`edit-sentido-${id}`);
    const dificuldadeSelect = document.getElementById(`edit-dificuldade-${id}`);
    
    if (!textarea || !sentidoSelect || !dificuldadeSelect) return;
    
    const novaDescricao = textarea.value.trim();
    const novoSentido = sentidoSelect.value;
    const novaDificuldade = parseInt(dificuldadeSelect.value);
    
    if (!novaDescricao) {
        showAlert('A descrição não pode estar vazia.', 'warning');
        return;
    }
    
    if (novaDescricao.length < 10) {
        showAlert('A descrição deve ter pelo menos 10 caracteres.', 'warning');
        return;
    }
    
    try {
        const updated = qfdDB.updateRequisitoProjeto(id, {
            descricao: novaDescricao,
            sentidoMelhoria: novoSentido,
            dificuldadeTecnica: novaDificuldade
        });
        
        if (updated) {
            showAlert('Requisito atualizado com sucesso!', 'success');
            loadRequisitos();
        } else {
            showAlert('Erro ao atualizar requisito.', 'danger');
        }
    } catch (error) {
        console.error('Erro ao atualizar requisito:', error);
        showAlert('Erro interno. Verifique o console para mais detalhes.', 'danger');
    }
}

function cancelEdit(id) {
    const descElement = document.getElementById(`desc-${id}`);
    const editForm = document.getElementById(`edit-form-${id}`);
    
    if (descElement && editForm) {
        descElement.style.display = 'block';
        editForm.style.display = 'none';
    }
}

function deleteRequisito(id) {
    const requisitos = qfdDB.getRequisitosProjeto();
    const requisito = requisitos.find(r => r.id === id);
    
    if (!requisito) return;
    
    const confirmMessage = `Tem certeza que deseja excluir o requisito:\n\n"${requisito.descricao}"\n\nEsta ação não pode ser desfeita e removerá todas as correlações e relações QFD relacionadas.`;
    
    if (confirm(confirmMessage)) {
        try {
            qfdDB.removeRequisitoProjeto(id);
            showAlert('Requisito excluído com sucesso!', 'success');
            loadRequisitos();
            updateNavigationState();
        } catch (error) {
            console.error('Erro ao excluir requisito:', error);
            showAlert('Erro ao excluir requisito.', 'danger');
        }
    }
}

function clearForm() {
    const form = document.getElementById('form-requisito-projeto');
    if (form) {
        form.reset();
        
        const textarea = document.getElementById('descricao-requisito');
        if (textarea) {
            textarea.style.height = 'auto';
        }
    }
}

function clearAllRequisitos() {
    const requisitos = qfdDB.getRequisitosProjeto();
    
    if (requisitos.length === 0) {
        showAlert('Não há requisitos para excluir.', 'info');
        return;
    }
    
    const confirmMessage = `Tem certeza que deseja excluir TODOS os ${requisitos.length} requisitos de projeto?\n\nEsta ação não pode ser desfeita e removerá todas as correlações e relações QFD relacionadas.`;
    
    if (confirm(confirmMessage)) {
        try {
            requisitos.forEach(req => qfdDB.removeRequisitoProjeto(req.id));
            showAlert('Todos os requisitos foram excluídos!', 'success');
            loadRequisitos();
            updateNavigationState();
        } catch (error) {
            console.error('Erro ao excluir requisitos:', error);
            showAlert('Erro ao excluir requisitos.', 'danger');
        }
    }
}

function exportRequisitos() {
    const requisitos = qfdDB.getRequisitosProjeto();
    
    if (requisitos.length === 0) {
        showAlert('Não há requisitos para exportar.', 'info');
        return;
    }
    
    const csvContent = generateCSV(requisitos);
    downloadFile(csvContent, `requisitos-projeto-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    
    showAlert('Requisitos exportados com sucesso!', 'success');
}

function generateCSV(requisitos) {
    const headers = ['Número', 'Descrição', 'Sentido Melhoria', 'Dificuldade Técnica', 'Imp. Absoluta', 'Ranking', 'Peso (%)', 'Data de Criação'];
    const rows = requisitos.map((req, index) => [
        index + 1,
        `"${req.descricao.replace(/"/g, '""')}"`,
        getSentidoLabel(req.sentidoMelhoria),
        getDificuldadeLabel(req.dificuldadeTecnica),
        req.importanciaAbsoluta.toFixed(2),
        req.importanciaRelativa || 0,
        (req.pesoRelativo * 100).toFixed(2),
        formatDate(req.created)
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

function updateNavigationState() {
    const requisitos = qfdDB.getRequisitosProjeto();
    const btnProximo = document.getElementById('btn-proximo');
    
    if (btnProximo) {
        if (requisitos.length < 2) {
            btnProximo.classList.add('disabled');
            btnProximo.title = 'Adicione pelo menos 2 requisitos para continuar';
        } else {
            btnProximo.classList.remove('disabled');
            btnProximo.title = 'Continuar para a correlação entre requisitos';
        }
    }
}

function autoResizeTextarea(event) {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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

// Adiciona estilos específicos da página
document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('requisitos-projeto-styles')) {
        const styles = document.createElement('style');
        styles.id = 'requisitos-projeto-styles';
        styles.textContent = `
            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }
            
            .requisito-attributes {
                display: flex;
                gap: 1rem;
                margin: 0.5rem 0;
                flex-wrap: wrap;
            }
            
            .attribute-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .attribute-label {
                font-size: 0.875rem;
                color: #6c757d;
                font-weight: 500;
            }
            
            .sentido-badge {
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.75rem;
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
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.75rem;
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
            
            .legend-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
                margin-top: 1rem;
            }
            
            .legend-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 8px;
                border-left: 4px solid #667eea;
            }
            
            .legend-symbol {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                font-weight: bold;
                color: white;
                flex-shrink: 0;
            }
            
            .legend-symbol.up {
                background: #28a745;
            }
            
            .legend-symbol.down {
                background: #dc3545;
            }
            
            .legend-symbol.nominal {
                background: #6c757d;
            }
            
            .legend-content h4 {
                margin: 0 0 0.25rem 0;
                color: #333;
                font-size: 1rem;
            }
            
            .legend-content p {
                margin: 0 0 0.25rem 0;
                color: #666;
                font-size: 0.9rem;
            }
            
            .legend-content small {
                color: #6c757d;
                font-size: 0.8rem;
            }
            
            .edit-form-content {
                margin-bottom: 1rem;
            }
            
            .edit-form-content .form-row {
                margin-top: 0.5rem;
            }
            
            .edit-form-content label {
                font-size: 0.875rem;
                font-weight: 600;
                color: #333;
                margin-bottom: 0.25rem;
            }
            
            @media (max-width: 768px) {
                .form-row {
                    grid-template-columns: 1fr;
                }
                
                .requisito-attributes {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.5rem;
                }
                
                .legend-grid {
                    grid-template-columns: 1fr;
                }
                
                .legend-item {
                    flex-direction: column;
                    text-align: center;
                    gap: 0.5rem;
                }
            }
        `;
        document.head.appendChild(styles);
    }
});

