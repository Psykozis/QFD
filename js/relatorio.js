/**
 * JavaScript para Página de Relatório PDF
 * Implementa geração de relatório completo da análise QFD
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
    updateStatus();
    loadReportHistory();
    
    // Define data atual
    document.getElementById('report-date').value = reportConfig.date;
    
    // Event listeners
    setupEventListeners();
});

function loadData() {
    requisitosCliente = qfdDB.getRequisitosCliente();
    requisitosProjeto = qfdDB.getRequisitosProjeto();
}

function setupReport() {
    const insufficientDiv = document.getElementById('insufficient-data');
    const configSection = document.getElementById('report-config');
    const sectionsSection = document.getElementById('report-sections');
    const previewSection = document.getElementById('report-preview');
    const historySection = document.getElementById('report-history');
    
    const hasMinimumData = requisitosCliente.length > 0 && requisitosProjeto.length > 0;
    
    if (!hasMinimumData) {
        insufficientDiv.style.display = 'block';
        configSection.style.display = 'none';
        sectionsSection.style.display = 'none';
        previewSection.style.display = 'none';
        historySection.style.display = 'none';
        return;
    }
    
    insufficientDiv.style.display = 'none';
    configSection.style.display = 'block';
    sectionsSection.style.display = 'block';
    previewSection.style.display = 'block';
    historySection.style.display = 'block';
    
    updateSectionCount();
    generatePreview();
}

function setupEventListeners() {
    // Config form
    document.getElementById('project-title').addEventListener('input', updateConfig);
    document.getElementById('company-name').addEventListener('input', updateConfig);
    document.getElementById('author-name').addEventListener('input', updateConfig);
    document.getElementById('report-date').addEventListener('change', updateConfig);
    document.getElementById('project-description').addEventListener('input', updateConfig);
    
    // Section checkboxes
    const checkboxes = document.querySelectorAll('.section-checkbox input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateSectionCount();
            generatePreview();
        });
    });
}

function updateConfig() {
    reportConfig.title = document.getElementById('project-title').value || 'Análise QFD - Casa da Qualidade';
    reportConfig.company = document.getElementById('company-name').value;
    reportConfig.author = document.getElementById('author-name').value;
    reportConfig.date = document.getElementById('report-date').value;
    reportConfig.description = document.getElementById('project-description').value;
    
    generatePreview();
}

function updateStatus() {
    const totalClienteElement = document.getElementById('total-req-cliente');
    const totalProjetoElement = document.getElementById('total-req-projeto');
    const completudeElement = document.getElementById('completude-sistema');
    const statusElement = document.getElementById('status-relatorio');
    
    if (totalClienteElement) {
        totalClienteElement.textContent = requisitosCliente.length;
    }
    
    if (totalProjetoElement) {
        totalProjetoElement.textContent = requisitosProjeto.length;
    }
    
    // Calcula completude do sistema
    const totalPossibleRelations = requisitosCliente.length * requisitosProjeto.length;
    const actualRelations = qfdDB.getMatrizQFDCompleta().length;
    const completude = totalPossibleRelations > 0 ? Math.round((actualRelations / totalPossibleRelations) * 100) : 0;
    
    if (completudeElement) {
        completudeElement.textContent = `${completude}%`;
    }
    
    // Status do relatório
    const hasMinimumData = requisitosCliente.length > 0 && requisitosProjeto.length > 0;
    const status = hasMinimumData ? (completude >= 25 ? 'Pronto' : 'Parcial') : 'Pendente';
    
    if (statusElement) {
        statusElement.textContent = status;
        statusElement.className = status === 'Pronto' ? 'status-ready' : status === 'Parcial' ? 'status-partial' : 'status-pending';
    }
}

function updateSectionCount() {
    const checkboxes = document.querySelectorAll('.section-checkbox input[type="checkbox"]:checked');
    const countElement = document.getElementById('section-count');
    
    if (countElement) {
        countElement.textContent = `${checkboxes.length} seções selecionadas`;
    }
}

function generatePreview() {
    const previewContent = document.getElementById('report-content');
    if (!previewContent) return;
    
    const selectedSections = getSelectedSections();
    let previewHTML = '';
    
    // Cabeçalho do relatório
    previewHTML += generateReportHeader();
    
    // Seções selecionadas
    selectedSections.forEach(section => {
        switch (section) {
            case 'section-dictionary':
                previewHTML += generateDictionary();
                break;
            case 'section-summary':
                previewHTML += generateSummarySection();
                break;
            case 'section-client-req':
                previewHTML += generateClientRequirementsSection();
                break;
            case 'section-project-req':
                previewHTML += generateProjectRequirementsSection();
                break;
            case 'section-roof':
                previewHTML += generateRoofVisualization();
                break;
            case 'section-correlations':
                previewHTML += generateCorrelationsSection();
                break;
            case 'section-qfd-matrix':
                previewHTML += generateQFDMatrixSection();
                break;
            case 'section-ranking':
                previewHTML += generateRankingSection();
                break;
            case 'section-analysis':
                previewHTML += generateAnalysisSection();
                break;
            case 'section-appendix':
                previewHTML += generateAppendixSection();
                break;
        }
    });
    
    // Rodapé
    previewHTML += generateReportFooter();
    
    previewContent.innerHTML = previewHTML;
}

function getSelectedSections() {
    const checkboxes = document.querySelectorAll('.section-checkbox input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.id);
}

function generateReportHeader() {
    const currentDate = new Date(reportConfig.date).toLocaleDateString('pt-BR');
    
    return `
        <div class="report-header">
            <div class="report-title-page">
                <div class="title-content">
                    <h1 class="main-title">${escapeHtml(reportConfig.title)}</h1>
                    <div class="subtitle">Relatório de Análise QFD - Casa da Qualidade</div>
                    
                    ${reportConfig.company ? `<div class="company-name">${escapeHtml(reportConfig.company)}</div>` : ''}
                    
                    <div class="report-meta">
                        ${reportConfig.author ? `<div class="meta-item"><strong>Responsável:</strong> ${escapeHtml(reportConfig.author)}</div>` : ''}
                        <div class="meta-item"><strong>Data:</strong> ${currentDate}</div>
                        <div class="meta-item"><strong>Sistema:</strong> QFD Analysis Tool v1.0</div>
                    </div>
                    
                    ${reportConfig.description ? `
                        <div class="project-description">
                            <h3>Descrição do Projeto</h3>
                            <p>${escapeHtml(reportConfig.description)}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function generateSummarySection() {
    const totalRelations = qfdDB.getMatrizQFDCompleta().length;
    const totalPossible = requisitosCliente.length * requisitosProjeto.length;
    const coverage = totalPossible > 0 ? ((totalRelations / totalPossible) * 100).toFixed(1) : 0;
    
    // Top 3 requisitos mais importantes
    const sortedRequisitos = [...requisitosProjeto].sort((a, b) => b.importanciaAbsoluta - a.importanciaAbsoluta);
    const top3 = sortedRequisitos.slice(0, 3);
    
    return `
        <div class="report-section">
            <h2 class="section-title">1. Resumo Executivo</h2>
            
            <div class="summary-overview">
                <h3>Visão Geral da Análise</h3>
                <p>Esta análise QFD (Quality Function Deployment) foi conduzida para identificar e priorizar os requisitos técnicos mais importantes para o desenvolvimento do produto, baseando-se nas necessidades e expectativas dos clientes.</p>
                
                <div class="summary-metrics">
                    <div class="metric-row">
                        <div class="metric-item">
                            <span class="metric-label">Requisitos de Cliente:</span>
                            <span class="metric-value">${requisitosCliente.length}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Requisitos de Projeto:</span>
                            <span class="metric-value">${requisitosProjeto.length}</span>
                        </div>
                        <div class="metric-item">
                            <span class="metric-label">Cobertura da Matriz:</span>
                            <span class="metric-value">${coverage}%</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="key-findings">
                <h3>Principais Descobertas</h3>
                <div class="findings-list">
                    <div class="finding-item">
                        <h4>Requisitos Prioritários</h4>
                        <p>Os três requisitos técnicos mais importantes identificados são:</p>
                        <ol>
                            ${top3.map((req, index) => `<li><strong>${req.descricao}</strong> (Peso: ${(req.pesoRelativo * 100).toFixed(1)}%)</li>`).join('')}
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateClientRequirementsSection() {
    return `
        <div class="report-section">
            <h2 class="section-title">2. Requisitos do Cliente</h2>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Descrição</th>
                        <th>Importância</th>
                        <th>Peso (%)</th>
                    </tr>
                </thead>
                <tbody>
                    ${requisitosCliente.map((req, index) => `
                        <tr>
                            <td>RC${index + 1}</td>
                            <td>${escapeHtml(req.descricao)}</td>
                            <td>${req.importancia.toFixed(1)}</td>
                            <td>${(req.peso * 100).toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function generateProjectRequirementsSection() {
    return `
        <div class="report-section">
            <h2 class="section-title">3. Requisitos de Projeto</h2>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Descrição</th>
                        <th>Sentido</th>
                        <th>Dificuldade</th>
                    </tr>
                </thead>
                <tbody>
                    ${requisitosProjeto.map((req, index) => `
                        <tr>
                            <td>RP${index + 1}</td>
                            <td>${escapeHtml(req.descricao)}</td>
                            <td>${getSentidoLabel(req.sentidoMelhoria)}</td>
                            <td>${req.dificuldadeTecnica}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function generateRoofVisualization() {
    const correlacoes = qfdDB.getCorrelacoesProjeto();
    
    let html = '<div class="report-section"><h2>4. Visualização do Telhado QFD</h2>';
    html += '<p>Matriz do telhado QFD mostrando as correlações entre os requisitos de projeto. O triângulo inferior foi removido para evitar redundância.</p>';
    
    html += '<div class="roof-visualization-container">';
    html += '<table class="roof-visualization-table">';
    
    // Cabeçalho com números dos requisitos
    html += '<thead><tr><th class="roof-corner"></th>';
    for (let i = 0; i < requisitosProjeto.length; i++) {
        html += `<th class="roof-header-cell">${i + 1}</th>`;
    }
    html += '</tr></thead>';
    
    // Corpo da tabela
    html += '<tbody>';
    for (let i = 0; i < requisitosProjeto.length; i++) {
        html += '<tr>';
        html += `<th class="roof-row-header">${i + 1}</th>`;
        
        for (let j = 0; j < requisitosProjeto.length; j++) {
            if (i === j) {
                html += '<td class="roof-diagonal-cell"></td>';
            } else if (j < i) {
                // Triângulo inferior removido
                html += '<td class="roof-empty-cell"></td>';
            } else {
                const corr = correlacoes.find(c => 
                    (c.requisito1 === requisitosProjeto[i].id && c.requisito2 === requisitosProjeto[j].id) ||
                    (c.requisito1 === requisitosProjeto[j].id && c.requisito2 === requisitosProjeto[i].id)
                );
                
                let cellClass = 'roof-cell-upper';
                let cellValue = '';
                
                if (corr) {
                    cellValue = corr.correlacao;
                    if (corr.correlacao === '++') cellClass += ' strong-positive';
                    else if (corr.correlacao === '+') cellClass += ' positive';
                    else if (corr.correlacao === '-') cellClass += ' negative';
                    else if (corr.correlacao === '--') cellClass += ' strong-negative';
                }
                
                html += `<td class="${cellClass}">${cellValue}</td>`;
            }
        }
        html += '</tr>';
    }
    html += '</tbody></table></div></div>';
    return html;
}

function generateCorrelationsSection() {
    const correlacoes = qfdDB.getCorrelacoesProjeto();
    return `
        <div class="report-section">
            <h2 class="section-title">5. Correlações de Projeto</h2>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Requisito 1</th>
                        <th>Requisito 2</th>
                        <th>Correlação</th>
                    </tr>
                </thead>
                <tbody>
                    ${correlacoes.map(corr => {
                        const r1 = requisitosProjeto.find(r => r.id === corr.requisito1);
                        const r2 = requisitosProjeto.find(r => r.id === corr.requisito2);
                        return `
                            <tr>
                                <td>${r1 ? r1.descricao : 'N/A'}</td>
                                <td>${r2 ? r2.descricao : 'N/A'}</td>
                                <td>${corr.correlacao}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function generateQFDMatrixSection() {
    return `
        <div class="report-section">
            <h2 class="section-title">6. Matriz QFD (Casa da Qualidade)</h2>
            <div class="matrix-scroll">
                <table class="report-table matrix-table">
                    <thead>
                        <tr>
                            <th>RC \ RP</th>
                            ${requisitosProjeto.map((rp, i) => `<th>RP${i+1}</th>`).join('')}
                            <th>Peso</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${requisitosCliente.map((rc, i) => `
                            <tr>
                                <td>RC${i+1}</td>
                                ${requisitosProjeto.map(rp => {
                                    const infl = qfdDB.getMatrizQFD(rc.id, rp.id);
                                    return `<td>${infl > 0 ? infl : ''}</td>`;
                                }).join('')}
                                <td>${(rc.peso * 100).toFixed(1)}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <th>Imp. Absoluta</th>
                            ${requisitosProjeto.map(rp => `<td>${rp.importanciaAbsoluta.toFixed(1)}</td>`).join('')}
                            <td>-</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    `;
}

function generateRankingSection() {
    const sorted = [...requisitosProjeto].sort((a, b) => b.importanciaAbsoluta - a.importanciaAbsoluta);
    return `
        <div class="report-section">
            <h2 class="section-title">7. Ranking de Prioridades</h2>
            <table class="report-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Requisito de Projeto</th>
                        <th>Imp. Absoluta</th>
                        <th>Peso Relativo (%)</th>
                    </tr>
                </thead>
                <tbody>
                    ${sorted.map((req, index) => `
                        <tr>
                            <td>${index + 1}º</td>
                            <td>${escapeHtml(req.descricao)}</td>
                            <td>${req.importanciaAbsoluta.toFixed(1)}</td>
                            <td>${(req.pesoRelativo * 100).toFixed(1)}%</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function generateAnalysisSection() {
    return `
        <div class="report-section">
            <h2 class="section-title">8. Análise e Recomendações</h2>
            <div class="analysis-box">
                <p>Com base nos resultados obtidos, recomenda-se priorizar os requisitos técnicos com maior peso relativo, pois estes têm maior impacto direto na satisfação das necessidades expressas pelos clientes.</p>
            </div>
        </div>
    `;
}

function generateAppendixSection() {
    return `
        <div class="report-section">
            <h2 class="section-title">9. Apêndice</h2>
            <p>Este relatório foi gerado automaticamente pelo Sistema QFD Analysis Tool.</p>
        </div>
    `;
}

function generateReportFooter() {
    return `
        <div class="report-footer">
            <p>Página 1 de 1 - Gerado em ${new Date().toLocaleString('pt-BR')}</p>
        </div>
    `;
}

function generateDictionary() {
    return `
        <div class="report-section">
            <h2 class="section-title">Dicionário de Símbolos</h2>
            <ul>
                <li><strong>9:</strong> Influência Forte</li>
                <li><strong>3:</strong> Influência Moderada</li>
                <li><strong>1:</strong> Influência Fraca</li>
                <li><strong>++:</strong> Correlação Forte Positiva</li>
                <li><strong>+:</strong> Correlação Positiva</li>
                <li><strong>-:</strong> Correlação Negativa</li>
                <li><strong>--:</strong> Correlação Forte Negativa</li>
            </ul>
        </div>
    `;
}

function getSentidoLabel(sentido) {
    const labels = { 'up': 'Crescente', 'down': 'Decrescente', 'none': 'Nominal' };
    return labels[sentido] || 'Indefinido';
}

function getSentidoSymbol(sentido) {
    const symbols = { 'up': '↑', 'down': '↓', 'none': '○' };
    return symbols[sentido] || '○';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function loadReportHistory() {
    // Implementação simplificada para o preview
}

function setupReportHistory() {
    // Implementação simplificada
}
