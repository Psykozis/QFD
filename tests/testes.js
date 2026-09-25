/**
 * ============================================================================
 * TESTES AUTOMATIZADOS DO SISTEMA QFD
 * ============================================================================
 *
 * Executados por testes.html. Os dados do projeto real (localStorage) são
 * guardados antes dos testes e restaurados ao final.
 *
 * Para adicionar um teste: test('nome', () => { ... }) dentro de uma suite(),
 * usando assert(condição, 'mensagem') ou assertEqual(obtido, esperado).
 */

const suites = [];
let suiteAtual = null;

function suite(nome, fn) {
    suiteAtual = { nome, testes: [] };
    suites.push(suiteAtual);
    fn();
}

function test(nome, fn) {
    suiteAtual.testes.push({ nome, fn });
}

function assert(cond, msg) {
    if (!cond) throw new Error(msg || 'condição falsa');
}

function assertEqual(obtido, esperado, msg) {
    const a = JSON.stringify(obtido), b = JSON.stringify(esperado);
    if (a !== b) throw new Error(`${msg ? msg + ': ' : ''}esperado ${b}, obtido ${a}`);
}

/** Troca window.alert por uma função que só registra as mensagens */
function capturarAlerts() {
    const mensagens = [];
    const original = window.alert;
    window.alert = m => mensagens.push(String(m));
    return { mensagens, restaurar: () => { window.alert = original; } };
}

/** Projeto de exemplo, com textos que exercitam aspas e < > */
function criarProjetoExemplo() {
    qfdDB.clearAllData();
    const rc = [
        qfdDB.addRequisitoCliente('Fácil de usar por idosos', 'Obs RC1 com "aspas" e <b>tag</b>'),
        qfdDB.addRequisitoCliente('Leve e "portátil"', 'Obs RC2'),
        qfdDB.addRequisitoCliente('Preço menor que R$ 100')
    ];
    const rp = [
        qfdDB.addRequisitoProjeto('Peso total (kg)', 'down', 3, 'Obs RP1 "pesagem"'),
        qfdDB.addRequisitoProjeto('Custo de produção', 'down', 2),
        qfdDB.addRequisitoProjeto('Número de botões', 'none', 1, 'Obs RP3')
    ];
    qfdDB.setComparacaoCliente(rc[0].id, rc[1].id, 3);
    qfdDB.setComparacaoCliente(rc[0].id, rc[2].id, 5);
    qfdDB.setComparacaoCliente(rc[1].id, rc[2].id, 1);
    qfdDB.setCorrelacaoProjeto(rp[0].id, rp[1].id, '--');
    qfdDB.setCorrelacaoProjeto(rp[1].id, rp[2].id, '+');
    rc.forEach((c, i) => rp.forEach((p, j) => qfdDB.setMatrizQFD(c.id, p.id, [1, 3, 5][(i + j) % 3])));
    qfdDB.getEspecificacoesProjeto();
    qfdDB.updateEspecificacao(rp[0].id, { unidadeMedida: 'kg', valorUnitario: '1,2', observacao: 'Spec "pesagem" a 25 °C' });
    return { rc, rp };
}

// ============================================================================
// UTILITÁRIOS (utils.js)
// ============================================================================

suite('Utilitários', () => {
    test('escapeHtml escapa < > & e aceita null', () => {
        assertEqual(escapeHtml('<b>"a" & b</b>'), '&lt;b&gt;"a" &amp; b&lt;/b&gt;');
        assertEqual(escapeHtml(null), '');
    });
    test('escapeAttr escapa aspas e preserva quebras de linha', () => {
        assertEqual(escapeAttr('a "b"\n<c>'), 'a &quot;b&quot;&#10;&lt;c&gt;');
    });
    test('truncateText', () => {
        assertEqual(truncateText('abcdef', 3), 'abc...');
        assertEqual(truncateText('abc', 3), 'abc');
        assertEqual(truncateText(null, 3), '');
    });
    test('getSentidoSymbol aceita valores novos e antigos', () => {
        assertEqual(['up', 'down', 'none', 'Crescente', 'xx'].map(getSentidoSymbol), ['↑', '↓', '*', '↑', '?']);
    });
    test('csvCell duplica aspas internas', () => {
        assertEqual(csvCell('diz "oi"'), '"diz ""oi"""');
    });
    test('parseCSV: aspas, vírgulas, BOM, CRLF, quebra de linha no campo e linhas vazias', () => {
        const rows = parseCSV('﻿a,"b, c","d ""e"""\r\n\r\n1,"multi\nlinha",3\n');
        assertEqual(rows, [['a', 'b, c', 'd "e"'], ['1', 'multi\nlinha', '3']]);
    });
    test('parseCSV detecta ponto e vírgula (Excel pt-BR)', () => {
        assertEqual(parseCSV('Descrição;Peso\nLeve, barato;1'), [['Descrição', 'Peso'], ['Leve, barato', '1']]);
    });
    test('parseNumero: vírgula decimal, milhar, unidade e texto sem número', () => {
        assertEqual(['1,2', '1.234,5 kg', '1,234.5', '1.500', '0.25', '≤ 20 kW', '-3', 'aprox. 7,5', 'abc', '', null].map(parseNumero),
            [1.2, 1234.5, 1234.5, 1500, 0.25, 20, -3, 7.5, null, null, null]);
    });
});

// ============================================================================
// BANCO DE DADOS (database.js)
// ============================================================================

suite('Banco de dados', () => {
    test('adicionar, editar e remover requisito de cliente', () => {
        qfdDB.clearAllData();
        const r = qfdDB.addRequisitoCliente('  Requisito de teste  ', ' obs ');
        assertEqual([r.descricao, r.observacao], ['Requisito de teste', 'obs']);
        qfdDB.updateRequisitoCliente(r.id, { descricao: 'Outro texto' });
        assertEqual(qfdDB.getRequisitosCliente()[0].descricao, 'Outro texto');
        qfdDB.removeRequisitoCliente(r.id);
        assertEqual(qfdDB.getRequisitosCliente().length, 0);
    });
    test('remover requisito de projeto remove correlações e relações ligadas a ele', () => {
        const { rp } = criarProjetoExemplo();
        qfdDB.removeRequisitoProjeto(rp[0].id);
        const d = qfdDB.loadData();
        assert(!d.correlacaoProjeto.some(c => c.requisito1 === rp[0].id || c.requisito2 === rp[0].id), 'correlação órfã');
        assert(!d.matrizQFD.some(m => m.requisitoProjeto === rp[0].id), 'relação QFD órfã');
        assert(qfdDB.validateData().isValid, qfdDB.validateData().errors.join('; '));
    });
    test('pesos dos requisitos de cliente somam 100%', () => {
        criarProjetoExemplo();
        qfdDB.calculateImportanciaCliente();
        const soma = qfdDB.getRequisitosCliente().reduce((s, r) => s + r.peso, 0);
        assert(Math.abs(soma - 1) < 1e-9, `soma = ${soma}`);
    });
    test('pesos relativos dos requisitos de projeto somam 100%', () => {
        criarProjetoExemplo();
        qfdDB.calculateImportanciaCliente();
        qfdDB.calculateImportanciaProjeto();
        const soma = qfdDB.getRequisitosProjeto().reduce((s, r) => s + (r.pesoRelativo || 0), 0);
        assert(Math.abs(soma - 1) < 1e-9, `soma = ${soma}`);
    });
    test('especificações: ordem pelo QFD, texto explicativo e aspectos do telhado (--)', () => {
        const { rp } = criarProjetoExemplo();
        const lista = qfdDB.getEspecificacoesOrdenadas();
        assertEqual(lista.length, 3);
        assertEqual(lista.map(l => l.rank), [1, 2, 3]);
        const peso = lista.find(l => l.requisito.id === rp[0].id);
        assertEqual(peso.observacao, 'Spec "pesagem" a 25 °C');
        assert(/Custo de produção/.test(peso.aspectosIndesejaveis), 'conflito -- não listado: ' + peso.aspectosIndesejaveis);
    });
    test('aspectos editados manualmente não são sobrescritos pelo telhado', () => {
        const { rp } = criarProjetoExemplo();
        qfdDB.updateEspecificacao(rp[0].id, { aspectosIndesejaveis: 'Texto meu' });
        const peso = qfdDB.getEspecificacoesOrdenadas().find(l => l.requisito.id === rp[0].id);
        assertEqual(peso.aspectosIndesejaveis, 'Texto meu');
    });
    test('detecção de duplicados ignora maiúsculas e espaços, e o próprio requisito', () => {
        qfdDB.clearAllData();
        const r = qfdDB.addRequisitoCliente('Fácil de usar pelo idoso');
        assert(qfdDB.findRequisitoDuplicado('cliente', '  fácil de   USAR pelo idoso '), 'não detectou');
        assertEqual(qfdDB.findRequisitoDuplicado('cliente', 'Fácil de usar pelo idoso', r.id), null);
        assertEqual(qfdDB.findRequisitoDuplicado('projeto', 'Fácil de usar pelo idoso'), null);
    });
});

// ============================================================================
// VERSIONAMENTO E MIGRAÇÃO
// ============================================================================

suite('Versionamento dos dados', () => {
    const dadosV1 = () => ({
        requisitosCliente: [{ id: 'c1', descricao: 'Leve' }],
        requisitosProjeto: [
            { id: 'p1', descricao: 'Peso', sentidoMelhoria: 'Decrescente' },
            { id: 'p2', descricao: 'Custo', sentidoMelhoria: 'crescente', dificuldadeTecnica: '3' },
            { id: 'p3', descricao: 'X', sentidoMelhoria: '???' }
        ],
        comparacaoCliente: [], matrizQFD: [],
        correlacaoProjeto: [{ requisito1: 'p1', requisito2: 'p2', correlacao: '--' }],
        metadata: { created: '2025-01-01', lastModified: '2025-01-01', version: '1.0' }
    });

    test('dados v1 no navegador são migrados ao carregar', () => {
        localStorage.setItem('qfd_data', JSON.stringify(dadosV1()));
        qfdDB.loadData();
        const d = JSON.parse(localStorage.getItem('qfd_data'));
        assertEqual(d.metadata.schemaVersion, SCHEMA_VERSION);
        assertEqual(d.metadata.version, undefined, 'campo version antigo');
        assertEqual(d.metadata.created, '2025-01-01');
        assertEqual(d.requisitosProjeto.map(r => r.sentidoMelhoria), ['down', 'up', 'none']);
        assertEqual(d.requisitosProjeto.map(r => r.dificuldadeTecnica), [1, 3, 1]);
        assertEqual([d.requisitosCliente[0].observacao, d.requisitosCliente[0].peso], ['', 0]);
        assert(Array.isArray(d.especificacoesProjeto), 'especificacoesProjeto ausente');
        assertEqual(d.correlacaoProjeto.length, 1, 'dados perdidos');
        assertEqual(d.avaliacaoCompetitiva.produtos.map(p => p.id), [PRODUTO_NOSSO_ID]);
    });
    test('dados v2 ganham a avaliação competitiva vazia (v3) sem perder nada', () => {
        const d = {
            requisitosCliente: [{ id: 'c1', descricao: 'Leve', observacao: '', importancia: 0, peso: 0 }],
            requisitosProjeto: [], comparacaoCliente: [], correlacaoProjeto: [], matrizQFD: [], especificacoesProjeto: [],
            metadata: { created: '2026-01-01', schemaVersion: 2 }
        };
        assert(qfdDB.importData(d), qfdDB.lastImportError);
        const r = qfdDB.loadData();
        assertEqual(r.metadata.schemaVersion, SCHEMA_VERSION);
        assertEqual(r.requisitosCliente[0].descricao, 'Leve');
        assertEqual([r.avaliacaoCompetitiva.produtos.length, r.avaliacaoCompetitiva.notasCliente.length], [1, 0]);
    });
    test('banco novo já nasce na versão atual', () => {
        qfdDB.clearAllData();
        assertEqual(qfdDB.loadData().metadata.schemaVersion, SCHEMA_VERSION);
    });
    test('importar backup antigo migra os dados', () => {
        const d = dadosV1(); delete d.metadata;
        assert(qfdDB.importData(d), qfdDB.lastImportError);
        const r = qfdDB.loadData();
        assertEqual(r.metadata.schemaVersion, SCHEMA_VERSION);
        assertEqual(r.especificacoesProjeto.length, 3);
    });
    test('importar backup de versão mais nova é recusado sem alterar os dados', () => {
        qfdDB.clearAllData();
        qfdDB.addRequisitoCliente('Existente');
        const ok = qfdDB.importData({ requisitosCliente: [], requisitosProjeto: [], metadata: { schemaVersion: SCHEMA_VERSION + 1 } });
        assertEqual(ok, false);
        assert(/versão/.test(qfdDB.lastImportError), qfdDB.lastImportError);
        assertEqual(qfdDB.getRequisitosCliente().length, 1);
    });
    test('importar arquivo que não é projeto QFD ou JSON inválido é recusado', () => {
        assertEqual(qfdDB.importData('{"foo":1}'), false);
        assertEqual(qfdDB.importData('{xx'), false);
        assertEqual(qfdDB.importData('[1,2]'), false);
    });
});

// ============================================================================
// TRATAMENTO DE ERROS
// ============================================================================

suite('Tratamento de erros', () => {
    test('dados corrompidos são restaurados do backup automático', () => {
        const alerts = capturarAlerts();
        try {
            localStorage.setItem('qfd_backup', JSON.stringify({
                requisitosCliente: [{ id: 'b1', descricao: 'Do backup' }], requisitosProjeto: [],
                comparacaoCliente: [], correlacaoProjeto: [], matrizQFD: [],
                metadata: { schemaVersion: SCHEMA_VERSION }, backup: { type: 'auto' }
            }));
            localStorage.setItem('qfd_data', '{"requisitosCliente": [ quebrado');
            assertEqual(qfdDB.getRequisitosCliente().map(r => r.descricao), ['Do backup']);
            assert(localStorage.getItem('qfd_data_corrompido').includes('quebrado'), 'cópia não guardada');
            assert(/backup/.test(alerts.mensagens[0]), 'usuário não avisado');
        } finally {
            alerts.restaurar();
        }
    });
    test('dados corrompidos sem backup iniciam projeto vazio', () => {
        const alerts = capturarAlerts();
        try {
            localStorage.removeItem('qfd_backup');
            localStorage.setItem('qfd_data', 'nada');
            assertEqual(qfdDB.getRequisitosCliente().length, 0);
            assert(/vazio/.test(alerts.mensagens[0]), 'usuário não avisado');
        } finally {
            alerts.restaurar();
        }
    });
    test('armazenamento cheio: avisa, propaga o erro e não grava nada', () => {
        qfdDB.clearAllData();
        const alerts = capturarAlerts();
        const setItem = Storage.prototype.setItem;
        let erro = null;
        try {
            Storage.prototype.setItem = function() { throw new DOMException('cheio', 'QuotaExceededError'); };
            try { qfdDB.addRequisitoCliente('Não cabe'); } catch (e) { erro = e; }
        } finally {
            Storage.prototype.setItem = setItem;
            alerts.restaurar();
        }
        assertEqual(erro && erro.name, 'QuotaExceededError');
        assert(/cheio/.test(alerts.mensagens[0] || ''), 'usuário não avisado');
        assertEqual(qfdDB.getRequisitosCliente().length, 0);
    });
});

// ============================================================================
// IMPORTAÇÃO DE CSV
// ============================================================================

suite('Importação de CSV', () => {
    test('CSV exportado pela página (cabeçalho "Número,Descrição")', () => {
        qfdDB.clearAllData();
        const r = importRequisitosCSV('Número,Descrição,Importância\n1,"Barato, leve",0\n2,"Diz ""oi""",0\n', 'cliente');
        assertEqual(r.importados, 2);
        assertEqual(qfdDB.getRequisitosCliente().map(x => x.descricao), ['Barato, leve', 'Diz "oi"']);
    });
    test('CSV do menu Backup & Export, ignorando duplicados', () => {
        const r = importRequisitosCSV('id,descricao,importancia,peso\nabc,"Barato, leve",0,0\nxyz,"Novo item",0,0\n', 'cliente');
        assertEqual([r.importados, r.duplicados], [1, 1]);
    });
    test('lista simples, com duplicado dentro do próprio arquivo', () => {
        const r = importRequisitosCSV('Primeiro item\nSegundo item\nsegundo ITEM\n\n', 'cliente');
        assertEqual([r.importados, r.duplicados], [2, 1]);
    });
    test('requisitos de projeto com sentido e dificuldade (número ou nome)', () => {
        const r = importRequisitosCSV('Número,Descrição,Sentido Melhoria,Dificuldade Técnica\n1,Peso,Decrescente,Moderada\n2,Custo,Crescente,5\n3,Cor,xx,\n', 'projeto');
        assertEqual(r.importados, 3);
        assertEqual(qfdDB.getRequisitosProjeto().map(x => x.sentidoMelhoria + x.dificuldadeTecnica), ['down3', 'up5', 'none1']);
    });
    test('arquivo vazio é recusado', () => {
        let msg = '';
        try { importRequisitosCSV('\n\n', 'cliente'); } catch (e) { msg = e.message; }
        assert(/vazio/.test(msg), 'não recusou');
    });
});

// ============================================================================
// AVALIAÇÃO COMPETITIVA
// ============================================================================

/**
 * Projeto de exemplo + 2 concorrentes com notas e valores técnicos.
 * RP1 "Peso total (kg)" é ↓ e RP2 "Custo de produção" é ↓.
 */
function criarAvaliacaoExemplo() {
    const ex = criarProjetoExemplo();
    const { rc, rp } = ex;
    const a = qfdDB.addConcorrente('Marca A');
    const b = qfdDB.addConcorrente('Marca "B" <x>');
    // RC1: nós 3, A 4, B 2 → atrás; RC2: nós 5, A 4 → à frente; RC3: nós 3, A 3 → empate
    [[rc[0], PRODUTO_NOSSO_ID, 3], [rc[0], a.id, 4], [rc[0], b.id, 2],
     [rc[1], PRODUTO_NOSSO_ID, 5], [rc[1], a.id, 4],
     [rc[2], PRODUTO_NOSSO_ID, 3], [rc[2], a.id, 3]].forEach(([r, p, n]) => qfdDB.setNotaCliente(r.id, p, n));
    qfdDB.setMetaCliente(rc[0].id, 5);
    qfdDB.setValorTecnico(rp[0].id, a.id, '1,5 kg');
    qfdDB.setValorTecnico(rp[0].id, b.id, '0,9');
    qfdDB.setValorTecnico(rp[0].id, PRODUTO_NOSSO_ID, '1,4');
    qfdDB.setValorTecnico(rp[2].id, a.id, '4');
    return { ...ex, a, b };
}

suite('Avaliação competitiva', () => {
    test('concorrentes: adicionar, nome repetido, renomear, limite e o nosso produto não sai', () => {
        qfdDB.clearAllData();
        const a = qfdDB.addConcorrente('  Marca   A ');
        assertEqual(a.nome, 'Marca A');
        let msg = '';
        try { qfdDB.addConcorrente('marca a'); } catch (e) { msg = e.message; }
        assert(/Já existe/.test(msg), 'aceitou nome repetido');
        qfdDB.renameProdutoAvaliado(PRODUTO_NOSSO_ID, 'Protótipo v2');
        assertEqual(qfdDB.getAvaliacaoCompetitiva().produtos.map(p => p.nome), ['Protótipo v2', 'Marca A']);
        for (let i = 2; i <= MAX_CONCORRENTES; i++) qfdDB.addConcorrente('C' + i);
        msg = '';
        try { qfdDB.addConcorrente('Um a mais'); } catch (e) { msg = e.message; }
        assert(/Limite/.test(msg), 'passou do limite');
        assertEqual(qfdDB.removeConcorrente(PRODUTO_NOSSO_ID), false);
    });
    test('notas: situação, índice de melhoria e prioridade', () => {
        const { rc } = criarAvaliacaoExemplo();
        const an = qfdDB.getAnaliseCompetitiva();
        const c = id => an.clientes.find(x => x.requisito.id === id);
        assertEqual([c(rc[0].id).situacao, c(rc[1].id).situacao, c(rc[2].id).situacao], ['atras', 'frente', 'empate']);
        assertEqual(c(rc[0].id).melhor, { valor: 4, produtos: ['Marca A'] });
        assert(Math.abs(c(rc[0].id).indiceMelhoria - 5 / 3) < 1e-9, 'índice de melhoria');
        const soma = an.clientes.reduce((s, x) => s + x.prioridade, 0);
        assert(Math.abs(soma - 1) < 1e-9, `prioridades somam ${soma}`);
        assertEqual(an.stats, { notasTotal: 9, notasPreenchidas: 7, percent: 78 });
    });
    test('notas fora de 1 a 5 apagam a nota', () => {
        const { rc } = criarAvaliacaoExemplo();
        qfdDB.setNotaCliente(rc[1].id, PRODUTO_NOSSO_ID, '');
        qfdDB.setNotaCliente(rc[2].id, PRODUTO_NOSSO_ID, 7);
        const an = qfdDB.getAnaliseCompetitiva();
        assertEqual(an.clientes.filter(x => x.nossa).length, 1);
    });
    test('técnico: melhor concorrente pelo sentido de melhoria e meta da especificação', () => {
        const { rp } = criarAvaliacaoExemplo();
        const an = qfdDB.getAnaliseCompetitiva();
        const t = id => an.tecnicos.find(x => x.requisito.id === id);
        // RP1 ↓: melhor é 0,9 (Marca "B"); meta 1,2 kg > 0,9 → atrás
        assertEqual(t(rp[0].id).melhor, { valor: 0.9, produtos: ['Marca "B" <x>'] });
        assertEqual(t(rp[0].id).situacao, 'atras');
        // RP3 é nominal: não há melhor
        assertEqual([t(rp[2].id).melhor, t(rp[2].id).situacao], [null, 'sem-dados']);
        qfdDB.updateEspecificacao(rp[0].id, { valorUnitario: '0,8' });
        assertEqual(qfdDB.getAnaliseCompetitiva().tecnicos.find(x => x.requisito.id === rp[0].id).situacao, 'frente');
    });
    test('inconsistência: clientes preferem um produto, mas os valores técnicos fortes favorecem o outro', () => {
        const { rc, rp, a } = criarAvaliacaoExemplo();
        assertEqual(qfdDB.getAnaliseCompetitiva().inconsistencias.length, 0);
        // RC1 × RP1 forte (9). Clientes: A (4) > nós (3), mas no peso (↓) nós 1,4 < A 1,5
        qfdDB.setMatrizQFD(rc[0].id, rp[0].id, 9);
        const inc = qfdDB.getAnaliseCompetitiva().inconsistencias;
        assert(inc.some(i => i.numero === 1 && i.preferido === 'Marca A' && i.outro === 'Nosso produto' && i.requisitosProjeto.join() === '1'),
            JSON.stringify(inc));
        // Com o valor corrigido, a inconsistência some
        qfdDB.setValorTecnico(rp[0].id, a.id, '1,3');
        assert(!qfdDB.getAnaliseCompetitiva().inconsistencias.some(i => i.preferido === 'Marca A' && i.outro === 'Nosso produto'), 'não sumiu');
    });
    test('remover requisito ou concorrente apaga notas e valores ligados', () => {
        const { rc, rp, a } = criarAvaliacaoExemplo();
        qfdDB.removeRequisitoCliente(rc[0].id);
        qfdDB.removeRequisitoProjeto(rp[0].id);
        qfdDB.removeConcorrente(a.id);
        const av = qfdDB.getAvaliacaoCompetitiva();
        assert(!av.notasCliente.some(n => n.requisitoClienteId === rc[0].id || n.produtoId === a.id), 'nota órfã');
        assert(!av.metasCliente.some(m => m.requisitoClienteId === rc[0].id), 'meta órfã');
        assert(!av.valoresTecnicos.some(v => v.requisitoProjetoId === rp[0].id || v.produtoId === a.id), 'valor órfão');
        assert(qfdDB.validateData().isValid, qfdDB.validateData().errors.join('; '));
    });
    test('backup exportado e importado mantém a avaliação', () => {
        criarAvaliacaoExemplo();
        const backup = JSON.stringify(qfdDB.exportData());
        qfdDB.clearAllData();
        assert(qfdDB.importData(backup), qfdDB.lastImportError);
        assertEqual(qfdDB.getAvaliacaoCompetitiva().produtos.length, 3);
        assertEqual(qfdDB.getAnaliseCompetitiva().stats.notasPreenchidas, 7);
    });
    test('gráfico: SVG com os produtos e nomes escapados', () => {
        criarAvaliacaoExemplo();
        const html = buildGraficoCompetitivo(qfdDB.getAnaliseCompetitiva());
        assert(html.includes('<svg') && html.includes('<circle'), 'sem SVG');
        assert(html.includes('Marca "B" &lt;x&gt;') && !html.includes('<x>'), 'nome não escapado');
        qfdDB.clearAllData();
        assertEqual(buildGraficoCompetitivo(qfdDB.getAnaliseCompetitiva()), '');
    });
});

// ============================================================================
// ATENDIMENTO AOS REQUISITOS DE CLIENTE
// ============================================================================
// No projeto de exemplo a matriz é RC(i) × RP(j) = [1, 3, 5][(i + j) % 3]:
//   RC1: RP1 1, RP2 3, RP3 5 | RC2: RP1 3, RP2 5, RP3 1 | RC3: RP1 5, RP2 1, RP3 3
// Pesos (Mudge): RC1 8/9, RC2 1/9, RC3 0. RP1 ↓ meta 1,2 kg; RP2 ↓ e RP3 * sem meta.

suite('Atendimento aos requisitos', () => {
    test('metaAtingida por sentido de melhoria (nominal com ±5%)', () => {
        assertEqual([qfdDB.metaAtingida('up', 10, 10), qfdDB.metaAtingida('up', 9.9, 10),
            qfdDB.metaAtingida('down', 1.1, 1.2), qfdDB.metaAtingida('down', 1.3, 1.2),
            qfdDB.metaAtingida('none', 10.5, 10), qfdDB.metaAtingida('none', 10.6, 10),
            qfdDB.metaAtingida('none', 0, 0)], [true, false, true, false, true, false, true]);
    });
    test('estados das metas: não atingida, sem medição e sem meta', () => {
        const { rp } = criarAvaliacaoExemplo(); // nosso RP1 medido 1,4 > meta 1,2
        const an = qfdDB.getAnaliseAtendimento();
        const estado = id => an.projetos.find(p => p.requisito.id === id).estado;
        assertEqual([estado(rp[0].id), estado(rp[1].id), estado(rp[2].id)], ['nao-atingida', 'sem-meta', 'sem-meta']);
        qfdDB.updateEspecificacao(rp[1].id, { valorUnitario: '50' });
        assertEqual(qfdDB.getAnaliseAtendimento().projetos.find(p => p.requisito.id === rp[1].id).estado, 'sem-medicao');
    });
    test('atendimento por requisito de cliente ponderado pela influência, e geral pelo peso', () => {
        const { rc, rp } = criarAvaliacaoExemplo();
        assertEqual(qfdDB.getAnaliseAtendimento().atendimentoGeral, 0);
        qfdDB.setValorTecnico(rp[0].id, PRODUTO_NOSSO_ID, '1,1');           // RP1 atingida
        assertEqual(qfdDB.getAnaliseAtendimento().atendimentoGeral, 1);
        qfdDB.updateEspecificacao(rp[1].id, { valorUnitario: '50' });
        qfdDB.setValorTecnico(rp[1].id, PRODUTO_NOSSO_ID, '60');            // RP2 não atingida
        const an = qfdDB.getAnaliseAtendimento();
        const at = id => an.clientes.find(c => c.requisito.id === id).atendimento;
        assertEqual([at(rc[0].id), at(rc[1].id), at(rc[2].id)], [1 / 4, 3 / 8, 5 / 6]);
        const esperado = (8 / 9) * (1 / 4) + (1 / 9) * (3 / 8);
        assert(Math.abs(an.atendimentoGeral - esperado) < 1e-9, `geral ${an.atendimentoGeral} ≠ ${esperado}`);
        // RC2: nota dos clientes 5, mas atendimento 37,5% → divergência
        assert(an.diagnostico.divergencias.some(c => c.requisito.id === rc[1].id), 'divergência não detectada');
    });
    test('cobertura, requisitos sem relação e requisito de projeto órfão', () => {
        const { rc, rp } = criarProjetoExemplo();
        qfdDB.setMatrizQFD(rc[0].id, rp[0].id, 9);
        rp.forEach(p => qfdDB.setMatrizQFD(rc[2].id, p.id, 0));
        qfdDB.setMatrizQFD(rc[1].id, rp[1].id, 1);
        qfdDB.setMatrizQFD(rc[1].id, rp[0].id, 1);
        qfdDB.setMatrizQFD(rc[1].id, rp[2].id, 1);
        const novo = qfdDB.addRequisitoProjeto('Cor da carcaça', 'none', 1);
        const an = qfdDB.getAnaliseAtendimento();
        assertEqual(an.clientes.map(c => c.cobertura), ['forte', 'fraca', 'nenhuma']);
        assertEqual(an.diagnostico.semRelacao.map(c => c.numero), [3]);
        assertEqual(an.diagnostico.soFracas.map(c => c.numero), [2]);
        assertEqual(an.diagnostico.rpSemRelacao.map(p => p.requisito.id), [novo.id]);
        assertEqual(an.atendimentoGeral, null, 'sem medições o atendimento geral é null');
    });
    test('tabela e diagnóstico escapam os textos', () => {
        criarAvaliacaoExemplo();
        const an = qfdDB.getAnaliseAtendimento();
        const html = buildTabelaAtendimentoClientes(an) + buildDiagnosticoAtendimentoHtml(an);
        assert(html.includes('Leve e "portátil"') || html.includes('Leve e &quot;portátil&quot;'), 'descrição ausente');
        assert(!/<b>tag<\/b>/.test(html), 'HTML do usuário não escapado');
    });
});

// ============================================================================
// PÁGINAS (abertas em iframe; só no modo headless — ver rodar-testes.ps1)
// ============================================================================

const PAGINAS = [
    { arquivo: '../index.html', funcao: 'updateDashboard' },
    { arquivo: '../pages/requisitos-cliente.html', funcao: 'loadRequisitos', texto: 'Fácil de usar por idosos' },
    { arquivo: '../pages/comparacao-cliente.html', funcao: 'generateComparisonMatrix', balao: 'Obs RC1' },
    { arquivo: '../pages/requisitos-projeto.html', funcao: 'loadRequisitos', texto: 'Peso total (kg)' },
    { arquivo: '../pages/correlacao-projeto.html', funcao: 'generateRoofMatrix', balao: 'Obs RP1' },
    { arquivo: '../pages/matriz-qfd.html', funcao: 'setupMatrix', balao: 'Obs RP1' },
    { arquivo: '../pages/especificacoes.html', funcao: 'renderTable', texto: 'Custo de produção' },
    {
        arquivo: '../pages/avaliacao-competitiva.html', funcao: 'updateComputed', preparar: criarAvaliacaoExemplo,
        texto: 'Marca "B" <x>', seletores: ['#grafico-clientes svg circle', '#clientes-tbody .sit-atras', '#tecnicos-tbody .valor-input']
    },
    {
        arquivo: '../pages/atendimento-requisitos.html', funcao: 'updateComputed', preparar: criarAvaliacaoExemplo,
        texto: 'Não atingida', seletores: ['#clientes-tabela .atend-rel', '#diagnostico .resultado-bloco', '#projetos-tbody .valor-input']
    },
    {
        arquivo: '../pages/relatorio.html', funcao: 'generatePreview', preparar: criarAvaliacaoExemplo,
        texto: 'Resultado da comparação',
        seletores: ['#report-content .grafico-competitivo', '#report-content .resultado-atras li', '#report-content .resultado-metas li',
            '#report-content .report-atendimento .atend-rel']
    }
];

function carregarPagina(arquivo) {
    return new Promise((resolve, reject) => {
        const iframe = document.createElement('iframe');
        iframe.className = 'pagina-teste';
        const timer = setTimeout(() => reject(new Error('tempo esgotado ao carregar')), 10000);
        iframe.onload = () => { clearTimeout(timer); setTimeout(() => resolve(iframe), 300); };
        iframe.src = arquivo;
        document.body.appendChild(iframe);
    });
}

function testarPagina(pagina) {
    return async () => {
        if (pagina.preparar) pagina.preparar();
        const iframe = await carregarPagina(pagina.arquivo);
        try {
            const win = iframe.contentWindow, doc = iframe.contentDocument;
            assert(win.eval('typeof qfdDB') === 'object', 'database.js não carregou'); // const: não é window.qfdDB
            assert(typeof win.setupDropdownMenu === 'function', 'utils.js não carregou');
            assert(typeof win[pagina.funcao] === 'function', `script da página não carregou (${pagina.funcao} ausente)`);

            if (pagina.texto) {
                assert(doc.body.textContent.includes(pagina.texto), `"${pagina.texto}" não aparece na página`);
            }
            (pagina.seletores || []).forEach(sel => {
                assert(doc.querySelector(sel), `elemento "${sel}" não encontrado`);
            });

            const toggles = [...doc.querySelectorAll('.nav-dropdown .dropdown-toggle')];
            assertEqual(toggles.length, 2, 'quantidade de menus');
            toggles.forEach((t, i) => {
                t.click();
                assert(t.nextElementSibling.classList.contains('show'), `menu ${i + 1} não abriu`);
            });
            doc.body.click();
            assertEqual(doc.querySelectorAll('.dropdown-menu.show').length, 0, 'menus abertos após clicar fora');

            if (pagina.balao) {
                const alvo = [...doc.querySelectorAll('[data-tooltip]')]
                    .find(el => el.getAttribute('data-tooltip').includes(pagina.balao));
                assert(alvo, `nenhum elemento com balão contendo "${pagina.balao}"`);
                alvo.dispatchEvent(new win.MouseEvent('mouseenter', { clientX: 50, clientY: 50 }));
                const balao = doc.querySelector('.custom-tooltip') || doc.getElementById('qfd-tooltip');
                assert(balao && balao.textContent.includes(pagina.balao), 'balão não exibiu o texto explicativo');
                assert(!/<em|<br|&quot;/.test(balao.textContent), 'balão mostra HTML cru: ' + balao.textContent);
            }
        } finally {
            iframe.remove();
        }
    };
}

suite('Páginas', () => {
    PAGINAS.forEach(p => test(p.arquivo.replace('../', ''), testarPagina(p)));
});

// ============================================================================
// EXECUÇÃO
// ============================================================================

function podeAbrirIframes() {
    try {
        const f = document.createElement('iframe');
        f.src = '../index.html';
        return new Promise(resolve => {
            f.onload = () => {
                let ok = false;
                try { ok = !!f.contentDocument && !!f.contentDocument.body; } catch (e) { ok = false; }
                f.remove();
                resolve(ok);
            };
            f.style.display = 'none';
            document.body.appendChild(f);
        });
    } catch (e) {
        return Promise.resolve(false);
    }
}

async function executarTestes() {
    // Guarda os dados reais do navegador para restaurar no final
    const snapshot = {};
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        snapshot[k] = localStorage.getItem(k);
    }

    const linhas = [];
    let passou = 0, falhou = 0, pulou = 0;
    const iframesOk = await podeAbrirIframes();

    try {
        for (const s of suites) {
            linhas.push(`\n## ${s.nome}`);
            for (const t of s.testes) {
                if (s.nome === 'Páginas') {
                    if (!iframesOk) {
                        linhas.push(`PULOU  ${t.nome} (rode tests/rodar-testes.ps1)`);
                        pulou++;
                        continue;
                    }
                    criarProjetoExemplo();
                }
                try {
                    await t.fn();
                    linhas.push(`OK     ${t.nome}`);
                    passou++;
                } catch (e) {
                    linhas.push(`FALHA  ${t.nome} — ${e.message}`);
                    falhou++;
                }
            }
        }
    } finally {
        localStorage.clear();
        Object.entries(snapshot).forEach(([k, v]) => localStorage.setItem(k, v));
    }

    linhas.push(`\nRESUMO: ${passou} ok, ${falhou} falha(s), ${pulou} pulado(s)`);
    const pre = document.getElementById('resultado');
    pre.textContent = linhas.join('\n').trim();
    pre.className = falhou ? 'falhou' : 'passou';
    document.title = (falhou ? '✗ ' : '✓ ') + document.title;
}

window.addEventListener('load', executarTestes);
