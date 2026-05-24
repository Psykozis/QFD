/**
 * ============================================================================
 * ESPECIFICAÇÕES - QUADRO DE REQUISITOS DE PROJETO
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', function() {
    loadPage();
    setupDropdownMenu();
});

function setupDropdownMenu() {
    const toggle = document.querySelector('.dropdown-toggle');
    const menu = document.querySelector('.dropdown-menu') || document.querySelector('.dropdown-content');
    if (toggle && menu) {
        toggle.addEventListener('click', function(e) {
            e.preventDefault();
            menu.classList.toggle('show');
        });
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.nav-dropdown') && !e.target.closest('li:has(.dropdown-content)')) {
                menu.classList.remove('show');
            }
        });
    }
}

function loadPage() {
    qfdDB.refreshAspectosIndesejaveisFromRoof(true);
    const lista = qfdDB.getEspecificacoesOrdenadas();
    const stats = qfdDB.getEspecificacoesStats();

    updateStatus(stats, lista.length);
    renderTable(lista);
}

function updateStatus(stats, totalReq) {
    const totalEl = document.getElementById('total-requisitos');
    if (totalEl) totalEl.textContent = `${totalReq} Requisitos`;

    const preenchidasEl = document.getElementById('especificacoes-preenchidas');
    if (preenchidasEl) preenchidasEl.textContent = `${stats.completed} / ${stats.total}`;

    const progressoEl = document.getElementById('progresso-percentual');
    if (progressoEl) progressoEl.textContent = `${stats.percent}%`;

    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = `${stats.percent}%`;

    const insufficient = document.getElementById('insufficient-data');
    const section = document.getElementById('especificacoes-section');
    if (totalReq === 0) {
        if (insufficient) insufficient.style.display = 'block';
        if (section) section.style.display = 'none';
    } else {
        if (insufficient) insufficient.style.display = 'none';
        if (section) section.style.display = 'block';
    }
}

function renderTable(lista) {
    const tbody = document.getElementById('especificacoes-tbody');
    if (!tbody) return;

    if (lista.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">Cadastre requisitos de projeto para preencher as especificações.</td></tr>';
        return;
    }

    const total = lista.length;
    const t1 = Math.ceil(total / 3);
    const t2 = Math.ceil((2 * total) / 3);

    tbody.innerHTML = lista.map((row, index) => {
        const req = row.requisito;
        let tercioClass = 'tercio-inferior';
        if (index < t1) tercioClass = 'tercio-superior';
        else if (index < t2) tercioClass = 'tercio-medio';

        const impPct = req.pesoRelativo != null ? (req.pesoRelativo * 100).toFixed(1) + '%' : '-';
        const completo = String(row.unidadeMedida).trim() && String(row.valorUnitario).trim();

        return `
            <tr class="${tercioClass} ${completo ? 'spec-row-complete' : ''}" data-req-id="${req.id}">
                <td class="spec-req-cell">
                    <span class="spec-rank">#${row.rank}</span>
                    <strong>RP${row.numeroOriginal}</strong>
                    <span class="spec-desc">${escapeHtml(req.descricao)}</span>
                    <small class="spec-meta">Imp. rel.: ${impPct}</small>
                </td>
                <td>
                    <input type="text" class="form-control spec-input" data-field="unidadeMedida"
                        value="${escapeHtml(row.unidadeMedida)}" placeholder="Ex.: mm, kg, %"
                        onchange="saveField('${req.id}', 'unidadeMedida', this.value)">
                </td>
                <td>
                    <input type="text" class="form-control spec-input" data-field="valorUnitario"
                        value="${escapeHtml(row.valorUnitario)}" placeholder="Ex.: 10,5"
                        onchange="saveField('${req.id}', 'valorUnitario', this.value)">
                </td>
                <td>
                    <textarea class="form-control spec-textarea" rows="2" data-field="aspectosIndesejaveis"
                        placeholder="Conflitos do telhado QFD (--) aparecem aqui"
                        onchange="saveField('${req.id}', 'aspectosIndesejaveis', this.value)">${escapeHtml(row.aspectosIndesejaveis)}</textarea>
                </td>
            </tr>
        `;
    }).join('');
}

function saveField(requisitoProjetoId, field, value) {
    qfdDB.updateEspecificacao(requisitoProjetoId, { [field]: value });
    const stats = qfdDB.getEspecificacoesStats();
    updateStatus(stats, stats.total);
    const row = document.querySelector(`tr[data-req-id="${requisitoProjetoId}"]`);
    if (row) {
        const unidade = row.querySelector('[data-field="unidadeMedida"]')?.value || '';
        const valor = row.querySelector('[data-field="valorUnitario"]')?.value || '';
        row.classList.toggle('spec-row-complete', unidade.trim() && valor.trim());
    }
}

function refreshAspectosFromRoof() {
    if (!confirm('Atualizar aspectos indesejáveis a partir do telhado QFD? Linhas editadas manualmente serão mantidas.')) {
        return;
    }
    qfdDB.refreshAspectosIndesejaveisFromRoof(true);
    loadPage();
    showToast('Aspectos indesejáveis atualizados a partir das correlações --.', 'success');
}

function exportEspecificacoesJson() {
    exportPageData('especificacoes');
}

function importEspecificacoesJson(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const ok = qfdDB.importEspecificacoesJson(e.target.result);
        if (ok) {
            showToast('Especificações importadas com sucesso!', 'success');
            loadPage();
        } else {
            showToast('Erro ao importar. Verifique o formato JSON.', 'danger');
        }
        event.target.value = '';
    };
    reader.readAsText(file);
}

function showToast(message, type) {
    let toast = document.getElementById('spec-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'spec-toast';
        toast.className = 'spec-toast';
        document.body.appendChild(toast);
    }
    toast.className = `spec-toast spec-toast-${type || 'info'}`;
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2800);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
