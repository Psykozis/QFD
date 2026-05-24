/**
 * ============================================================================
 * ESPECIFICAÇÕES - QUADRO DE REQUISITOS DE PROJETO
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', function() {
    setupDropdownMenu();
    loadPage();
});

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

function loadPage() {
    try {
        qfdDB.getEspecificacoesProjeto();
        const lista = qfdDB.getEspecificacoesOrdenadas();
        const stats = qfdDB.getEspecificacoesStats();
        updateStatus(stats, lista.length);
        renderTable(lista);
    } catch (err) {
        console.error('Erro ao carregar especificações:', err);
        const tbody = document.getElementById('especificacoes-tbody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4">Erro ao carregar dados. Recarregue a página.</td></tr>';
        }
        showToast('Erro ao carregar especificações.', 'danger');
    }
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

    tbody.innerHTML = '';

    if (!lista.length) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="4">Cadastre requisitos de projeto para preencher as especificações.</td>';
        tbody.appendChild(tr);
        return;
    }

    const total = lista.length;
    const t1 = Math.ceil(total / 3);
    const t2 = Math.ceil((2 * total) / 3);

    lista.forEach((row, index) => {
        const req = row.requisito;
        let tercioClass = 'tercio-inferior';
        if (index < t1) tercioClass = 'tercio-superior';
        else if (index < t2) tercioClass = 'tercio-medio';

        const impPct = req.pesoRelativo != null ? (req.pesoRelativo * 100).toFixed(1) + '%' : '-';
        const completo = String(row.unidadeMedida || '').trim() && String(row.valorUnitario || '').trim();

        const tr = document.createElement('tr');
        tr.className = `${tercioClass}${completo ? ' spec-row-complete' : ''}`;
        tr.dataset.reqId = req.id;

        const tdReq = document.createElement('td');
        tdReq.className = 'spec-req-cell';
        tdReq.innerHTML = `
            <span class="spec-rank">#${row.rank}</span>
            <strong>RP${row.numeroOriginal}</strong>
            <span class="spec-desc"></span>
            <small class="spec-meta">Imp. rel.: ${impPct}</small>`;
        tdReq.querySelector('.spec-desc').textContent = req.descricao;

        const tdUnidade = document.createElement('td');
        const inputUnidade = document.createElement('input');
        inputUnidade.type = 'text';
        inputUnidade.className = 'form-control spec-input';
        inputUnidade.dataset.field = 'unidadeMedida';
        inputUnidade.placeholder = 'Ex.: mm, kg, %';
        inputUnidade.value = row.unidadeMedida || '';
        inputUnidade.addEventListener('change', () => saveField(req.id, 'unidadeMedida', inputUnidade.value));
        inputUnidade.addEventListener('blur', () => saveField(req.id, 'unidadeMedida', inputUnidade.value));
        tdUnidade.appendChild(inputUnidade);

        const tdValor = document.createElement('td');
        const inputValor = document.createElement('input');
        inputValor.type = 'text';
        inputValor.className = 'form-control spec-input';
        inputValor.dataset.field = 'valorUnitario';
        inputValor.placeholder = 'Ex.: 10,5';
        inputValor.value = row.valorUnitario || '';
        inputValor.addEventListener('change', () => saveField(req.id, 'valorUnitario', inputValor.value));
        inputValor.addEventListener('blur', () => saveField(req.id, 'valorUnitario', inputValor.value));
        tdValor.appendChild(inputValor);

        const tdAspectos = document.createElement('td');
        const textarea = document.createElement('textarea');
        textarea.className = 'form-control spec-textarea';
        textarea.dataset.field = 'aspectosIndesejaveis';
        textarea.rows = 3;
        textarea.placeholder = 'Conflitos do telhado QFD (--) aparecem aqui';
        textarea.value = row.aspectosIndesejaveis || '';
        textarea.addEventListener('change', () => saveField(req.id, 'aspectosIndesejaveis', textarea.value));
        textarea.addEventListener('blur', () => saveField(req.id, 'aspectosIndesejaveis', textarea.value));
        tdAspectos.appendChild(textarea);

        tr.appendChild(tdReq);
        tr.appendChild(tdUnidade);
        tr.appendChild(tdValor);
        tr.appendChild(tdAspectos);
        tbody.appendChild(tr);
    });
}

function saveField(requisitoProjetoId, field, value) {
    qfdDB.updateEspecificacao(requisitoProjetoId, { [field]: value });
    const stats = qfdDB.getEspecificacoesStats();
    updateStatus(stats, stats.total);

    const row = document.querySelector(`tr[data-req-id="${requisitoProjetoId}"]`);
    if (row) {
        const unidade = row.querySelector('[data-field="unidadeMedida"]')?.value || '';
        const valor = row.querySelector('[data-field="valorUnitario"]')?.value || '';
        row.classList.toggle('spec-row-complete', unidade.trim() !== '' && valor.trim() !== '');
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
        document.body.appendChild(toast);
    }
    toast.className = `spec-toast spec-toast-${type || 'info'}`;
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2800);
}
