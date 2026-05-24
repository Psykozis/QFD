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
    document.getElementById('insufficient-data').style.display = hasData ? 'none' : 'block';
    document.getElementById('report-config').style.display = hasData ? 'block' : 'none';
    document.getElementById('report-sections').style.display = hasData ? 'block' : 'none';
    document.getElementById('report-preview').style.display = hasData ? 'block' : 'none';

    if (hasData) generatePreview();
}

function setupEventListeners() {
    ['project-title', 'company-name', 'author-name', 'report-date', 'project-description'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateConfig);
    });

    document.querySelectorAll('.section-checkbox input').forEach(cb => {
        cb.addEventListener('change', generatePreview);
    });
}

function updateConfig() {
    reportConfig.title = document.getElementById('project-title').value || 'Análise QFD';
    reportConfig.company = document.getElementById('company-name').value;
    reportConfig.author = document.getElementById('author-name').value;
    reportConfig.date = document.getElementById('report-date').value;
    reportConfig.description = document.getElementById('project-description').value;
    generatePreview();
}

function isSectionChecked(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
}

function generatePreview() {
    const content = document.getElementById('report-content');
    if (!content) return;

    let html = `<div class="report-page">
        <div class="report-header">
            <h1>${escapeHtml(reportConfig.title)}</h1>
            ${reportConfig.company ? `<h2>${escapeHtml(reportConfig.company)}</h2>` : ''}
            <p><strong>Data:</strong> ${reportConfig.date} | <strong>Autor:</strong> ${escapeHtml(reportConfig.author)}</p>
        </div>`;

    if (isSectionChecked('section-dictionary')) html += generateDictionary();
    if (isSectionChecked('section-summary')) html += generateSummary();
    if (isSectionChecked('section-client-req')) html += generateClientReqs();
    if (isSectionChecked('section-project-req')) html += generateProjectReqs();
    if (isSectionChecked('section-roof')) html += generateRoof();
    if (isSectionChecked('section-qfd-matrix')) html += generateMatrix();
    if (isSectionChecked('section-especificacoes')) html += generateEspecificacoes();
    html += generateComparisonsSection();

    html += '</div>';
    content.innerHTML = html;
    initReportTooltips();
}

/** Dicionário RC/RP — garante referência no PDF (html2canvas não preserva hover) */
function generateDictionary() {
    let html = '<div class="report-section"><h3>Dicionário de Requisitos</h3>';
    html += '<p class="report-hint"><em>Passe o mouse sobre RC, RP e células no preview para ver descrições. No PDF exportado, use esta seção como referência.</em></p>';
    html += '<h4>Requisitos de Cliente (RC)</h4><ul class="report-dict-list">';
    requisitosCliente.forEach((r, i) => {
        html += `<li><strong>RC${i + 1}</strong> — ${escapeHtml(r.descricao)}</li>`;
    });
    html += '</ul><h4>Requisitos de Projeto (RP)</h4><ul class="report-dict-list">';
    requisitosProjeto.forEach((r, i) => {
        html += `<li><strong>RP${i + 1}</strong> ${getSentidoSymbol(r.sentidoMelhoria)} — ${escapeHtml(r.descricao)}</li>`;
    });
    html += '</ul></div>';
    return html;
}

function generateSummary() {
    return `<div class="report-section"><h3>Resumo</h3><p>${escapeHtml(reportConfig.description || 'Sem descrição.')}</p></div>`;
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
    const key = (sentido || '').toLowerCase();
    const symbols = {
        up: '↑', down: '↓', none: '*',
        crescente: '↑', decrescente: '↓', nominal: '*'
    };
    return symbols[key] || (sentido === 'up' || sentido === 'down' || sentido === 'none' ? symbols[sentido] : '-');
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
        if (i < t1) {
            tercio = 'Superior';
            tercioClass = 'tercio-superior';
        } else if (i < t2) {
            tercio = 'Médio';
            tercioClass = 'tercio-medio';
        }

        const rpNum = requisitosProjeto.findIndex(x => x.id === r.id) + 1;
        const impRel = r.pesoRelativo != null ? (r.pesoRelativo * 100).toFixed(1) + '%' : '-';
        const tip = `RP${rpNum}: ${r.descricao}`;

        html += `<tr class="${tercioClass} report-has-tip" data-report-tip="${escapeAttr(tip)}">
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
        const tip = `RP${i + 1}: ${rp.descricao} | Sentido: ${getSentidoSymbol(rp.sentidoMelhoria)}`;
        html += `<th class="report-has-tip" data-report-tip="${escapeAttr(tip)}">RP${i + 1} ${getSentidoSymbol(rp.sentidoMelhoria)}</th>`;
    });
    html += '</tr></thead><tbody>';

    for (let i = 0; i < requisitosProjeto.length; i++) {
        const rpRow = requisitosProjeto[i];
        const rowTip = `RP${i + 1}: ${rpRow.descricao}`;
        html += `<tr><th class="report-has-tip" data-report-tip="${escapeAttr(rowTip)}">${i + 1}</th>`;
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
                const tip = `RP${i + 1} (${truncateText(rpRow.descricao, 40)}) ↔ RP${j + 1} (${truncateText(requisitosProjeto[j].descricao, 40)}): ${val || 'sem correlação'}`;
                html += `<td class="corr-cell report-has-tip" data-report-tip="${escapeAttr(tip)}">${val}</td>`;
            }
        }
        html += '</tr>';
    }
    return html + '</tbody></table></div>';
}

function generateMatrix() {
    let html = '<div class="report-section"><h3>Matriz QFD</h3><div class="qfd-matrix-report-wrapper"><table class="report-table qfd-matrix-report"><thead><tr><th class="qfd-corner-cell">RC \\ RP</th>';
    requisitosProjeto.forEach((rp, i) => {
        const tip = `RP${i + 1}: ${rp.descricao}`;
        html += `<th class="qfd-rp-header report-has-tip" data-report-tip="${escapeAttr(tip)}"><span>RP${i + 1}</span></th>`;
    });
    html += '<th>Peso</th></tr></thead><tbody>';

    requisitosCliente.forEach((rc, idx) => {
        const rcTip = `RC${idx + 1}: ${rc.descricao}`;
        html += `<tr><td class="qfd-rc-label report-has-tip" data-report-tip="${escapeAttr(rcTip)}">RC${idx + 1}</td>`;
        requisitosProjeto.forEach((rp, j) => {
            const val = qfdDB.getMatrizQFD(rc.id, rp.id);
            const tip = `RC${idx + 1}: ${rc.descricao} | RP${j + 1}: ${rp.descricao} | Influência: ${val || 'não definida'}`;
            html += `<td class="qfd-cell report-has-tip" data-report-tip="${escapeAttr(tip)}">${val || ''}</td>`;
        });
        html += `<td class="report-has-tip" data-report-tip="Peso de RC${idx + 1}: ${((rc.peso || 0) * 100).toFixed(1)}%">${((rc.peso || 0) * 100).toFixed(1)}%</td></tr>`;
    });
    return html + '</tbody></table></div></div>';
}

function generateEspecificacoes() {
    const lista = qfdDB.getEspecificacoesOrdenadas();
    if (!lista.length) {
        return '<div class="report-section"><h3>Especificações de Projeto</h3><p>Nenhum requisito de projeto cadastrado.</p></div>';
    }

    const total = lista.length;
    const t1 = Math.ceil(total / 3);
    const t2 = Math.ceil((2 * total) / 3);

    let html = '<div class="report-section"><h3>Especificações dos Requisitos de Projeto</h3>';
    html += '<p class="report-hint">Requisitos ordenados pela hierarquia do QFD (maior importância relativa primeiro).</p>';
    html += '<table class="report-table especificacoes-report-table"><thead><tr>';
    html += '<th>#</th><th>Requisito</th><th>Unidade</th><th>Valor unit.</th><th>Aspectos indesejáveis</th>';
    html += '</tr></thead><tbody>';

    lista.forEach((row, index) => {
        let tercioClass = 'tercio-inferior';
        if (index < t1) tercioClass = 'tercio-superior';
        else if (index < t2) tercioClass = 'tercio-medio';

        const tip = `RP${row.numeroOriginal}: ${row.requisito.descricao}`;
        const aspectos = row.aspectosIndesejaveis || '—';

        html += `<tr class="${tercioClass} report-has-tip" data-report-tip="${escapeAttr(tip)}">
            <td>${row.rank}</td>
            <td><strong>RP${row.numeroOriginal}</strong> — ${escapeHtml(row.requisito.descricao)}</td>
            <td>${escapeHtml(row.unidadeMedida || '—')}</td>
            <td>${escapeHtml(row.valorUnitario || '—')}</td>
            <td class="spec-aspectos-cell">${escapeHtml(aspectos).replace(/\n/g, '<br>')}</td>
        </tr>`;
    });

    return html + '</tbody></table></div>';
}

/** Comparações pareadas do cliente (Diagrama de Mudge) */
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
        const tip = `Comparação RC${i1} vs RC${i2}: ${req1.descricao} × ${req2.descricao} — vencedor com importância ${c.valor}`;

        html += `<tr class="report-has-tip" data-report-tip="${escapeAttr(tip)}">
            <td>RC${i1} vs RC${i2}</td>
            <td>RC${i1}</td>
            <td>${c.valor}</td>
            <td>${escapeHtml(truncateText(req1.descricao, 50))} &gt; ${escapeHtml(truncateText(req2.descricao, 50))}</td>
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
        el.addEventListener('mouseleave', () => {
            tipEl.style.display = 'none';
        });
    });
}

function moveReportTooltip(e, tipEl) {
    const pad = 12;
    let left = e.clientX + pad;
    let top = e.clientY + pad;
    const rect = tipEl.getBoundingClientRect();
    if (left + rect.width > window.innerWidth - 8) left = e.clientX - rect.width - pad;
    if (top + rect.height > window.innerHeight - 8) top = e.clientY - rect.height - pad;
    tipEl.style.left = left + 'px';
    tipEl.style.top = top + 'px';
}

function truncateText(text, limit) {
    if (!text) return '';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    return escapeHtml(text).replace(/"/g, '&quot;');
}

function printReport() {
    window.print();
}

function refreshPreview() {
    generatePreview();
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
