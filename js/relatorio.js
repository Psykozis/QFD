/**
 * ============================================================================
 * RELATÓRIO PDF - GERAÇÃO DE DOCUMENTAÇÃO
 * ============================================================================
 */

let requisitosCliente = [];
let requisitosProjeto = [];
let reportConfig = {
    title: 'Análise QFD - Casa da Qualidade',
    company: '',
    author: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
};

document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setupReport();

    const dateInput = document.getElementById('report-date');
    if (dateInput) dateInput.value = reportConfig.date;

    setupEventListeners();
});

function loadData() {
    requisitosCliente = qfdDB.getRequisitosCliente();
    requisitosProjeto = qfdDB.getRequisitosProjeto();
    if (typeof qfdDB.calculateImportanciaProjeto === 'function') {
        qfdDB.calculateImportanciaProjeto();
        requisitosProjeto = qfdDB.getRequisitosProjeto();
    }
}

function setupReport() {
    const hasData = requisitosCliente.length > 0 && requisitosProjeto.length > 0;
    const insufficient = document.getElementById('insufficient-data');
    const config = document.getElementById('report-config');
    const sections = document.getElementById('report-sections');
    const preview = document.getElementById('report-preview');

    if (insufficient) insufficient.style.display = hasData ? 'none' : 'block';
    if (config) config.style.display = hasData ? 'block' : 'none';
    if (sections) sections.style.display = hasData ? 'block' : 'none';
    if (preview) preview.style.display = hasData ? 'block' : 'none';

    updateReportStatusBar(hasData);
    updateSectionCount();

    if (hasData) generatePreview();
}

function updateReportStatusBar(hasData) {
    const elCliente = document.getElementById('total-req-cliente');
    const elProjeto = document.getElementById('total-req-projeto');
    if (elCliente) elCliente.textContent = requisitosCliente.length;
    if (elProjeto) elProjeto.textContent = requisitosProjeto.length;

    const stats = qfdDB.getProjectStats();
    const completude = document.getElementById('completude-sistema');
    if (completude && hasData) {
        const parts = [];
        if (stats.requisitosCliente >= 2) {
            const totalComp = (stats.requisitosCliente * (stats.requisitosCliente - 1)) / 2;
            const pComp = totalComp > 0 ? Math.round((stats.comparacoesCliente / totalComp) * 100) : 0;
            parts.push(pComp);
        }
        if (stats.requisitosProjeto >= 2) {
            const totalCorr = (stats.requisitosProjeto * (stats.requisitosProjeto - 1)) / 2;
            const pCorr = totalCorr > 0 ? Math.round((stats.correlacoesProjeto / totalCorr) * 100) : 0;
            parts.push(pCorr);
        }
        const totalQfd = stats.requisitosCliente * stats.requisitosProjeto;
        const pQfd = totalQfd > 0 ? Math.round((stats.relacoesQFD / totalQfd) * 100) : 0;
        parts.push(pQfd);
        parts.push(stats.especificacoesPercent || 0);
        const media = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;
        completude.textContent = `${media}%`;
    }

    const statusRel = document.getElementById('status-relatorio');
    if (statusRel) {
        statusRel.textContent = hasData ? 'Pronto' : 'Pendente';
    }
}

function setupEventListeners() {
    ['project-title', 'company-name', 'author-name', 'report-date', 'project-description'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateConfig);
    });

    document.querySelectorAll('.section-checkbox input').forEach(cb => {
        cb.addEventListener('change', () => {
            updateSectionCount();
            generatePreview();
        });
    });
}

function updateConfig() {
    reportConfig.title = document.getElementById('project-title')?.value || 'Análise QFD';
    reportConfig.company = document.getElementById('company-name')?.value || '';
    reportConfig.author = document.getElementById('author-name')?.value || '';
    reportConfig.date = document.getElementById('report-date')?.value || reportConfig.date;
    reportConfig.description = document.getElementById('project-description')?.value || '';
    generatePreview();
}

function updateSectionCount() {
    const el = document.getElementById('section-count');
    if (!el) return;
    const n = document.querySelectorAll('.section-checkbox input:checked').length;
    el.textContent = `${n} seção${n !== 1 ? 'ões' : ''} selecionada${n !== 1 ? 's' : ''}`;
}

function isSectionChecked(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
}

function generatePreview() {
    const content = document.getElementById('report-content');
    if (!content) return;

    try {
        let html = `<div class="report-page">
            <div class="report-header">
                <h1>${escapeHtml(reportConfig.title)}</h1>
                ${reportConfig.company ? `<h2>${escapeHtml(reportConfig.company)}</h2>` : ''}
                <p><strong>Data:</strong> ${escapeHtml(reportConfig.date)} | <strong>Autor:</strong> ${escapeHtml(reportConfig.author)}</p>
            </div>`;

        if (isSectionChecked('section-dictionary')) html += safeSection('Dicionário', generateDictionary);
        if (isSectionChecked('section-summary')) html += safeSection('Resumo', generateSummary);
        if (isSectionChecked('section-client-req')) html += safeSection('Req. Cliente', generateClientReqs);
        if (isSectionChecked('section-project-req')) html += safeSection('Req. Projeto', generateProjectReqs);
        if (isSectionChecked('section-roof')) html += safeSection('Telhado', generateRoof);
        if (isSectionChecked('section-correlations')) html += safeSection('Correlações', generateCorrelationsAnalysis);
        if (isSectionChecked('section-qfd-matrix')) html += safeSection('Matriz QFD', generateMatrix);
        if (isSectionChecked('section-especificacoes')) html += safeSection('Especificações', generateEspecificacoes);
        if (isSectionChecked('section-ranking')) html += safeSection('Ranking', generateRankingSection);
        if (isSectionChecked('section-analysis')) html += safeSection('Análises', generateAnalysisSection);
        if (isSectionChecked('section-comparisons')) html += safeSection('Comparações', generateComparisonsSection);

        html += '</div>';
        content.innerHTML = html;
        initReportTooltips();
    } catch (err) {
        console.error('Erro ao gerar preview:', err);
        content.innerHTML = `<div class="report-section"><p class="alert alert-danger">Erro ao gerar relatório: ${escapeHtml(err.message)}</p></div>`;
    }
}

function safeSection(name, fn) {
    try {
        return fn();
    } catch (err) {
        console.error(`Erro na seção ${name}:`, err);
        return `<div class="report-section"><h3>${escapeHtml(name)}</h3><p>Não foi possível carregar esta seção.</p></div>`;
    }
}

function generateDictionary() {
    let html = '<div class="report-section"><h3>Dicionário de Requisitos</h3>';
    html += '<p class="report-hint"><em>Passe o mouse sobre RC, RP e células no preview para ver descrições completas.</em></p>';
    html += '<h4>Requisitos de Cliente (RC)</h4><ul class="report-dict-list">';
    requisitosCliente.forEach((r, i) => {
        html += `<li><strong>RC${i + 1}</strong> — ${escapeHtml(r.descricao)}</li>`;
    });
    html += '</ul><h4>Requisitos de Projeto (RP)</h4><ul class="report-dict-list">';
    requisitosProjeto.forEach((r, i) => {
        html += `<li><strong>RP${i + 1}</strong> ${getSentidoSymbol(r.sentidoMelhoria)} — ${escapeHtml(r.descricao)}</li>`;
    });
    return html + '</ul></div>';
}

function generateSummary() {
    return `<div class="report-section"><h3>Resumo Executivo</h3><p>${escapeHtml(reportConfig.description || 'Sem descrição.')}</p></div>`;
}

function generateClientReqs() {
    let html = '<div class="report-section"><h3>Requisitos do Cliente</h3><table class="report-table"><thead><tr><th>ID</th><th>Descrição</th><th>Peso</th></tr></thead><tbody>';
    requisitosCliente.forEach((r, i) => {
        const tip = `RC${i + 1}: ${r.descricao}`;
        html += `<tr class="report-has-tip" data-report-tip="${escapeAttr(tip)}">
            <td>RC${i + 1}</td>
            <td>${escapeHtml(r.descricao)}</td>
            <td>${((r.peso || 0) * 100).toFixed(1)}%</td>
        </tr>`;
    });
    return html + '</tbody></table></div>';
}

function getSentidoSymbol(sentido) {
    const key = String(sentido || '').toLowerCase();
    const symbols = {
        up: '↑', down: '↓', none: '*',
        crescente: '↑', decrescente: '↓', nominal: '*'
    };
    return symbols[key] || '-';
}

function generateProjectReqs() {
    const ordenados = [...requisitosProjeto].sort((a, b) => (b.importanciaAbsoluta || 0) - (a.importanciaAbsoluta || 0));
    const total = ordenados.length;
    const t1 = Math.ceil(total / 3);
    const t2 = Math.ceil((2 * total) / 3);

    let html = `<div class="report-section">
        <h3>Requisitos de Projeto</h3>
        <div class="tercios-legend">
            <div class="tercio-item tercio-superior"><strong>Terço Superior:</strong> maior importância relativa (verde).</div>
            <div class="tercio-item tercio-medio"><strong>Terço Médio:</strong> importância intermediária (vermelho).</div>
            <div class="tercio-item tercio-inferior"><strong>Terço Inferior:</strong> menor importância relativa (laranja).</div>
        </div>
        <table class="report-table"><thead><tr><th>ID</th><th>Descrição</th><th>Sentido</th><th>Imp. Rel.</th><th>Terço</th></tr></thead><tbody>`;

    ordenados.forEach((r, i) => {
        let tercio = 'Inferior';
        let tercioClass = 'tercio-inferior';
        if (i < t1) { tercio = 'Superior'; tercioClass = 'tercio-superior'; }
        else if (i < t2) { tercio = 'Médio'; tercioClass = 'tercio-medio'; }

        const rpNum = requisitosProjeto.findIndex(x => x.id === r.id) + 1;
        const impRel = r.pesoRelativo != null ? (r.pesoRelativo * 100).toFixed(1) + '%' : '-';

        html += `<tr class="${tercioClass} report-has-tip" data-report-tip="${escapeAttr(`RP${rpNum}: ${r.descricao}`)}">
            <td>RP${rpNum}</td>
            <td>${escapeHtml(r.descricao)}</td>
            <td>${getSentidoSymbol(r.sentidoMelhoria)}</td>
            <td>${impRel}</td>
            <td><strong>${tercio}</strong></td>
        </tr>`;
    });
    return html + '</tbody></table></div>';
}

function generateRoof() {
    const correlacoes = qfdDB.getCorrelacoesProjeto();
    let html = '<div class="report-section"><h3>Telhado de Correlações</h3><table class="report-table roof-table"><thead><tr><th></th>';
    requisitosProjeto.forEach((rp, i) => {
        html += `<th class="report-has-tip" data-report-tip="${escapeAttr(`RP${i + 1}: ${rp.descricao}`)}">RP${i + 1} ${getSentidoSymbol(rp.sentidoMelhoria)}</th>`;
    });
    html += '</tr></thead><tbody>';

    for (let i = 0; i < requisitosProjeto.length; i++) {
        html += `<tr><th class="report-has-tip" data-report-tip="${escapeAttr(`RP${i + 1}: ${requisitosProjeto[i].descricao}`)}">${i + 1}</th>`;
        for (let j = 0; j < requisitosProjeto.length; j++) {
            if (i === j) {
                html += '<td class="diagonal">—</td>';
            } else if (j < i) {
                html += '<td class="empty"></td>';
            } else {
                const corr = correlacoes.find(c =>
                    (c.requisito1 === requisitosProjeto[i].id && c.requisito2 === requisitosProjeto[j].id) ||
                    (c.requisito1 === requisitosProjeto[j].id && c.requisito2 === requisitosProjeto[i].id)
                );
                const val = corr ? corr.correlacao : '';
                html += `<td class="corr-cell report-has-tip" data-report-tip="${escapeAttr(`RP${i + 1} ↔ RP${j + 1}: ${val || 'sem correlação'}`)}">${val}</td>`;
            }
        }
        html += '</tr>';
    }
    return html + '</tbody></table></div>';
}

function generateCorrelationsAnalysis() {
    const correlacoes = qfdDB.getCorrelacoesProjeto();
    const counts = { '++': 0, '+': 0, '-': 0, '--': 0 };
    correlacoes.forEach(c => { if (counts[c.correlacao] !== undefined) counts[c.correlacao]++; });

    let html = '<div class="report-section"><h3>Análise de Correlações</h3>';
    html += `<p><strong>++</strong> ${counts['++']} | <strong>+</strong> ${counts['+']} | <strong>-</strong> ${counts['-']} | <strong>--</strong> ${counts['--']}</p>`;

    const fortes = correlacoes.filter(c => c.correlacao === '--' || c.correlacao === '++');
    if (fortes.length) {
        html += '<ul class="report-dict-list">';
        fortes.forEach(c => {
            const i1 = requisitosProjeto.findIndex(r => r.id === c.requisito1) + 1;
            const i2 = requisitosProjeto.findIndex(r => r.id === c.requisito2) + 1;
            html += `<li>RP${i1} ↔ RP${i2}: <strong>${c.correlacao}</strong></li>`;
        });
        html += '</ul>';
    } else {
        html += '<p>Nenhuma correlação forte registrada.</p>';
    }
    return html + '</div>';
}

function generateMatrix() {
    let html = '<div class="report-section"><h3>Matriz QFD</h3><div class="qfd-matrix-report-wrapper"><table class="report-table qfd-matrix-report"><thead><tr><th class="qfd-corner-cell">RC \\ RP</th>';
    requisitosProjeto.forEach((rp, i) => {
        html += `<th class="qfd-rp-header report-has-tip" data-report-tip="${escapeAttr(`RP${i + 1}: ${rp.descricao}`)}"><span>RP${i + 1}</span></th>`;
    });
    html += '<th>Peso</th></tr></thead><tbody>';

    requisitosCliente.forEach((rc, idx) => {
        html += `<tr><td class="qfd-rc-label report-has-tip" data-report-tip="${escapeAttr(`RC${idx + 1}: ${rc.descricao}`)}">RC${idx + 1}</td>`;
        requisitosProjeto.forEach((rp, j) => {
            const val = qfdDB.getMatrizQFD(rc.id, rp.id);
            html += `<td class="qfd-cell report-has-tip" data-report-tip="${escapeAttr(`RC${idx + 1} × RP${j + 1}: influência ${val || 'não definida'}`)}">${val || ''}</td>`;
        });
        html += `<td>${((rc.peso || 0) * 100).toFixed(1)}%</td></tr>`;
    });
    return html + '</tbody></table></div></div>';
}

function generateEspecificacoes() {
    let lista;
    try {
        lista = qfdDB.getEspecificacoesOrdenadas();
    } catch (e) {
        return '<div class="report-section"><h3>Especificações de Projeto</h3><p>Dados de especificações indisponíveis.</p></div>';
    }

    if (!lista.length) {
        return '<div class="report-section"><h3>Especificações de Projeto</h3><p>Nenhum requisito de projeto cadastrado.</p></div>';
    }

    const total = lista.length;
    const t1 = Math.ceil(total / 3);
    const t2 = Math.ceil((2 * total) / 3);

    let html = '<div class="report-section"><h3>Especificações dos Requisitos de Projeto</h3>';
    html += '<p class="report-hint">Ordenados pela hierarquia do QFD.</p>';
    html += '<table class="report-table especificacoes-report-table"><thead><tr>';
    html += '<th>#</th><th>Requisito</th><th>Unidade</th><th>Valor unit.</th><th>Aspectos indesejáveis</th></tr></thead><tbody>';

    lista.forEach((row, index) => {
        let tercioClass = 'tercio-inferior';
        if (index < t1) tercioClass = 'tercio-superior';
        else if (index < t2) tercioClass = 'tercio-medio';

        const aspectos = row.aspectosIndesejaveis || '—';

        html += `<tr class="${tercioClass} report-has-tip" data-report-tip="${escapeAttr(`RP${row.numeroOriginal}: ${row.requisito.descricao}`)}">
            <td>${row.rank}</td>
            <td><strong>RP${row.numeroOriginal}</strong> — ${escapeHtml(row.requisito.descricao)}</td>
            <td>${escapeHtml(row.unidadeMedida || '—')}</td>
            <td>${escapeHtml(row.valorUnitario || '—')}</td>
            <td class="spec-aspectos-cell">${escapeHtml(aspectos).replace(/\n/g, '<br>')}</td>
        </tr>`;
    });

    return html + '</tbody></table></div>';
}

function generateRankingSection() {
    const clientes = [...requisitosCliente].sort((a, b) => (b.importancia || 0) - (a.importancia || 0));
    const projetos = [...requisitosProjeto].sort((a, b) => (b.importanciaAbsoluta || 0) - (a.importanciaAbsoluta || 0));

    let html = '<div class="report-section"><h3>Ranking de Prioridades</h3>';
    html += '<h4>Requisitos de Cliente</h4><ol>';
    clientes.forEach(r => {
        const i = requisitosCliente.findIndex(x => x.id === r.id) + 1;
        html += `<li>RC${i}: ${escapeHtml(r.descricao)} — ${r.importancia || 0} pts</li>`;
    });
    html += '</ol><h4>Requisitos de Projeto (QFD)</h4><ol>';
    projetos.forEach(r => {
        const i = requisitosProjeto.findIndex(x => x.id === r.id) + 1;
        const pct = r.pesoRelativo != null ? (r.pesoRelativo * 100).toFixed(1) + '%' : '-';
        html += `<li>RP${i}: ${escapeHtml(r.descricao)} — ${pct}</li>`;
    });
    return html + '</ol></div>';
}

function generateAnalysisSection() {
    const stats = qfdDB.getProjectStats();
    return `<div class="report-section"><h3>Análises e Insights</h3>
        <ul class="report-dict-list">
            <li>${stats.requisitosCliente} requisitos de cliente; ${stats.requisitosProjeto} de projeto.</li>
            <li>Comparações cliente: ${stats.comparacoesCliente} realizadas.</li>
            <li>Correlações de projeto: ${stats.correlacoesProjeto} definidas.</li>
            <li>Relações na matriz QFD: ${stats.relacoesQFD}.</li>
            <li>Especificações preenchidas: ${stats.especificacoesCompletas || 0} de ${stats.especificacoesTotal || 0} (${stats.especificacoesPercent || 0}%).</li>
        </ul></div>`;
}

function generateComparisonsSection() {
    const comparacoes = qfdDB.getComparacoesCliente();
    if (!comparacoes.length) return '';

    let html = '<div class="report-section"><h3>Comparações de Requisitos de Cliente</h3>';
    html += '<table class="report-table"><thead><tr><th>Par</th><th>Vencedor</th><th>Importância</th><th>Detalhe</th></tr></thead><tbody>';

    comparacoes.forEach(c => {
        const req1 = requisitosCliente.find(r => r.id === c.requisito1);
        const req2 = requisitosCliente.find(r => r.id === c.requisito2);
        if (!req1 || !req2) return;

        const i1 = requisitosCliente.indexOf(req1) + 1;
        const i2 = requisitosCliente.indexOf(req2) + 1;

        html += `<tr class="report-has-tip" data-report-tip="${escapeAttr(`RC${i1} vs RC${i2}: importância ${c.valor}`)}">
            <td>RC${i1} vs RC${i2}</td>
            <td>RC${i1}</td>
            <td>${c.valor}</td>
            <td>${escapeHtml(truncateText(req1.descricao, 40))} / ${escapeHtml(truncateText(req2.descricao, 40))}</td>
        </tr>`;
    });

    return html + '</tbody></table></div>';
}

function initReportTooltips() {
    let tipEl = document.getElementById('report-tooltip-float');
    if (!tipEl) {
        tipEl = document.createElement('div');
        tipEl.id = 'report-tooltip-float';
        tipEl.className = 'report-tooltip-float';
        document.body.appendChild(tipEl);
    }

    document.querySelectorAll('#report-content .report-has-tip').forEach(el => {
        el.addEventListener('mouseenter', (e) => {
            const text = el.getAttribute('data-report-tip');
            if (!text) return;
            tipEl.textContent = text;
            tipEl.style.display = 'block';
            moveReportTooltip(e, tipEl);
        });
        el.addEventListener('mousemove', (e) => moveReportTooltip(e, tipEl));
        el.addEventListener('mouseleave', () => { tipEl.style.display = 'none'; });
    });
}

function moveReportTooltip(e, tipEl) {
    const pad = 12;
    let left = e.clientX + pad;
    let top = e.clientY + pad;
    tipEl.style.left = left + 'px';
    tipEl.style.top = top + 'px';
}

function truncateText(text, limit) {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
}

function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function escapeAttr(text) {
    if (text == null) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\r?\n/g, ' ');
}

function printReport() {
    window.print();
}

function refreshPreview() {
    loadData();
    setupReport();
}

function clearHistory() {
    const list = document.getElementById('history-list');
    if (list) list.innerHTML = '<p>Nenhum histórico salvo.</p>';
}

async function generatePDF() {
    const reportElement = document.getElementById('report-content');
    if (!reportElement) return;

    if (!window.jspdf || !window.html2canvas) {
        alert('Bibliotecas de PDF não carregadas. Recarregue a página e tente novamente.');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const canvas = await window.html2canvas(reportElement, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 8;
        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - margin * 2;
        const imgWidth = usableWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = margin;

        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= usableHeight;

        while (heightLeft > 0) {
            position = heightLeft - imgHeight + margin;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
            heightLeft -= usableHeight;
        }

        const safeTitle = (reportConfig.title || 'relatorio-qfd').replace(/[^\w\-]+/g, '_');
        pdf.save(`${safeTitle}.pdf`);
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Erro ao gerar PDF. Tente novamente.');
    }
}
