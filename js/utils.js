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

/**
 * Lê o primeiro número de um texto, aceitando vírgula decimal e separador de
 * milhar ("1,2" → 1.2; "1.234,5 kg" → 1234.5; "1.500" → 1500; "0.25" → 0.25;
 * "≤ 20 kW" → 20).
 *
 * @param {string} text
 * @returns {number|null} null se não houver número
 */
function parseNumero(text) {
    const match = String(text == null ? '' : text).match(/-?\d[\d.,]*/);
    if (!match) return null;
    let s = match[0].replace(/[.,]$/, '');
    const lastComma = s.lastIndexOf(','), lastDot = s.lastIndexOf('.');
    if (lastComma !== -1 && lastDot !== -1) {
        // o último separador é o decimal; o outro é de milhar
        s = lastComma > lastDot ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    } else if (lastComma !== -1) {
        s = (s.match(/,/g).length > 1) ? s.replace(/,/g, '') : s.replace(',', '.');
    } else if (lastDot !== -1 && (s.match(/\./g).length > 1 || /^-?[1-9]\d{0,2}\.\d{3}$/.test(s))) {
        s = s.replace(/\./g, ''); // ponto de milhar, como se escreve em português
    }
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : null;
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
// AVALIAÇÃO COMPETITIVA
// ============================================================================

/** Cores dos produtos na avaliação competitiva (a primeira é a do nosso produto) */
const CORES_PRODUTOS = ['#4f46e5', '#dc2626', '#16a34a', '#ea580c', '#0891b2', '#9333ea', '#ca8a04'];

/** Texto e classe CSS da situação de um requisito frente ao melhor concorrente */
function getSituacaoCompetitiva(situacao) {
    const map = {
        frente: { texto: 'À frente', classe: 'sit-frente' },
        empate: { texto: 'Empatado', classe: 'sit-empate' },
        atras: { texto: 'Atrás', classe: 'sit-atras' }
    };
    return map[situacao] || { texto: '—', classe: 'sit-sem-dados' };
}

/**
 * Gráfico da avaliação dos clientes (perfil de cada produto de 1 a 5 por
 * requisito de cliente, como na Casa da Qualidade), em SVG + legenda HTML.
 *
 * @param {Object} analise - Resultado de qfdDB.getAnaliseCompetitiva()
 * @returns {string} HTML, ou '' se não houver nenhuma nota
 */
function buildGraficoCompetitivo(analise) {
    const { produtos, clientes } = analise;
    if (!clientes.some(c => produtos.some(p => c.notas[p.id]) || c.meta)) return '';

    const labelW = 60, plotW = 320, rowH = 28, top = 28, pad = 16;
    const width = labelW + plotW + pad * 2;
    const height = top + clientes.length * rowH + 8;
    const x = n => labelW + pad + (n - 1) * (plotW / 4);
    const yRow = i => top + i * rowH + rowH / 2;
    const offset = k => (k - (produtos.length - 1) / 2) * 3;

    let svg = `<svg class="grafico-competitivo" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Avaliação dos clientes por requisito">`;
    for (let n = 1; n <= 5; n++) {
        svg += `<line x1="${x(n)}" y1="${top - 6}" x2="${x(n)}" y2="${height - 4}" stroke="#d7dee8" stroke-width="1"/>`;
        svg += `<text x="${x(n)}" y="${top - 12}" text-anchor="middle" font-size="12" fill="#475569">${n}</text>`;
    }
    clientes.forEach((c, i) => {
        if (i % 2 === 0) svg += `<rect x="0" y="${top + i * rowH}" width="${width}" height="${rowH}" fill="#f1f5f9" opacity="0.6"/>`;
        svg += `<text x="8" y="${yRow(i) + 4}" font-size="12" font-weight="bold" fill="#0f172a"><title>${escapeHtml(c.requisito.descricao)}</title>RC${c.numero}</text>`;
    });

    produtos.forEach((p, k) => {
        const cor = CORES_PRODUTOS[k % CORES_PRODUTOS.length];
        const pontos = clientes.map((c, i) => c.notas[p.id] ? [x(c.notas[p.id]), yRow(i) + offset(k)] : null).filter(Boolean);
        if (pontos.length > 1) {
            svg += `<polyline points="${pontos.map(pt => pt.join(',')).join(' ')}" fill="none" stroke="${cor}" stroke-width="${k === 0 ? 2.5 : 1.5}"${k === 0 ? '' : ' stroke-dasharray="5,3"'} opacity="0.85"/>`;
        }
        clientes.forEach((c, i) => {
            const nota = c.notas[p.id];
            if (!nota) return;
            svg += `<circle cx="${x(nota)}" cy="${yRow(i) + offset(k)}" r="${k === 0 ? 6 : 5}" fill="${cor}" stroke="white" stroke-width="1.5"><title>${escapeHtml(p.nome)} — RC${c.numero}: nota ${nota}</title></circle>`;
        });
    });

    clientes.forEach((c, i) => {
        if (!c.meta) return;
        svg += `<rect x="${x(c.meta) - 7}" y="${yRow(i) - 7}" width="14" height="14" fill="none" stroke="#0f172a" stroke-width="2"><title>Meta RC${c.numero}: ${c.meta}</title></rect>`;
    });
    svg += '</svg>';

    let legenda = '<div class="grafico-legenda">';
    produtos.forEach((p, k) => {
        legenda += `<span><i style="background:${CORES_PRODUTOS[k % CORES_PRODUTOS.length]}"></i>${escapeHtml(p.nome)}</span>`;
    });
    legenda += '<span><i class="legenda-meta"></i>Meta</span></div>';

    return `<div class="grafico-competitivo-wrapper">${svg}${legenda}<p class="grafico-escala">1 = pior avaliação &nbsp;·&nbsp; 5 = melhor avaliação</p></div>`;
}

/** Formata um número com vírgula decimal (até 3 casas) */
function formatarNumero(n) {
    return Number.isInteger(n) ? String(n) : n.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
}

/** Resumo em listas: pontos fortes, a melhorar, metas técnicas e inconsistências */
function buildResultadoHtml(analise) {
    const nosso = escapeHtml(analise.produtos[0].nome);
    const porPeso = lista => [...lista].sort((a, b) => b.peso - a.peso);
    const frente = porPeso(analise.clientes.filter(c => c.situacao === 'frente'));
    const atras = porPeso(analise.clientes.filter(c => c.situacao === 'atras'));
    const metasAtras = analise.tecnicos.filter(t => t.situacao === 'atras');

    if (!analise.concorrentes.length) {
        return '<p class="competitiva-hint">Adicione pelo menos um concorrente e preencha as notas para ver a comparação.</p>';
    }

    const itemRc = c => `<li><strong>RC${c.numero}</strong> — ${escapeHtml(c.requisito.descricao)}
        <small>(${nosso}: ${c.nossa} × ${escapeHtml(c.melhor.produtos.join(', '))}: ${c.melhor.valor}; peso ${(c.peso * 100).toFixed(1)}%)</small></li>`;

    let html = '<div class="resultado-grid">';
    html += `<div class="resultado-bloco resultado-frente"><h4><i class="fas fa-thumbs-up"></i> Pontos fortes (${frente.length})</h4>`;
    html += frente.length ? `<ul>${frente.map(itemRc).join('')}</ul>` : '<p>Nenhum requisito em que o nosso produto supera todos os concorrentes.</p>';
    html += '</div>';

    html += `<div class="resultado-bloco resultado-atras"><h4><i class="fas fa-tools"></i> A melhorar (${atras.length})</h4>`;
    html += atras.length ? `<ul>${atras.map(itemRc).join('')}</ul>` : '<p>Nenhum requisito em que estamos atrás.</p>';
    html += '</div>';

    html += `<div class="resultado-bloco resultado-metas"><h4><i class="fas fa-bullseye"></i> Metas técnicas abaixo do melhor concorrente (${metasAtras.length})</h4>`;
    html += metasAtras.length
        ? `<ul>${metasAtras.map(t => `<li><strong>RP${t.numero}</strong> — ${escapeHtml(t.requisito.descricao)}
            <small>(meta ${escapeHtml(t.meta)} × ${escapeHtml(t.melhor.produtos.join(', '))}: ${formatarNumero(t.melhor.valor)} ${escapeHtml(t.unidade)})</small></li>`).join('')}</ul>
            <p class="competitiva-hint">Reveja essas metas nas Especificações, ou justifique por que ficar abaixo do concorrente é aceitável.</p>`
        : '<p>Nenhuma meta abaixo do melhor concorrente (ou faltam valores para comparar).</p>';
    html += '</div>';

    html += `<div class="resultado-bloco resultado-inconsistencias"><h4><i class="fas fa-exclamation-triangle"></i> Inconsistências (${analise.inconsistencias.length})</h4>`;
    html += analise.inconsistencias.length
        ? `<ul>${analise.inconsistencias.map(i => `<li><strong>RC${i.numero}</strong> — os clientes preferem <strong>${escapeHtml(i.preferido)}</strong> a <strong>${escapeHtml(i.outro)}</strong>,
            mas os valores técnicos de ${i.requisitosProjeto.map(n => 'RP' + n).join(', ')} (relação forte na matriz) favorecem ${escapeHtml(i.outro)}.</li>`).join('')}</ul>
            <p class="competitiva-hint">Verifique as medições e as notas, ou se falta algum requisito de projeto que explique a preferência dos clientes.</p>`
        : '<p>Nenhuma inconsistência entre as notas dos clientes e os valores técnicos.</p>';
    html += '</div></div>';
    return html;
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
