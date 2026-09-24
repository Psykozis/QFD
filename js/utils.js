/**
 * ============================================================================
 * UTILITÁRIOS COMPARTILHADOS
 * ============================================================================
 *
 * Funções usadas por várias páginas. Deve ser carregado depois de database.js
 * e antes do script específico da página.
 *
 * O menu de navegação (dropdowns) é ativado automaticamente em todas as páginas.
 */

document.addEventListener('DOMContentLoaded', setupDropdownMenu);

// ============================================================================
// MENU DE NAVEGAÇÃO
// ============================================================================

/**
 * Ativa todos os dropdowns do menu (.nav-dropdown). Abrir um fecha os demais;
 * clicar fora fecha todos.
 */
function setupDropdownMenu() {
    document.querySelectorAll('.nav-dropdown .dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const menu = this.nextElementSibling;
            if (!menu) return;

            document.querySelectorAll('.dropdown-menu.show, .dropdown-content.show').forEach(open => {
                if (open !== menu) open.classList.remove('show');
            });
            menu.classList.toggle('show');
        });
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-dropdown')) {
            document.querySelectorAll('.dropdown-menu.show, .dropdown-content.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
}

// ============================================================================
// TEXTO E HTML
// ============================================================================

/** Escapa texto para inserção segura como conteúdo HTML */
function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

/** Escapa texto para uso dentro de um atributo HTML (ex.: data-tooltip) */
function escapeAttr(text) {
    return String(text == null ? '' : text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r?\n/g, '&#10;');
}

/** Corta o texto em `limit` caracteres, acrescentando "..." */
function truncateText(text, limit) {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
}

/** Formata uma data ISO como dd/mm/aaaa hh:mm */
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

/** Ajusta a altura de um textarea ao conteúdo (usar como handler de 'input') */
function autoResizeTextarea(event) {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

// ============================================================================
// SENTIDO DE MELHORIA
// ============================================================================

/** Símbolo do sentido de melhoria: ↑ crescente, ↓ decrescente, * nominal */
function getSentidoSymbol(sentido) {
    const key = String(sentido || '').toLowerCase();
    const symbols = {
        up: '↑', down: '↓', none: '*',
        crescente: '↑', decrescente: '↓', nominal: '*'
    };
    return symbols[key] || '?';
}

/** Nome do sentido de melhoria */
function getSentidoLabel(sentido) {
    const labels = { up: 'Crescente', down: 'Decrescente', none: 'Nominal' };
    return labels[sentido] || 'Indefinido';
}

// ============================================================================
// ALERTAS E ARQUIVOS
// ============================================================================

/**
 * Mostra um alerta no topo do conteúdo, que some após 5 segundos
 *
 * @param {string} message - Mensagem (aceita HTML)
 * @param {string} [type='info'] - 'success', 'warning', 'danger' ou 'info'
 */
function showAlert(message, type = 'info') {
    document.querySelectorAll('.alert').forEach(alert => alert.remove());

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${getAlertIcon(type)}"></i>
        ${message}
        <button class="alert-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Estilos do botão de fechar, injetados uma única vez
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

    const mainContent = document.querySelector('.main-content .container');
    if (mainContent) {
        mainContent.insertBefore(alert, mainContent.firstChild);
    }

    setTimeout(() => {
        if (alert.parentElement) {
            alert.remove();
        }
    }, 5000);
}

/** Ícone Font Awesome correspondente ao tipo de alerta */
function getAlertIcon(type) {
    const icons = {
        success: 'check-circle',
        warning: 'exclamation-triangle',
        danger: 'exclamation-circle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// ============================================================================
// CSV
// ============================================================================

/** Formata um valor como célula CSV entre aspas (aspas internas duplicadas) */
function csvCell(value) {
    return `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;
}

/**
 * Lê um texto CSV e devolve as linhas como arrays de células. Suporta campos
 * entre aspas (com vírgulas, quebras de linha e "" dentro), fim de linha
 * Windows/Unix e separador ',' ou ';' (detectado pela primeira linha).
 * Linhas totalmente vazias são descartadas.
 *
 * @param {string} text - Conteúdo do arquivo
 * @returns {string[][]}
 */
function parseCSV(text) {
    text = String(text || '').replace(/^﻿/, ''); // remove BOM do Excel
    const firstLine = text.split(/\r?\n/, 1)[0];
    const sep = (firstLine.split(';').length > firstLine.split(',').length) ? ';' : ',';

    const rows = [];
    let row = [], cell = '', inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
            else if (c === '"') inQuotes = false;
            else cell += c;
        } else if (c === '"') {
            inQuotes = true;
        } else if (c === sep) {
            row.push(cell); cell = '';
        } else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++;
            row.push(cell); rows.push(row);
            row = []; cell = '';
        } else {
            cell += c;
        }
    }
    row.push(cell); rows.push(row);

    return rows.filter(r => r.some(c => c.trim() !== ''));
}

/** Faz o download de um conteúdo de texto como arquivo */
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
