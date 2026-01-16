/**
 * JavaScript para Página de Relatório PDF - Versão Restaurada e Corrigida
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

function generatePreview() {
    const content = document.getElementById('report-content');
    if (!content) return;
    
    let html = `<div class="report-page">
        <div class="report-header">
            <h1>${escapeHtml(reportConfig.title)}</h1>
            ${reportConfig.company ? `<h2>${escapeHtml(reportConfig.company)}</h2>` : ''}
            <p><strong>Data:</strong> ${reportConfig.date} | <strong>Autor:</strong> ${escapeHtml(reportConfig.author)}</p>
        </div>`;
    
    if (document.getElementById('section-summary').checked) html += generateSummary();
    if (document.getElementById('section-client-req').checked) html += generateClientReqs();
    if (document.getElementById('section-project-req').checked) html += generateProjectReqs();
    if (document.getElementById('section-roof').checked) html += generateRoof();
    if (document.getElementById('section-qfd-matrix').checked) html += generateMatrix();
    
    html += '</div>';
    content.innerHTML = html;
}

function generateSummary() {
    return `<div class="report-section"><h3>Resumo</h3><p>${escapeHtml(reportConfig.description || 'Sem descrição.')}</p></div>`;
}

function generateClientReqs() {
    let html = '<div class="report-section"><h3>Requisitos do Cliente</h3><table class="report-table"><thead><tr><th>ID</th><th>Descrição</th><th>Peso</th></tr></thead><tbody>';
    requisitosCliente.forEach((r, i) => {
        html += `<tr><td>RC${i+1}</td><td>${escapeHtml(r.descricao)}</td><td>${(r.peso * 100).toFixed(1)}%</td></tr>`;
    });
    return html + '</tbody></table></div>';
}

function generateProjectReqs() {
    let html = '<div class="report-section"><h3>Requisitos de Projeto</h3><table class="report-table"><thead><tr><th>ID</th><th>Descrição</th><th>Sentido</th></tr></thead><tbody>';
    requisitosProjeto.forEach((r, i) => {
        html += `<tr><td>RP${i+1}</td><td>${escapeHtml(r.descricao)}</td><td>${r.sentidoMelhoria}</td></tr>`;
    });
    return html + '</tbody></table></div>';
}

function generateRoof() {
    const correlacoes = qfdDB.getCorrelacoesProjeto();
    let html = '<div class="report-section"><h3>Telhado de Correlações</h3><table class="roof-table"><thead><tr><th></th>';
    requisitosProjeto.forEach((_, i) => html += `<th>${i+1}</th>`);
    html += '</tr></thead><tbody>';
    
    for (let i = 0; i < requisitosProjeto.length; i++) {
        html += `<tr><th>${i+1}</th>`;
        for (let j = 0; j < requisitosProjeto.length; j++) {
            if (i === j) {
                html += '<td class="diagonal"></td>';
            } else if (j < i) {
                // Triângulo inferior removido conforme solicitado
                html += '<td class="empty"></td>';
            } else {
                const corr = correlacoes.find(c => 
                    (c.requisito1 === requisitosProjeto[i].id && c.requisito2 === requisitosProjeto[j].id) ||
                    (c.requisito1 === requisitosProjeto[j].id && c.requisito2 === requisitosProjeto[i].id)
                );
                html += `<td class="corr-cell">${corr ? corr.correlacao : ''}</td>`;
            }
        }
        html += '</tr>';
    }
    return html + '</tbody></table></div>';
}

function generateMatrix() {
    let html = '<div class="report-section"><h3>Matriz QFD</h3><table class="report-table"><thead><tr><th>RC \\ RP</th>';
    requisitosProjeto.forEach((_, i) => html += `<th>RP${i+1}</th>`);
    html += '<th>Peso</th></tr></thead><tbody>';
    
    requisitosCliente.forEach(rc => {
        html += `<tr><td>${escapeHtml(truncateText(rc.descricao, 30))}</td>`;
        requisitosProjeto.forEach(rp => {
            const val = qfdDB.getMatrizQFD(rc.id, rp.id);
            html += `<td>${val || ''}</td>`;
        });
        html += `<td>${(rc.peso * 100).toFixed(1)}%</td></tr>`;
    });
    return html + '</tbody></table></div>';
}

function truncateText(text, limit) {
    return text.length > limit ? text.substring(0, limit) + '...' : text;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function printReport() {
    window.print();
}
