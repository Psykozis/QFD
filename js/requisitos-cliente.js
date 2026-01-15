/**
 * JavaScript para Página de Requisitos de Cliente
 */

document.addEventListener('DOMContentLoaded', function() {
    loadRequisitos();
    setupEventListeners();
    updateNavigationState();
});

function setupEventListeners() {
    const form = document.getElementById('form-requisito');
    if (form) {
        form.addEventListener('submit', handleSubmitRequisito);
    }
    
    // Auto-resize textarea
    const textarea = document.getElementById('descricao-requisito');
    if (textarea) {
        textarea.addEventListener('input', autoResizeTextarea);
        
        // Salvar com Enter (sem Shift)
        textarea.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmitRequisito(new Event('submit'));
            }
        });
    }

    setupDropdownMenu();
}

function setupDropdownMenu() {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            const menu = this.nextElementSibling;
            if (menu) {
                // Fecha outros menus abertos
                document.querySelectorAll('.dropdown-menu.show').forEach(openMenu => {
                    if (openMenu !== menu) openMenu.classList.remove('show');
                });
                menu.classList.toggle('show');
            }
        });
    });
    
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-dropdown')) {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
}

function handleSubmitRequisito(event) {
    event.preventDefault();
    
    const descricao = document.getElementById('descricao-requisito').value.trim();
    
    if (!descricao) {
        showAlert('Por favor, insira uma descrição para o requisito.', 'warning');
        return;
    }
    
    if (descricao.length < 10) {
        showAlert('A descrição deve ter pelo menos 10 caracteres.', 'warning');
        return;
    }
    
    try {
        const novoRequisito = qfdDB.addRequisitoCliente(descricao);
        
        if (novoRequisito) {
            showAlert('Requisito adicionado com sucesso!', 'success');
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
    const requisitos = qfdDB.getRequisitosCliente();
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
                    <div class="requisito-meta">
                        <small class="text-muted">
                            <i class="fas fa-calendar"></i> 
                            Criado em ${formatDate(requisito.created)}
                            ${requisito.importancia > 0 ? `| <i class="fas fa-star"></i> Importância: ${requisito.importancia.toFixed(1)}` : ''}
                            ${requisito.peso > 0 ? `| <i class="fas fa-percentage"></i> Peso: ${(requisito.peso * 100).toFixed(1)}%` : ''}
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
                <textarea class="form-control" id="edit-desc-${requisito.id}" rows="3">${escapeHtml(requisito.descricao)}</textarea>
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
    if (!textarea) return;
    
    const novaDescricao = textarea.value.trim();
    
    if (!novaDescricao) {
        showAlert('A descrição não pode estar vazia.', 'warning');
        return;
    }
    
    if (novaDescricao.length < 10) {
        showAlert('A descrição deve ter pelo menos 10 caracteres.', 'warning');
        return;
    }
    
    try {
        const updated = qfdDB.updateRequisitoCliente(id, { descricao: novaDescricao });
        
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
    const requisitos = qfdDB.getRequisitosCliente();
    const requisito = requisitos.find(r => r.id === id);
    
    if (!requisito) return;
    
    const confirmMessage = `Tem certeza que deseja excluir o requisito:\n\n"${requisito.descricao}"\n\nEsta ação não pode ser desfeita e removerá todas as comparações relacionadas.`;
    
    if (confirm(confirmMessage)) {
        try {
            qfdDB.removeRequisitoCliente(id);
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
    const form = document.getElementById('form-requisito');
    if (form) {
        form.reset();
        
        const textarea = document.getElementById('descricao-requisito');
        if (textarea) {
            textarea.style.height = 'auto';
        }
    }
}

function clearAllRequisitos() {
    const requisitos = qfdDB.getRequisitosCliente();
    
    if (requisitos.length === 0) {
        showAlert('Não há requisitos para excluir.', 'info');
        return;
    }
    
    const confirmMessage = `Tem certeza que deseja excluir TODOS os ${requisitos.length} requisitos?\n\nEsta ação não pode ser desfeita e removerá todas as comparações e relações QFD relacionadas.`;
    
    if (confirm(confirmMessage)) {
        try {
            requisitos.forEach(req => qfdDB.removeRequisitoCliente(req.id));
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
    const requisitos = qfdDB.getRequisitosCliente();
    
    if (requisitos.length === 0) {
        showAlert('Não há requisitos para exportar.', 'info');
        return;
    }
    
    const csvContent = generateCSV(requisitos);
    downloadFile(csvContent, `requisitos-cliente-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    
    showAlert('Requisitos exportados com sucesso!', 'success');
}

function generateCSV(requisitos) {
    const headers = ['Número', 'Descrição', 'Importância', 'Peso (%)', 'Data de Criação'];
    const rows = requisitos.map((req, index) => [
        index + 1,
        `"${req.descricao.replace(/"/g, '""')}"`,
        req.importancia.toFixed(2),
        (req.peso * 100).toFixed(2),
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
    const requisitos = qfdDB.getRequisitosCliente();
    const btnProximo = document.getElementById('btn-proximo');
    
    if (btnProximo) {
        if (requisitos.length < 2) {
            btnProximo.classList.add('disabled');
            btnProximo.title = 'Adicione pelo menos 2 requisitos para continuar';
        } else {
            btnProximo.classList.remove('disabled');
            btnProximo.title = 'Continuar para a comparação dos requisitos';
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
    
    // Adiciona estilos do botão de fechar se não existirem
    if (!document.getElementById('alert-close-styles')) {
        const styles = document.createElement('style');
        styles.id = 'alert-close-styles';
        styles.textContent = `
            .alert {
                position: relative;
                padding-right: 3rem;
            }
            .alert-close {
                position: absolute;
                top: 50%;
                right: 1rem;
                transform: translateY(-50%);
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                opacity: 0.7;
                transition: opacity 0.3s ease;
            }
            .alert-close:hover {
                opacity: 1;
            }
        `;
        document.head.appendChild(styles);
    }
    
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
    if (!document.getElementById('requisitos-cliente-styles')) {
        const styles = document.createElement('style');
        styles.id = 'requisitos-cliente-styles';
        styles.textContent = `
            .requisito-item {
                border: 1px solid #e9ecef;
                border-radius: 8px;
                margin-bottom: 1rem;
                background: white;
                transition: box-shadow 0.3s ease;
            }
            
            .requisito-item:hover {
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .requisito-header {
                display: flex;
                align-items: flex-start;
                padding: 1rem;
                gap: 1rem;
            }
            
            .requisito-number {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                flex-shrink: 0;
            }
            
            .requisito-content {
                flex: 1;
                min-width: 0;
            }
            
            .requisito-description {
                font-size: 1rem;
                line-height: 1.5;
                margin-bottom: 0.5rem;
                word-wrap: break-word;
            }
            
            .requisito-meta {
                font-size: 0.875rem;
                color: #6c757d;
            }
            
            .requisito-actions {
                display: flex;
                gap: 0.5rem;
                flex-shrink: 0;
            }
            
            .btn-icon {
                background: none;
                border: none;
                padding: 0.5rem;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
                color: #6c757d;
            }
            
            .btn-edit:hover {
                background: #e3f2fd;
                color: #1976d2;
            }
            
            .btn-delete:hover {
                background: #ffebee;
                color: #d32f2f;
            }
            
            .requisito-edit-form {
                padding: 0 1rem 1rem 1rem;
                border-top: 1px solid #e9ecef;
                margin-top: 1rem;
                padding-top: 1rem;
            }
            
            .edit-actions {
                display: flex;
                gap: 0.5rem;
                margin-top: 0.5rem;
            }
            
            .tips-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
                margin-top: 1rem;
            }
            
            .tip-item {
                display: flex;
                align-items: flex-start;
                gap: 1rem;
            }
            
            .tip-icon {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .tip-content h4 {
                margin: 0 0 0.5rem 0;
                color: #333;
                font-size: 1rem;
            }
            
            .tip-content p {
                margin: 0;
                color: #666;
                font-size: 0.9rem;
                line-height: 1.4;
            }
            
            .empty-state {
                text-align: center;
                padding: 3rem 1rem;
                color: #6c757d;
            }
            
            .empty-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
                opacity: 0.5;
            }
            
            .empty-state h3 {
                margin-bottom: 0.5rem;
                color: #495057;
            }
            
            .badge {
                background: #667eea;
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .card-actions {
                display: flex;
                gap: 0.5rem;
            }
            
            .page-navigation {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 2rem;
                padding-top: 2rem;
                border-top: 1px solid #e9ecef;
            }
            
            .btn.disabled {
                opacity: 0.5;
                pointer-events: none;
            }
            
            .form-text {
                color: #6c757d;
                font-size: 0.875rem;
                margin-top: 0.25rem;
            }
            
            .form-actions {
                display: flex;
                gap: 1rem;
                margin-top: 1rem;
            }
            
            @media (max-width: 768px) {
                .requisito-header {
                    flex-direction: column;
                    gap: 0.5rem;
                }
                
                .requisito-actions {
                    align-self: flex-end;
                }
                
                .page-navigation {
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .tips-grid {
                    grid-template-columns: 1fr;
                }
                
                .form-actions {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(styles);
    }
});

