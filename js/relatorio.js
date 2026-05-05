/**
 * ============================================================================
 * RELATÓRIO PDF - GERAÇÃO DE DOCUMENTAÇÃO
 * ============================================================================
 * 
 * Este módulo gerencia a geração e visualização de relatórios em PDF
 * com todas as informações do projeto QFD.
 * 
 * O relatório inclui:
 * - Resumo do projeto
 * - Lista de requisitos de cliente com pesos
 * - Lista de requisitos de projeto
 * - Telhado de correlações
 * - Matriz QFD completa
 * 
 * Funcionalidades:
 * - Configuração de metadados (título, empresa, autor, data)
 * - Seleção de seções a incluir
 * - Preview do relatório
 * - Impressão/exportação para PDF
 */

// ========================================================================
// SEÇÃO 1: VARIÁVEIS GLOBAIS E INICIALIZAÇÃO
// ========================================================================

let requisitosCliente = [];
let requisitosProjeto = [];
let reportConfig = {
    title: 'Análise QFD - Casa da Qualidade',
    company: '',
    author: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
};

/**
 * Inicializa a página quando o DOM está pronto
 */
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
    const ordenados = [...requisitosProjeto].sort((a, b) => (b.importanciaAbsoluta || 0) - (a.importanciaAbsoluta || 0));
    const total = ordenados.length;
    const t1 = Math.ceil(total / 3);
    const t2 = Math.ceil((2 * total) / 3);

    let html = `<div class="report-section">
        <h3>Requisitos de Projeto</h3>
        <div class="tercios-legend">
            <div class="tercio-item tercio-superior"><strong>Terço Superior:</strong> requisitos com maior importância absoluta (prioridade técnica alta).</div>
            <div class="tercio-item tercio-medio"><strong>Terço Médio:</strong> requisitos intermediários (prioridade moderada).</div>
            <div class="tercio-item tercio-inferior"><strong>Terço Inferior:</strong> requisitos de menor impacto relativo (prioridade baixa).</div>
        </div>
        <table class="report-table"><thead><tr><th>ID</th><th>Descrição</th><th>Sentido</th><th>Imp. Abs.</th><th>Terço</th></tr></thead><tbody>`;
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

        html += `<tr class="${tercioClass}">
            <td>RP${requisitosProjeto.findIndex(x => x.id === r.id) + 1}</td>
            <td>${escapeHtml(r.descricao)}</td>
            <td>${escapeHtml(r.sentidoMelhoria || '-')}</td>
            <td>${(r.importanciaAbsoluta || 0).toFixed(2)}</td>
            <td><strong>${tercio}</strong></td>
        </tr>`;
    });
    return html + '</tbody></table></div>';
}

function generateRoof() {
    const correlacoes = qfdDB.getCorrelacoesProjeto();
    let html = '<div class="report-section"><h3>Telhado de Correlações QFD - compara Requisitos de Projeto entre si</h3><table class="roof-table"><thead><tr><th></th>';
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
    let html = '<div class="report-section"><h3>Matriz QFD</h3><div class="qfd-matrix-report-wrapper"><table class="report-table qfd-matrix-report"><thead><tr><th class="qfd-corner-cell">RC \\ RP</th>';
    requisitosProjeto.forEach((_, i) => html += `<th class="qfd-rp-header"><span>RP${i+1}</span></th>`);
    html += '<th>Peso</th></tr></thead><tbody>';
    
    requisitosCliente.forEach((rc, idx) => {
        html += `<tr><td class="qfd-rc-label">RC${idx + 1}</td>`;
        requisitosProjeto.forEach(rp => {
            const val = qfdDB.getMatrizQFD(rc.id, rp.id);
            html += `<td class="qfd-cell">${val || ''}</td>`;
        });
        html += `<td>${(rc.peso * 100).toFixed(1)}%</td></tr>`;
    });
    return html + '</tbody></table></div></div>';
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
