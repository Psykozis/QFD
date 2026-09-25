/**
 * ============================================================================
 * ATENDIMENTO AOS REQUISITOS DE CLIENTE
 * ============================================================================
 *
 * Mostra quanto os requisitos de projeto atendem aos requisitos de cliente:
 * cobertura na matriz QFD e metas atingidas (valor medido do nosso produto ×
 * meta das especificações). Cálculos em qfdDB.getAnaliseAtendimento().
 *
 * A tabela de metas é montada uma vez; ao alterar um valor medido, só o
 * estado da linha, a tabela de clientes, o diagnóstico e o status mudam.
 */

document.addEventListener('DOMContentLoaded', loadPage);

function loadPage() {
    try {
        const analise = qfdDB.getAnaliseAtendimento();
        const temDados = analise.clientes.length > 0 && analise.projetos.length > 0;
        document.getElementById('insufficient-data').style.display = temDados ? 'none' : 'block';
        document.getElementById('atendimento-content').style.display = temDados ? 'block' : 'none';
        if (temDados) renderProjetos(analise);
        updateComputed(analise);
    } catch (err) {
        console.error('Erro ao carregar a análise de atendimento:', err);
        showAlert('Erro ao carregar a análise de atendimento. Recarregue a página.', 'danger');
    }
}

function renderProjetos(analise) {
    const tbody = document.getElementById('projetos-tbody');
    tbody.innerHTML = '';

    analise.projetos.forEach(p => {
        const tr = document.createElement('tr');
        tr.dataset.rpId = p.requisito.id;
        tr.innerHTML = `
            <td><span class="spec-rank">#${p.rank}</span> <strong>RP${p.numero}</strong></td>
            <td class="competitiva-desc"></td>
            <td title="${escapeAttr(getSentidoLabel(p.requisito.sentidoMelhoria))}">${getSentidoSymbol(p.requisito.sentidoMelhoria)}</td>
            <td></td>
            <td class="medido-cell"></td>
            <td class="p-estado"></td>
            <td>${p.relacoes || '<span class="sit-atras sit-badge">0</span>'}</td>`;
        tr.children[1].textContent = p.requisito.descricao;
        tr.children[3].textContent = p.meta ? `${p.meta} ${p.unidade}`.trim() : '—';

        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 50;
        input.className = 'form-control valor-input';
        input.placeholder = p.unidade || 'valor';
        input.value = p.medido;
        input.addEventListener('change', () => {
            qfdDB.setValorTecnico(p.requisito.id, PRODUTO_NOSSO_ID, input.value);
            updateComputed();
        });
        tr.querySelector('.medido-cell').appendChild(input);
        tbody.appendChild(tr);
    });
}

function updateComputed(analise) {
    analise = analise || qfdDB.getAnaliseAtendimento();

    analise.projetos.forEach(p => {
        const tr = document.querySelector(`#projetos-tbody tr[data-rp-id="${CSS.escape(p.requisito.id)}"]`);
        if (tr) tr.querySelector('.p-estado').innerHTML = badgeHtml(getEstadoMeta(p.estado));
    });

    document.getElementById('clientes-tabela').innerHTML = buildTabelaAtendimentoClientes(analise);
    document.getElementById('diagnostico').innerHTML = buildDiagnosticoAtendimentoHtml(analise);

    const s = analise.stats;
    const pct = analise.atendimentoGeral === null ? null : Math.round(analise.atendimentoGeral * 100);
    document.getElementById('atendimento-geral').textContent = pct === null ? '—' : `${pct}%`;
    document.getElementById('cobertura-forte').textContent = `${s.coberturaForte} / ${s.requisitosCliente}`;
    document.getElementById('metas-atingidas').textContent = `${s.metasAtingidas} / ${s.metasAvaliadas}`;
    document.getElementById('sem-relacao').textContent = analise.diagnostico.semRelacao.length;
    document.getElementById('progress-fill').style.width = `${pct || 0}%`;
}

function exportAtendimentoCSV() {
    const analise = qfdDB.getAnaliseAtendimento();
    let csv = 'Metas de projeto\nRP,Requisito,Sentido,Meta,Unidade,Valor medido,Estado da meta,Relações\n';
    analise.projetos.forEach(p => {
        csv += [`RP${p.numero}`, csvCell(p.requisito.descricao), getSentidoLabel(p.requisito.sentidoMelhoria),
            csvCell(p.meta), csvCell(p.unidade), csvCell(p.medido), getEstadoMeta(p.estado).texto, p.relacoes].join(',') + '\n';
    });
    csv += '\nAtendimento por requisito de cliente\nRC,Requisito,Peso,Relacionados,Cobertura,Atendimento,Nota dos clientes\n';
    analise.clientes.forEach(c => {
        const rels = c.relacoes.map(r => `RP${r.projeto.numero} (${r.influencia}, ${getEstadoMeta(r.projeto.estado).texto})`).join('; ');
        csv += [`RC${c.numero}`, csvCell(c.requisito.descricao), (c.peso * 100).toFixed(1) + '%', csvCell(rels),
            getCoberturaInfo(c.cobertura).texto, c.atendimento === null ? '' : Math.round(c.atendimento * 100) + '%',
            c.notaClientes || ''].join(',') + '\n';
    });
    const geral = analise.atendimentoGeral === null ? '' : Math.round(analise.atendimentoGeral * 100) + '%';
    csv += `\nAtendimento geral (ponderado),${geral}\n`;
    downloadFile('﻿' + csv, 'atendimento-requisitos.csv', 'text/csv;charset=utf-8');
}
