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
            case 'section-summary':
                previewHTML += generateSummarySection();
                break;
            case 'section-client-req':
                previewHTML += generateClientRequirementsSection();
                break;
            case 'section-project-req':
                previewHTML += generateProjectRequirementsSection();
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
                            ${top3.map((req, index) => {
                                const originalIndex = requisitosProjeto.indexOf(req) + 1;
                                return `<li><strong>Req ${originalIndex}:</strong> ${escapeHtml(req.descricao)} (Importância: ${req.importanciaAbsoluta.toFixed(1)})</li>`;
                            }).join('')}
                        </ol>
                    </div>
                    
                    <div class="finding-item">
                        <h4>Distribuição de Importância</h4>
                        <p>A análise revelou uma distribuição ${getImportanceDistributionDescription()} dos requisitos técnicos, indicando ${getDistributionImplication()}.</p>
                    </div>
                    
                    <div class="finding-item">
                        <h4>Recomendações Principais</h4>
                        <ul>
                            <li>Priorizar o desenvolvimento dos requisitos com maior importância absoluta</li>
                            <li>Considerar as correlações identificadas no telhado da casa QFD</li>
                            <li>Balancear importância técnica com dificuldade de implementação</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generateClientRequirementsSection() {
    let sectionHTML = `
        <div class="report-section">
            <h2 class="section-title">2. Requisitos de Cliente</h2>
            
            <p>Os requisitos de cliente representam as necessidades e expectativas identificadas através de pesquisa de mercado, feedback de usuários e análise competitiva. Cada requisito foi avaliado e ponderado conforme sua importância relativa.</p>
            
            <div class="requirements-table">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Descrição do Requisito</th>
                            <th>Importância</th>
                            <th>Peso (%)</th>
                            <th>Ranking</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // Ordena requisitos por importância
    const sortedCliente = [...requisitosCliente].sort((a, b) => b.importancia - a.importancia);
    
    sortedCliente.forEach((req, index) => {
        const originalIndex = requisitosCliente.indexOf(req) + 1;
        sectionHTML += `
            <tr>
                <td class="id-cell">RC${originalIndex}</td>
                <td class="description-cell">${escapeHtml(req.descricao)}</td>
                <td class="importance-cell">${req.importancia.toFixed(1)}</td>
                <td class="weight-cell">${(req.peso * 100).toFixed(1)}%</td>
                <td class="ranking-cell">${index + 1}º</td>
            </tr>
        `;
    });
    
    sectionHTML += `
                    </tbody>
                </table>
            </div>
            
            <div class="section-insights">
                <h3>Insights dos Requisitos de Cliente</h3>
                <ul>
                    <li><strong>Requisito mais importante:</strong> ${escapeHtml(sortedCliente[0]?.descricao || 'N/A')} (${sortedCliente[0]?.importancia.toFixed(1) || 0})</li>
                    <li><strong>Distribuição:</strong> ${getClientRequirementsDistribution()}</li>
                    <li><strong>Concentração:</strong> Os top 3 requisitos representam ${getTop3ClientConcentration()}% da importância total</li>
                </ul>
            </div>
        </div>
    `;
    
    return sectionHTML;
}

function generateProjectRequirementsSection() {
    let sectionHTML = `
        <div class="report-section">
            <h2 class="section-title">3. Requisitos de Projeto</h2>
            
            <p>Os requisitos de projeto são as especificações técnicas e características mensuráveis que o produto deve atender. Cada requisito inclui seu sentido de melhoria e nível de dificuldade técnica para implementação.</p>
            
            <div class="requirements-table">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Descrição do Requisito</th>
                            <th>Sentido</th>
                            <th>Dificuldade</th>
                            <th>Imp. Absoluta</th>
                            <th>Peso (%)</th>
                            <th>Ranking</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // Ordena requisitos por importância absoluta
    const sortedProjeto = [...requisitosProjeto].sort((a, b) => b.importanciaAbsoluta - a.importanciaAbsoluta);
    
    sortedProjeto.forEach((req, index) => {
        const originalIndex = requisitosProjeto.indexOf(req) + 1;
        sectionHTML += `
            <tr>
                <td class="id-cell">RP${originalIndex}</td>
                <td class="description-cell">${escapeHtml(req.descricao)}</td>
                <td class="direction-cell">
                    <span class="direction-badge ${req.sentidoMelhoria}">
                        ${getSentidoSymbol(req.sentidoMelhoria)} ${getSentidoLabel(req.sentidoMelhoria)}
                    </span>
                </td>
                <td class="difficulty-cell">
                    <span class="difficulty-badge level-${req.dificuldadeTecnica}">${req.dificuldadeTecnica}</span>
                </td>
                <td class="importance-cell">${req.importanciaAbsoluta.toFixed(1)}</td>
                <td class="weight-cell">${(req.pesoRelativo * 100).toFixed(1)}%</td>
                <td class="ranking-cell">${index + 1}º</td>
            </tr>
        `;
    });
    
    sectionHTML += `
                    </tbody>
                </table>
            </div>
            
            <div class="section-insights">
                <h3>Insights dos Requisitos de Projeto</h3>
                <ul>
                    <li><strong>Requisito prioritário:</strong> ${escapeHtml(sortedProjeto[0]?.descricao || 'N/A')} (Imp: ${sortedProjeto[0]?.importanciaAbsoluta.toFixed(1) || 0})</li>
                    <li><strong>Dificuldade média:</strong> ${getAverageDifficulty().toFixed(1)} (escala 1-5)</li>
                    <li><strong>Distribuição de sentidos:</strong> ${getDirectionDistribution()}</li>
                </ul>
            </div>
        </div>
    `;
    
    return sectionHTML;
}

function generateCorrelationsSection() {
    const correlacoes = qfdDB.getCorrelacoesProjeto();
    const conflicts = correlacoes.filter(corr => corr.correlacao === '-' || corr.correlacao === '--');
    const synergies = correlacoes.filter(corr => corr.correlacao === '+' || corr.correlacao === '++');
    
    let sectionHTML = `
        <div class="report-section">
            <h2 class="section-title">4. Análise de Correlações (Telhado)</h2>
            
            <p>O telhado da casa QFD analisa as correlações entre os requisitos de projeto, identificando sinergias (correlações positivas) e conflitos (correlações negativas) que devem ser considerados no desenvolvimento.</p>
            
            <div class="correlation-summary">
                <h3>Resumo das Correlações</h3>
                <div class="correlation-stats">
                    <div class="stat-item positive">
                        <span class="stat-label">Sinergias Identificadas:</span>
                        <span class="stat-value">${synergies.length}</span>
                    </div>
                    <div class="stat-item negative">
                        <span class="stat-label">Conflitos Identificados:</span>
                        <span class="stat-value">${conflicts.length}</span>
                    </div>
                </div>
            </div>
    `;
    
    if (conflicts.length > 0) {
        sectionHTML += `
            <div class="conflicts-analysis">
                <h3>Conflitos Críticos</h3>
                <p>Os seguintes conflitos foram identificados e requerem atenção especial no desenvolvimento:</p>
                <div class="conflicts-list">
        `;
        
        conflicts.forEach(conflict => {
            const req1 = requisitosProjeto.find(r => r.id === conflict.requisito1);
            const req2 = requisitosProjeto.find(r => r.id === conflict.requisito2);
            
            if (req1 && req2) {
                const req1Index = requisitosProjeto.indexOf(req1) + 1;
                const req2Index = requisitosProjeto.indexOf(req2) + 1;
                
                sectionHTML += `
                    <div class="conflict-item">
                        <div class="conflict-header">
                            <span class="correlation-symbol ${conflict.correlacao === '--' ? 'strong-negative' : 'negative'}">
                                ${conflict.correlacao}
                            </span>
                            <span class="conflict-title">RP${req1Index} vs RP${req2Index}</span>
                        </div>
                        <div class="conflict-description">
                            <p><strong>RP${req1Index}:</strong> ${escapeHtml(req1.descricao)}</p>
                            <p><strong>RP${req2Index}:</strong> ${escapeHtml(req2.descricao)}</p>
                        </div>
                    </div>
                `;
            }
        });
        
        sectionHTML += '</div></div>';
    }
    
    if (synergies.length > 0) {
        sectionHTML += `
            <div class="synergies-analysis">
                <h3>Sinergias Identificadas</h3>
                <p>As seguintes sinergias podem ser aproveitadas para otimizar o desenvolvimento:</p>
                <div class="synergies-list">
        `;
        
        synergies.forEach(synergy => {
            const req1 = requisitosProjeto.find(r => r.id === synergy.requisito1);
            const req2 = requisitosProjeto.find(r => r.id === synergy.requisito2);
            
            if (req1 && req2) {
                const req1Index = requisitosProjeto.indexOf(req1) + 1;
                const req2Index = requisitosProjeto.indexOf(req2) + 1;
                
                sectionHTML += `
                    <div class="synergy-item">
                        <div class="synergy-header">
                            <span class="correlation-symbol ${synergy.correlacao === '++' ? 'strong-positive' : 'positive'}">
                                ${synergy.correlacao}
                            </span>
                            <span class="synergy-title">RP${req1Index} + RP${req2Index}</span>
                        </div>
                        <div class="synergy-description">
                            <p><strong>RP${req1Index}:</strong> ${escapeHtml(req1.descricao)}</p>
                            <p><strong>RP${req2Index}:</strong> ${escapeHtml(req2.descricao)}</p>
                        </div>
                    </div>
                `;
            }
        });
        
        sectionHTML += '</div></div>';
    }
    
    sectionHTML += '</div>';
    return sectionHTML;
}

function generateQFDMatrixSection() {
    return `
        <div class="report-section">
            <h2 class="section-title">5. Matriz QFD - Casa da Qualidade</h2>
            
            <p>A matriz QFD relaciona os requisitos de cliente com os requisitos de projeto, mostrando o nível de influência de cada requisito técnico no atendimento das necessidades dos clientes.</p>
            
            <div class="matrix-note">
                <p><strong>Legenda de Influência:</strong></p>
                <ul>
                    <li><strong>5:</strong> Influência forte - Grande impacto no atendimento</li>
                    <li><strong>3:</strong> Influência moderada - Impacto moderado no atendimento</li>
                    <li><strong>1:</strong> Influência fraca - Pouco impacto no atendimento</li>
                    <li><strong>Vazio:</strong> Sem influência significativa</li>
                </ul>
            </div>
            
            <div class="matrix-container">
                ${generateMatrixTable()}
            </div>
            
            <div class="matrix-insights">
                <h3>Insights da Matriz QFD</h3>
                <ul>
                    <li><strong>Cobertura:</strong> ${getMatrixCoverage()}% das relações foram definidas</li>
                    <li><strong>Requisito mais influente:</strong> ${getMostInfluentialRequirement()}</li>
                    <li><strong>Cliente mais atendido:</strong> ${getBestServedClient()}</li>
                </ul>
            </div>
        </div>
    `;
}

function generateMatrixTable() {
    let tableHTML = `
        <table class="qfd-matrix-table">
            <thead>
                <tr>
                    <th class="corner-cell">Requisitos</th>
    `;
    
    // Cabeçalho com requisitos de projeto
    requisitosProjeto.forEach((req, index) => {
        tableHTML += `<th class="project-header" title="${escapeHtml(req.descricao)}">RP${index + 1}</th>`;
    });
    
    tableHTML += '<th class="importance-header">Imp. Cliente</th></tr></thead><tbody>';
    
    // Linhas com requisitos de cliente
    requisitosCliente.forEach((reqCliente, i) => {
        tableHTML += `<tr><td class="client-header" title="${escapeHtml(reqCliente.descricao)}">RC${i + 1}</td>`;
        
        requisitosProjeto.forEach(reqProjeto => {
            const influencia = qfdDB.getMatrizQFD(reqCliente.id, reqProjeto.id);
            tableHTML += `<td class="matrix-cell ${influencia > 0 ? 'filled' : ''}">
                ${influencia > 0 ? `<span class="influence-value level-${influencia}">${influencia}</span>` : ''}
            </td>`;
        });
        
        tableHTML += `<td class="importance-cell">${reqCliente.importancia.toFixed(1)}</td></tr>`;
    });
    
    // Rodapé com cálculos
    // Calcular importância relativa
    const totalImportancia = requisitosProjeto.reduce((sum, req) => sum + (req.importanciaAbsoluta || 0), 0);
    
    tableHTML += `
        <tr class="footer-row">
            <td class="footer-label">Imp. Relativa (%)</td>
    `;
    
    requisitosProjeto.forEach(req => {
        const importanciaRelativa = totalImportancia > 0 ? ((req.importanciaAbsoluta || 0) / totalImportancia * 100).toFixed(1) : 0;
        tableHTML += `<td class="relative-importance">${importanciaRelativa}%</td>`;
    });
    
    tableHTML += '<td></td></tr>';
    
    tableHTML += `
        <tr class="footer-row">
            <td class="footer-label">Ranking</td>
    `;
    
    requisitosProjeto.forEach(req => {
        tableHTML += `<td class="ranking-cell">${req.importanciaRelativa}º</td>`;
    });
    
    tableHTML += '<td></td></tr></tbody></table>';
    
    return tableHTML;
}

function generateRankingSection() {
    const sortedRequisitos = [...requisitosProjeto].sort((a, b) => b.importanciaAbsoluta - a.importanciaAbsoluta);
    
    let sectionHTML = `
        <div class="report-section">
            <h2 class="section-title">6. Ranking de Prioridades</h2>
            
            <p>Com base na análise QFD, os requisitos de projeto foram priorizados conforme sua importância absoluta, calculada através da soma ponderada das influências nos requisitos de cliente.</p>
            
            <div class="ranking-table">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Posição</th>
                            <th>ID</th>
                            <th>Descrição</th>
                            <th>Imp. Absoluta</th>
                            <th>Peso (%)</th>
                            <th>Dificuldade</th>
                            <th>Prioridade</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    sortedRequisitos.forEach((req, index) => {
        const originalIndex = requisitosProjeto.indexOf(req) + 1;
        const priority = calculatePriority(req.importanciaAbsoluta, req.dificuldadeTecnica);
        
        sectionHTML += `
            <tr class="${index < 3 ? 'top-priority' : ''}">
                <td class="position-cell">
                    ${index + 1}º
                    ${index === 0 ? '<i class="fas fa-crown"></i>' : ''}
                </td>
                <td class="id-cell">RP${originalIndex}</td>
                <td class="description-cell">${escapeHtml(req.descricao)}</td>
                <td class="importance-cell">${req.importanciaAbsoluta.toFixed(1)}</td>
                <td class="weight-cell">${(req.pesoRelativo * 100).toFixed(1)}%</td>
                <td class="difficulty-cell">
                    <span class="difficulty-badge level-${req.dificuldadeTecnica}">${req.dificuldadeTecnica}</span>
                </td>
                <td class="priority-cell">
                    <span class="priority-badge ${priority.class}">${priority.label}</span>
                </td>
            </tr>
        `;
    });
    
    sectionHTML += `
                    </tbody>
                </table>
            </div>
            
            <div class="priority-recommendations">
                <h3>Recomendações de Priorização</h3>
                <div class="recommendations-list">
                    <div class="recommendation-item high">
                        <h4>Alta Prioridade (Top 3)</h4>
                        <p>Focar recursos e esforços nos requisitos mais importantes. Estes têm maior impacto na satisfação do cliente.</p>
                        <ul>
                            ${sortedRequisitos.slice(0, 3).map((req, index) => {
                                const originalIndex = requisitosProjeto.indexOf(req) + 1;
                                return `<li>RP${originalIndex}: ${escapeHtml(req.descricao)}</li>`;
                            }).join('')}
                        </ul>
                    </div>
                    
                    <div class="recommendation-item medium">
                        <h4>Prioridade Média</h4>
                        <p>Requisitos importantes que devem ser considerados na segunda fase de desenvolvimento.</p>
                    </div>
                    
                    <div class="recommendation-item low">
                        <h4>Baixa Prioridade</h4>
                        <p>Requisitos que podem ser implementados posteriormente ou considerados para versões futuras.</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    return sectionHTML;
}

function generateAnalysisSection() {
    return `
        <div class="report-section">
            <h2 class="section-title">7. Análises e Insights</h2>
            
            <div class="analysis-content">
                <div class="analysis-item">
                    <h3>Distribuição de Importância</h3>
                    <p>${getImportanceAnalysis()}</p>
                </div>
                
                <div class="analysis-item">
                    <h3>Balanceamento Importância vs Dificuldade</h3>
                    <p>${getDifficultyAnalysis()}</p>
                </div>
                
                <div class="analysis-item">
                    <h3>Cobertura da Matriz</h3>
                    <p>${getCoverageAnalysis()}</p>
                </div>
                
                <div class="analysis-item">
                    <h3>Recomendações Estratégicas</h3>
                    <ul>
                        <li>Priorizar requisitos com alta importância e baixa dificuldade técnica</li>
                        <li>Considerar parcerias ou terceirização para requisitos de alta dificuldade</li>
                        <li>Aproveitar sinergias identificadas no telhado da casa QFD</li>
                        <li>Monitorar e mitigar conflitos entre requisitos</li>
                        <li>Revisar periodicamente as prioridades conforme feedback do mercado</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

function generateAppendixSection() {
    return `
        <div class="report-section">
            <h2 class="section-title">8. Anexos Técnicos</h2>
            
            <div class="appendix-content">
                <div class="methodology">
                    <h3>Metodologia QFD</h3>
                    <p>A metodologia Quality Function Deployment (QFD) foi desenvolvida no Japão na década de 1960 e é amplamente utilizada para traduzir requisitos de cliente em especificações técnicas de produto.</p>
                    
                    <h4>Processo de Análise</h4>
                    <ol>
                        <li><strong>Identificação dos Requisitos de Cliente:</strong> Levantamento através de pesquisas, entrevistas e análise de mercado</li>
                        <li><strong>Ponderação dos Requisitos:</strong> Atribuição de importância relativa baseada em critérios objetivos</li>
                        <li><strong>Definição dos Requisitos Técnicos:</strong> Tradução das necessidades em especificações mensuráveis</li>
                        <li><strong>Análise de Correlações:</strong> Identificação de sinergias e conflitos entre requisitos técnicos</li>
                        <li><strong>Construção da Matriz:</strong> Relacionamento entre requisitos de cliente e técnicos</li>
                        <li><strong>Cálculo de Prioridades:</strong> Determinação da importância absoluta e relativa</li>
                    </ol>
                </div>
                
                <div class="calculations">
                    <h3>Fórmulas de Cálculo</h3>
                    <div class="formula-item">
                        <h4>Importância Absoluta</h4>
                        <p><code>IA(j) = Σ(IC(i) × R(i,j))</code></p>
                        <p>Onde: IA = Importância Absoluta, IC = Importância do Cliente, R = Relação na matriz</p>
                    </div>
                    
                    <div class="formula-item">
                        <h4>Peso Relativo</h4>
                        <p><code>PR(j) = IA(j) / Σ(IA)</code></p>
                        <p>Onde: PR = Peso Relativo, IA = Importância Absoluta</p>
                    </div>
                </div>
                
                <div class="data-summary">
                    <h3>Resumo dos Dados</h3>
                    <ul>
                        <li>Total de Requisitos de Cliente: ${requisitosCliente.length}</li>
                        <li>Total de Requisitos de Projeto: ${requisitosProjeto.length}</li>
                        <li>Relações Definidas: ${qfdDB.getMatrizQFDCompleta().length}</li>
                        <li>Correlações Analisadas: ${qfdDB.getCorrelacoesProjeto().length}</li>
                        <li>Data da Análise: ${new Date(reportConfig.date).toLocaleDateString('pt-BR')}</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
}

function generateReportFooter() {
    return `
        <div class="report-footer">
            <div class="footer-content">
                <p><strong>Relatório gerado pelo Sistema QFD v1.0</strong></p>
                <p>Data de geração: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
                <p>Este relatório foi gerado automaticamente com base nos dados inseridos no sistema.</p>
            </div>
        </div>
    `;
}

// Funções auxiliares para análises
function getImportanceDistributionDescription() {
    const importancias = requisitosProjeto.map(req => req.importanciaAbsoluta);
    const max = Math.max(...importancias);
    const min = Math.min(...importancias);
    const ratio = max / min;
    
    if (ratio > 5) return 'concentrada';
    if (ratio > 2) return 'moderada';
    return 'equilibrada';
}

function getDistributionImplication() {
    const description = getImportanceDistributionDescription();
    const implications = {
        'concentrada': 'foco claro em poucos requisitos críticos',
        'moderada': 'necessidade de priorização balanceada',
        'equilibrada': 'importância similar entre todos os requisitos'
    };
    return implications[description];
}

function getClientRequirementsDistribution() {
    const importancias = requisitosCliente.map(req => req.importancia);
    const media = importancias.reduce((sum, imp) => sum + imp, 0) / importancias.length;
    const max = Math.max(...importancias);
    const min = Math.min(...importancias);
    
    return `Média: ${media.toFixed(1)}, Variação: ${min.toFixed(1)} - ${max.toFixed(1)}`;
}

function getTop3ClientConcentration() {
    const sorted = [...requisitosCliente].sort((a, b) => b.importancia - a.importancia);
    const top3Sum = sorted.slice(0, 3).reduce((sum, req) => sum + req.importancia, 0);
    const totalSum = requisitosCliente.reduce((sum, req) => sum + req.importancia, 0);
    
    return totalSum > 0 ? ((top3Sum / totalSum) * 100).toFixed(1) : 0;
}

function getAverageDifficulty() {
    const difficulties = requisitosProjeto.map(req => req.dificuldadeTecnica);
    return difficulties.reduce((sum, diff) => sum + diff, 0) / difficulties.length;
}

function getDirectionDistribution() {
    const directions = { up: 0, down: 0, none: 0 };
    requisitosProjeto.forEach(req => {
        directions[req.sentidoMelhoria]++;
    });
    
    return `Crescente: ${directions.up}, Decrescente: ${directions.down}, Nominal: ${directions.none}`;
}

function getMatrixCoverage() {
    const totalPossible = requisitosCliente.length * requisitosProjeto.length;
    const actualRelations = qfdDB.getMatrizQFDCompleta().length;
    return totalPossible > 0 ? ((actualRelations / totalPossible) * 100).toFixed(1) : 0;
}

function getMostInfluentialRequirement() {
    if (requisitosProjeto.length === 0) return 'N/A';
    
    const sorted = [...requisitosProjeto].sort((a, b) => b.importanciaAbsoluta - a.importanciaAbsoluta);
    const top = sorted[0];
    const index = requisitosProjeto.indexOf(top) + 1;
    
    return `RP${index} (${escapeHtml(top.descricao)})`;
}

function getBestServedClient() {
    if (requisitosCliente.length === 0) return 'N/A';
    
    // Calcula quantas relações cada cliente tem
    const clientRelations = {};
    qfdDB.getMatrizQFDCompleta().forEach(rel => {
        clientRelations[rel.requisitoCliente] = (clientRelations[rel.requisitoCliente] || 0) + 1;
    });
    
    let bestClient = null;
    let maxRelations = 0;
    
    Object.entries(clientRelations).forEach(([clientId, count]) => {
        if (count > maxRelations) {
            maxRelations = count;
            bestClient = clientId;
        }
    });
    
    if (bestClient) {
        const client = requisitosCliente.find(req => req.id === bestClient);
        const index = requisitosCliente.indexOf(client) + 1;
        return `RC${index} (${maxRelations} relações)`;
    }
    
    return 'N/A';
}

function calculatePriority(importance, difficulty) {
    const ratio = importance / difficulty;
    
    if (ratio >= 2) return { class: 'high', label: 'Alta' };
    if (ratio >= 1) return { class: 'medium', label: 'Média' };
    return { class: 'low', label: 'Baixa' };
}

function getImportanceAnalysis() {
    const importancias = requisitosProjeto.map(req => req.importanciaAbsoluta);
    const media = importancias.reduce((sum, imp) => sum + imp, 0) / importancias.length;
    const max = Math.max(...importancias);
    const min = Math.min(...importancias);
    
    return `A distribuição de importância mostra uma média de ${media.toFixed(1)}, com variação entre ${min.toFixed(1)} e ${max.toFixed(1)}. ${getDistributionImplication()}.`;
}

function getDifficultyAnalysis() {
    const highImpLowDiff = requisitosProjeto.filter(req => req.importanciaAbsoluta > 10 && req.dificuldadeTecnica <= 2).length;
    const highImpHighDiff = requisitosProjeto.filter(req => req.importanciaAbsoluta > 10 && req.dificuldadeTecnica >= 4).length;
    
    return `Identificados ${highImpLowDiff} requisitos de alta importância e baixa dificuldade (quick wins) e ${highImpHighDiff} requisitos de alta importância e alta dificuldade (desafios críticos).`;
}

function getCoverageAnalysis() {
    const coverage = parseFloat(getMatrixCoverage());
    
    if (coverage >= 75) return 'Excelente cobertura da matriz, indicando análise abrangente das relações.';
    if (coverage >= 50) return 'Boa cobertura da matriz, com a maioria das relações importantes definidas.';
    if (coverage >= 25) return 'Cobertura moderada da matriz, recomenda-se revisar relações não definidas.';
    return 'Cobertura baixa da matriz, necessário completar mais relações para análise robusta.';
}

function refreshPreview() {
    generatePreview();
    showAlert('Preview atualizado com sucesso!', 'success');
}

async function generatePDF() {
    try {
        showAlert('Gerando PDF... Por favor, aguarde.', 'info');
        
        // Atualiza configurações
        updateConfig();
        
        // Gera preview atualizado
        generatePreview();
        
        // Aguarda um momento para renderização
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const reportContent = document.getElementById('report-content');
        if (!reportContent) {
            throw new Error('Conteúdo do relatório não encontrado');
        }
        
        // Configura opções do html2canvas
        const canvas = await html2canvas(reportContent, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            width: reportContent.scrollWidth,
            height: reportContent.scrollHeight
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 295; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        // Adiciona primeira página
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Adiciona páginas adicionais se necessário
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }
        
        // Salva o PDF
        const filename = `relatorio-qfd-${reportConfig.date}.pdf`;
        pdf.save(filename);
        
        // Salva no histórico
        saveToHistory(filename);
        
        showAlert('PDF gerado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showAlert('Erro ao gerar PDF. Tente novamente.', 'danger');
    }
}

function saveToHistory(filename) {
    const history = JSON.parse(localStorage.getItem('qfd_report_history') || '[]');
    
    const reportEntry = {
        id: Date.now(),
        filename: filename,
        title: reportConfig.title,
        date: new Date().toISOString(),
        config: { ...reportConfig },
        sections: getSelectedSections(),
        stats: {
            clientReqs: requisitosCliente.length,
            projectReqs: requisitosProjeto.length,
            relations: qfdDB.getMatrizQFDCompleta().length
        }
    };
    
    history.unshift(reportEntry);
    
    // Mantém apenas os últimos 10 relatórios
    if (history.length > 10) {
        history.splice(10);
    }
    
    localStorage.setItem('qfd_report_history', JSON.stringify(history));
    loadReportHistory();
}

function loadReportHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
    const history = JSON.parse(localStorage.getItem('qfd_report_history') || '[]');
    
    if (history.length === 0) {
        historyList.innerHTML = '<div class="no-history">Nenhum relatório gerado ainda.</div>';
        return;
    }
    
    let historyHTML = '';
    
    history.forEach(entry => {
        const date = new Date(entry.date).toLocaleDateString('pt-BR');
        const time = new Date(entry.date).toLocaleTimeString('pt-BR');
        
        historyHTML += `
            <div class="history-item">
                <div class="history-header">
                    <div class="history-title">${escapeHtml(entry.title)}</div>
                    <div class="history-date">${date} às ${time}</div>
                </div>
                <div class="history-details">
                    <span class="history-filename">${entry.filename}</span>
                    <div class="history-stats">
                        <span class="stat">RC: ${entry.stats.clientReqs}</span>
                        <span class="stat">RP: ${entry.stats.projectReqs}</span>
                        <span class="stat">Rel: ${entry.stats.relations}</span>
                        <span class="stat">Seções: ${entry.sections.length}</span>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="btn btn-sm btn-secondary" onclick="loadHistoryConfig(${entry.id})">
                        <i class="fas fa-undo"></i> Restaurar Config
                    </button>
                </div>
            </div>
        `;
    });
    
    historyList.innerHTML = historyHTML;
}

function loadHistoryConfig(entryId) {
    const history = JSON.parse(localStorage.getItem('qfd_report_history') || '[]');
    const entry = history.find(h => h.id === entryId);
    
    if (!entry) return;
    
    // Restaura configurações
    document.getElementById('project-title').value = entry.config.title || '';
    document.getElementById('company-name').value = entry.config.company || '';
    document.getElementById('author-name').value = entry.config.author || '';
    document.getElementById('report-date').value = entry.config.date || '';
    document.getElementById('project-description').value = entry.config.description || '';
    
    // Restaura seções selecionadas
    const allCheckboxes = document.querySelectorAll('.section-checkbox input[type="checkbox"]');
    allCheckboxes.forEach(checkbox => {
        checkbox.checked = entry.sections.includes(checkbox.id);
    });
    
    updateConfig();
    updateSectionCount();
    generatePreview();
    
    showAlert('Configuração restaurada com sucesso!', 'success');
}

function clearHistory() {
    if (confirm('Tem certeza que deseja limpar todo o histórico de relatórios?')) {
        localStorage.removeItem('qfd_report_history');
        loadReportHistory();
        showAlert('Histórico limpo com sucesso!', 'success');
    }
}

// Funções utilitárias
function getSentidoSymbol(sentido) {
    const symbols = { 'up': '↑', 'down': '↓', 'none': '*' };
    return symbols[sentido] || '?';
}

function getSentidoLabel(sentido) {
    const labels = { 'up': 'Crescente', 'down': 'Decrescente', 'none': 'Nominal' };
    return labels[sentido] || 'Indefinido';
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
    if (!document.getElementById('relatorio-styles')) {
        const styles = document.createElement('style');
        styles.id = 'relatorio-styles';
        styles.textContent = `
            .section-count {
                background: #667eea;
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.8rem;
                margin-left: 1rem;
            }
            
            .config-form {
                display: grid;
                gap: 1.5rem;
            }
            
            .form-row {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1rem;
            }
            
            .form-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }
            
            .form-group label {
                font-weight: 600;
                color: #333;
            }
            
            .form-control {
                padding: 0.75rem;
                border: 1px solid #dee2e6;
                border-radius: 6px;
                font-size: 1rem;
                transition: border-color 0.3s ease;
            }
            
            .form-control:focus {
                outline: none;
                border-color: #667eea;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            
            .sections-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .section-item {
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 1rem;
                transition: all 0.3s ease;
            }
            
            .section-item:hover {
                background: #e3f2fd;
                border-color: #667eea;
            }
            
            .section-checkbox {
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
            }
            
            .section-checkbox input[type="checkbox"] {
                margin-top: 0.25rem;
                transform: scale(1.2);
            }
            
            .section-checkbox label {
                cursor: pointer;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                flex: 1;
            }
            
            .section-title {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-weight: 600;
                color: #333;
            }
            
            .section-description {
                font-size: 0.9rem;
                color: #666;
                line-height: 1.4;
            }
            
            .preview-actions {
                display: flex;
                gap: 0.5rem;
                margin-left: auto;
            }
            
            .preview-container {
                max-height: 600px;
                overflow-y: auto;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                background: white;
            }
            
            .report-preview-content {
                padding: 2rem;
                font-family: 'Times New Roman', serif;
                line-height: 1.6;
                color: #333;
            }
            
            .report-header {
                margin-bottom: 3rem;
                text-align: center;
                border-bottom: 2px solid #667eea;
                padding-bottom: 2rem;
            }
            
            .main-title {
                font-size: 2rem;
                color: #333;
                margin-bottom: 0.5rem;
            }
            
            .subtitle {
                font-size: 1.2rem;
                color: #666;
                margin-bottom: 1.5rem;
            }
            
            .company-name {
                font-size: 1.1rem;
                font-weight: 600;
                color: #667eea;
                margin-bottom: 1rem;
            }
            
            .report-meta {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                font-size: 0.9rem;
                color: #666;
            }
            
            .project-description {
                margin-top: 2rem;
                text-align: left;
                background: #f8f9fa;
                padding: 1.5rem;
                border-radius: 8px;
            }
            
            .report-section {
                margin-bottom: 3rem;
                page-break-inside: avoid;
            }
            
            .section-title {
                font-size: 1.5rem;
                color: #333;
                border-bottom: 1px solid #dee2e6;
                padding-bottom: 0.5rem;
                margin-bottom: 1.5rem;
            }
            
            .data-table {
                width: 100%;
                border-collapse: collapse;
                margin: 1rem 0;
                font-size: 0.9rem;
            }
            
            .data-table th,
            .data-table td {
                border: 1px solid #dee2e6;
                padding: 0.75rem;
                text-align: left;
            }
            
            .data-table th {
                background: #f8f9fa;
                font-weight: 600;
                color: #333;
            }
            
            .data-table .id-cell {
                text-align: center;
                font-weight: 600;
                color: #667eea;
            }
            
            .data-table .importance-cell,
            .data-table .weight-cell {
                text-align: center;
                font-weight: 600;
            }
            
            .data-table .ranking-cell {
                text-align: center;
                font-weight: 600;
                color: #f57c00;
            }
            
            .direction-badge {
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: 600;
                color: white;
            }
            
            .direction-badge.up {
                background: #28a745;
            }
            
            .direction-badge.down {
                background: #dc3545;
            }
            
            .direction-badge.none {
                background: #6c757d;
            }
            
            .difficulty-badge {
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: 600;
                color: white;
            }
            
            .difficulty-badge.level-1 {
                background: #28a745;
            }
            
            .difficulty-badge.level-2 {
                background: #20c997;
            }
            
            .difficulty-badge.level-3 {
                background: #ffc107;
                color: #212529;
            }
            
            .difficulty-badge.level-4 {
                background: #fd7e14;
            }
            
            .difficulty-badge.level-5 {
                background: #dc3545;
            }
            
            .priority-badge {
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: 600;
                color: white;
            }
            
            .priority-badge.high {
                background: #dc3545;
            }
            
            .priority-badge.medium {
                background: #ffc107;
                color: #212529;
            }
            
            .priority-badge.low {
                background: #28a745;
            }
            
            .top-priority {
                background: #fff3cd;
            }
            
            .qfd-matrix-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 0.8rem;
                margin: 1rem 0;
            }
            
            .qfd-matrix-table th,
            .qfd-matrix-table td {
                border: 1px solid #dee2e6;
                padding: 0.5rem;
                text-align: center;
            }
            
            .qfd-matrix-table .corner-cell {
                background: #495057;
                color: white;
                font-weight: bold;
            }
            
            .qfd-matrix-table .project-header {
                background: #667eea;
                color: white;
                font-weight: bold;
                writing-mode: vertical-rl;
                text-orientation: mixed;
            }
            
            .qfd-matrix-table .client-header {
                background: #f8f9fa;
                text-align: left;
                font-weight: 600;
            }
            
            .qfd-matrix-table .matrix-cell.filled {
                background: #e8f5e8;
            }
            
            .influence-value {
                font-weight: bold;
                color: white;
                background: #6c757d;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
            }
            
            .influence-value.level-1 {
                background: #28a745;
            }
            
            .influence-value.level-3 {
                background: #ffc107;
                color: #212529;
            }
            
            .influence-value.level-5 {
                background: #dc3545;
            }
            
            .correlation-symbol {
                font-weight: bold;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                color: white;
            }
            
            .correlation-symbol.strong-positive {
                background: #28a745;
            }
            
            .correlation-symbol.positive {
                background: #20c997;
            }
            
            .correlation-symbol.strong-negative {
                background: #dc3545;
            }
            
            .correlation-symbol.negative {
                background: #fd7e14;
            }
            
            .history-list {
                display: grid;
                gap: 1rem;
            }
            
            .history-item {
                background: white;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                padding: 1rem;
            }
            
            .history-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }
            
            .history-title {
                font-weight: 600;
                color: #333;
            }
            
            .history-date {
                font-size: 0.9rem;
                color: #666;
            }
            
            .history-details {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.75rem;
            }
            
            .history-filename {
                font-family: monospace;
                background: #f8f9fa;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.9rem;
            }
            
            .history-stats {
                display: flex;
                gap: 1rem;
            }
            
            .history-stats .stat {
                font-size: 0.8rem;
                color: #666;
                background: #e9ecef;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
            }
            
            .history-actions {
                display: flex;
                gap: 0.5rem;
            }
            
            .no-history {
                text-align: center;
                color: #6c757d;
                font-style: italic;
                padding: 2rem;
            }
            
            .status-ready {
                color: #28a745 !important;
            }
            
            .status-partial {
                color: #ffc107 !important;
            }
            
            .status-pending {
                color: #6c757d !important;
            }
            
            .report-footer {
                margin-top: 3rem;
                padding-top: 2rem;
                border-top: 1px solid #dee2e6;
                text-align: center;
                color: #666;
                font-size: 0.9rem;
            }
            
            @media (max-width: 768px) {
                .form-row {
                    grid-template-columns: 1fr;
                }
                
                .sections-grid {
                    grid-template-columns: 1fr;
                }
                
                .preview-actions {
                    flex-direction: column;
                }
                
                .history-header,
                .history-details {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.5rem;
                }
                
                .history-stats {
                    flex-wrap: wrap;
                }
            }
            
            @media print {
                .preview-container {
                    max-height: none;
                    overflow: visible;
                }
                
                .report-section {
                    page-break-inside: avoid;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
});



// ============================================
// NOVAS FUNCIONALIDADES - DICIONÁRIO E TELHADO
// ============================================

// Funcao para gerar dicionario de requisitos
function generateDictionary() {
    let html = '<div class="report-section"><h2>Dicionário de Requisitos</h2>';
    html += '<p>Mapeamento de códigos de requisitos com suas descrições completas.</p>';
    
    // Tabela de Requisitos de Cliente
    html += '<h3>Requisitos de Cliente (RC)</h3>';
    html += '<table class="dictionary-table"><thead><tr><th>Código</th><th>Descrição</th></tr></thead><tbody>';
    requisitosCliente.forEach((req, idx) => {
        html += `<tr><td class="req-code">RC ${idx + 1}</td><td class="req-description report-cell-with-hover" data-tooltip="${escapeHtml(req.descricao)}">${escapeHtml(req.descricao)}</td></tr>`;
    });
    html += '</tbody></table>';
    
    // Tabela de Requisitos de Projeto
    html += '<h3>Requisitos de Projeto (RP)</h3>';
    html += '<table class="dictionary-table"><thead><tr><th>Código</th><th>Descrição</th><th>Sentido</th></tr></thead><tbody>';
    requisitosProjeto.forEach((req, idx) => {
        const sentido = getSentidoLabel(req.sentidoMelhoria);
        html += `<tr><td class="req-code">RP ${idx + 1}</td><td class="req-description report-cell-with-hover" data-tooltip="${escapeHtml(req.descricao)}">${escapeHtml(req.descricao)}</td><td>${sentido}</td></tr>`;
    });
    html += '</tbody></table></div>';
    
    return html;
}

// Funcao para obter label do sentido de melhoria
function getSentidoLabel(sentido) {
    const labels = {
        'maior': 'Maior é Melhor ↑',
        'menor': 'Menor é Melhor ↓',
        'nominal': 'Valor Nominal ◯'
    };
    return labels[sentido] || sentido;
}

// Funcao para gerar telhado QFD
function generateRoofMatrix() {
    const correlacoes = qfdDB.getCorrelacoesProjeto();
    
    let html = '<div class="report-section"><h2>Telhado QFD - Correlações entre Requisitos</h2>';
    html += '<p>Matriz triangular superior mostrando as correlações entre requisitos de projeto.</p>';
    html += '<div class="roof-matrix-preview"><table class="roof-table-preview">';
    
    // Cabeçalho com números dos requisitos
    html += '<tr>';
    for (let i = 0; i < requisitosProjeto.length; i++) {
        const req = requisitosProjeto[i];
        const sentido = getSentidoSymbol(req.sentidoMelhoria);
        html += `<td class="report-header-cell-with-hover" data-tooltip="RP ${i + 1}: ${escapeHtml(req.descricao)}">${i + 1}${sentido}</td>`;
    }
    html += '</tr>';
    
    // Matriz triangular
    for (let i = 0; i < requisitosProjeto.length - 1; i++) {
        html += '<tr>';
        for (let j = 0; j < requisitosProjeto.length; j++) {
            if (j <= i) {
                html += '<td></td>';
            } else {
                const corr = correlacoes.find(c => 
                    (c.req1 === requisitosProjeto[i].id && c.req2 === requisitosProjeto[j].id) ||
                    (c.req1 === requisitosProjeto[j].id && c.req2 === requisitosProjeto[i].id)
                );
                
                let cellClass = 'roof-cell-preview';
                let cellValue = '○';
                
                if (corr) {
                    if (corr.value === '++') {
                        cellClass += ' strong-positive';
                        cellValue = '++';
                    } else if (corr.value === '+') {
                        cellClass += ' positive';
                        cellValue = '+';
                    } else if (corr.value === '-') {
                        cellClass += ' negative';
                        cellValue = '-';
                    } else if (corr.value === '--') {
                        cellClass += ' strong-negative';
                        cellValue = '--';
                    } else if (corr.value === '0') {
                        cellValue = '0';
                    }
                }
                
                const req1 = requisitosProjeto[i];
                const req2 = requisitosProjeto[j];
                const tooltip = `RP ${i + 1} vs RP ${j + 1}: ${escapeHtml(req1.descricao)} vs ${escapeHtml(req2.descricao)}`;
                
                html += `<td class="${cellClass} report-cell-with-hover" data-tooltip="${tooltip}">${cellValue}</td>`;
            }
        }
        html += '</tr>';
    }
    
    html += '</table></div></div>';
    return html;
}

// Funcao para obter símbolo do sentido de melhoria
function getSentidoSymbol(sentido) {
    const symbols = {
        'maior': '↑',
        'menor': '↓',
        'nominal': '◯'
    };
    return symbols[sentido] || '';
}

// Funcao para gerar importância relativa
function generateRelativeImportance() {
    const requisitos = requisitosCliente;
    
    if (requisitos.length === 0) return '';
    
    const totalImportancia = requisitos.reduce((sum, req) => sum + (req.importancia || 0), 0);
    
    let html = '<div class="report-section"><h2>Importância Relativa dos Requisitos</h2>';
    html += '<p>Distribuição percentual da importância entre os requisitos de cliente.</p>';
    html += '<table class="dictionary-table"><thead><tr><th>Requisito</th><th>Importância Absoluta</th><th>Importância Relativa</th></tr></thead><tbody>';
    
    requisitos.forEach((req, idx) => {
        const importanciaRelativa = totalImportancia > 0 ? ((req.importancia || 0) / totalImportancia * 100).toFixed(1) : 0;
        const barWidth = importanciaRelativa;
        
        html += `<tr>
            <td class="req-code report-cell-with-hover" data-tooltip="RC ${idx + 1}: ${escapeHtml(req.descricao)}">RC ${idx + 1}</td>
            <td>${req.importancia || 0}</td>
            <td>
                <div class="importance-relative">
                    <div class="importance-bar" style="width: ${barWidth}%"></div>
                    <span class="importance-value">${importanciaRelativa}%</span>
                </div>
            </td>
        </tr>`;
    });
    
    html += '</tbody></table></div>';
    return html;
}

// Funcao auxiliar para escapar HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}


// Funcao para gerar visualizacao completa do Telhado QFD
function generateRoofVisualization() {
    const correlacoes = qfdDB.getCorrelacoesProjeto();
    const matrizQFD = qfdDB.getMatrizQFD();
    
    let html = '<div class="report-section"><h2>Visualização do Telhado QFD</h2>';
    html += '<p>Matriz completa do telhado QFD mostrando as correlações entre todos os requisitos de projeto.</p>';
    
    html += '<div class="roof-visualization-container">';
    html += '<table class="roof-visualization-table">';
    
    // Cabeçalho com números dos requisitos
    html += '<thead><tr><th class="roof-corner"></th>';
    for (let i = 0; i < requisitosProjeto.length; i++) {
        const req = requisitosProjeto[i];
        const sentido = getSentidoSymbol(req.sentidoMelhoria);
        html += `<th class="roof-header-cell report-header-cell-with-hover" data-tooltip="RP ${i + 1}: ${escapeHtml(req.descricao)}">${i + 1}${sentido}</th>`;
    }
    html += '</tr></thead>';
    
    // Corpo da tabela com matriz triangular
    html += '<tbody>';
    for (let i = 0; i < requisitosProjeto.length; i++) {
        html += '<tr>';
        
        // Cabeçalho da linha
        const reqI = requisitosProjeto[i];
        const sentidoI = getSentidoSymbol(reqI.sentidoMelhoria);
        html += `<th class="roof-row-header report-header-cell-with-hover" data-tooltip="RP ${i + 1}: ${escapeHtml(reqI.descricao)}">${i + 1}${sentidoI}</th>`;
        
        // Células da matriz
        for (let j = 0; j < requisitosProjeto.length; j++) {
            if (i === j) {
                // Diagonal - sem correlação consigo mesmo
                html += '<td class="roof-diagonal-cell"></td>';
            } else if (j < i) {
                // Triângulo inferior - espelhado do superior
                const corr = correlacoes.find(c => 
                    (c.req1 === requisitosProjeto[i].id && c.req2 === requisitosProjeto[j].id) ||
                    (c.req1 === requisitosProjeto[j].id && c.req2 === requisitosProjeto[i].id)
                );
                
                let cellClass = 'roof-cell-lower';
                let cellValue = '○';
                
                if (corr) {
                    if (corr.value === '++') {
                        cellClass += ' strong-positive';
                        cellValue = '++';
                    } else if (corr.value === '+') {
                        cellClass += ' positive';
                        cellValue = '+';
                    } else if (corr.value === '-') {
                        cellClass += ' negative';
                        cellValue = '-';
                    } else if (corr.value === '--') {
                        cellClass += ' strong-negative';
                        cellValue = '--';
                    } else if (corr.value === '0') {
                        cellValue = '0';
                    }
                }
                
                const reqJ = requisitosProjeto[j];
                const tooltip = `RP ${i + 1} vs RP ${j + 1}: ${escapeHtml(reqI.descricao)} vs ${escapeHtml(reqJ.descricao)}`;
                
                html += `<td class="${cellClass} report-cell-with-hover" data-tooltip="${tooltip}">${cellValue}</td>`;
            } else {
                // Triângulo superior
                const corr = correlacoes.find(c => 
                    (c.req1 === requisitosProjeto[i].id && c.req2 === requisitosProjeto[j].id) ||
                    (c.req1 === requisitosProjeto[j].id && c.req2 === requisitosProjeto[i].id)
                );
                
                let cellClass = 'roof-cell-upper';
                let cellValue = '○';
                
                if (corr) {
                    if (corr.value === '++') {
                        cellClass += ' strong-positive';
                        cellValue = '++';
                    } else if (corr.value === '+') {
                        cellClass += ' positive';
                        cellValue = '+';
                    } else if (corr.value === '-') {
                        cellClass += ' negative';
                        cellValue = '-';
                    } else if (corr.value === '--') {
                        cellClass += ' strong-negative';
                        cellValue = '--';
                    } else if (corr.value === '0') {
                        cellValue = '0';
                    }
                }
                
                const reqJ = requisitosProjeto[j];
                const tooltip = `RP ${i + 1} vs RP ${j + 1}: ${escapeHtml(reqI.descricao)} vs ${escapeHtml(reqJ.descricao)}`;
                
                html += `<td class="${cellClass} report-cell-with-hover" data-tooltip="${tooltip}">${cellValue}</td>`;
            }
        }
        
        html += '</tr>';
    }
    html += '</tbody>';
    
    html += '</table>';
    html += '</div>';
    
    // Legenda
    html += '<div class="roof-legend">';
    html += '<h4>Legenda de Correlações:</h4>';
    html += '<div class="legend-items">';
    html += '<div class="legend-item"><span class="legend-symbol strong-positive">++</span> Correlação Positiva Muito Forte</div>';
    html += '<div class="legend-item"><span class="legend-symbol positive">+</span> Correlação Positiva</div>';
    html += '<div class="legend-item"><span class="legend-symbol">0</span> Sem Correlação</div>';
    html += '<div class="legend-item"><span class="legend-symbol negative">-</span> Correlação Negativa</div>';
    html += '<div class="legend-item"><span class="legend-symbol strong-negative">--</span> Correlação Negativa Muito Forte</div>';
    html += '</div>';
    html += '</div>';
    
    html += '</div>';
    return html;
}
