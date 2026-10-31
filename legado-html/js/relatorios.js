/* ============================================================
   TRATO — relatorios.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  var usuario = App.iniciarPainel({ pagina: 'relatorios' });
  if (!usuario) return;

  var ABAS = [
    { id: 'faturamento', nome: 'Faturamento' },
    { id: 'rentaveis', nome: 'Serviços mais rentáveis' },
    { id: 'clientes', nome: 'Clientes' },
    { id: 'categorias', nome: 'Categorias de custo' },
    { id: 'orcamentos', nome: 'Orçamentos' },
    { id: 'previsto', nome: 'Previsto x Realizado' },
    { id: 'hora', nome: 'Lucro por hora' }
  ];
  var abaAtiva = 'faturamento';

  renderTabs();
  renderConteudo();

  function renderTabs() {
    document.getElementById('tabs-relatorio').innerHTML = ABAS.map(function (a) {
      return '<button class="tab' + (a.id === abaAtiva ? ' active' : '') + '" data-tab="' + a.id + '">' + a.nome + '</button>';
    }).join('');
    Utils.$$('[data-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () { abaAtiva = tab.dataset.tab; renderTabs(); renderConteudo(); });
    });
  }

  function cabecalhoRelatorio(titulo, subtitulo, idExportar) {
    return '<div class="card-head"><div><h3>' + titulo + '</h3><p class="sub">' + subtitulo + '</p></div>' +
      (idExportar ? '<button class="btn btn-secondary btn-sm" id="' + idExportar + '">⬇ Exportar CSV</button>' : '') + '</div>';
  }

  function renderConteudo() {
    var alvo = document.getElementById('conteudo-relatorio');

    if (abaAtiva === 'faturamento') {
      alvo.innerHTML = '<section class="card">' + cabecalhoRelatorio('Faturamento, custos e lucro', 'Últimos 6 meses') + '<div class="card-body" id="grafico-relatorio"></div></section>';
      Grafico.faturamentoCustosLucro(document.getElementById('grafico-relatorio'), DashboardService.historico());
      return;
    }

    if (abaAtiva === 'rentaveis') {
      var top = ReportService.servicosMaisRentaveis(10);
      alvo.innerHTML = '<section class="card">' + cabecalhoRelatorio('Serviços mais rentáveis', 'Ordenados pelo lucro atual', 'btn-export') +
        '<div class="table-wrap"><table class="table"><thead><tr><th>Serviço</th><th>Cliente</th><th class="num">Valor</th><th class="num">Custo</th><th class="num">Lucro</th><th class="num">Margem</th></tr></thead><tbody>' +
        top.map(function (r) {
          return '<tr><td class="strong">#' + r.servico.numero + ' ' + Utils.escapeHtml(r.servico.titulo) + '</td>' +
            '<td>' + Utils.escapeHtml(ClientService.nome(r.servico.clienteId)) + '</td>' +
            '<td class="num">' + Utils.formatBRL(r.valor) + '</td><td class="num">' + Utils.formatBRL(r.custoReal) + '</td>' +
            '<td class="num pos">' + Utils.formatBRL(r.lucroAtual) + '</td><td class="num">' + Utils.formatPercent(r.margem) + '</td></tr>';
        }).join('') + '</tbody></table></div></section>';
      ligarExportar('btn-export', 'servicos-mais-rentaveis', top.map(function (r) {
        return { servico: r.servico.numero, titulo: r.servico.titulo, cliente: ClientService.nome(r.servico.clienteId), valor: r.valor, custo: r.custoReal, lucro: r.lucroAtual, margem: r.margem.toFixed(1) + '%' };
      }));
      return;
    }

    if (abaAtiva === 'clientes') {
      var clientes = ReportService.clientesPorMovimentacao(20);
      alvo.innerHTML = '<section class="card">' + cabecalhoRelatorio('Clientes', 'Ordenados pelo valor movimentado', 'btn-export') +
        '<div class="table-wrap"><table class="table"><thead><tr><th>Cliente</th><th class="num">Serviços</th><th class="num">Valor movimentado</th><th>Último serviço</th></tr></thead><tbody>' +
        clientes.map(function (r) {
          return '<tr><td class="strong">' + Utils.escapeHtml(r.cliente.nome) + '</td><td class="num">' + r.quantidade + '</td>' +
            '<td class="num">' + Utils.formatBRL(r.total) + '</td><td class="small">' + (r.ultimoServico ? Utils.formatDate(r.ultimoServico.data) : '—') + '</td></tr>';
        }).join('') + '</tbody></table></div></section>';
      ligarExportar('btn-export', 'clientes', clientes.map(function (r) {
        return { cliente: r.cliente.nome, servicos: r.quantidade, valorMovimentado: r.total, ultimoServico: r.ultimoServico ? r.ultimoServico.data : '' };
      }));
      return;
    }

    if (abaAtiva === 'categorias') {
      var categorias = FinanceService.despesasPorCategoria('todos');
      var maximo = Math.max.apply(null, categorias.map(function (c) { return c.valor; })) || 1;
      alvo.innerHTML = '<section class="card">' + cabecalhoRelatorio('Categorias de custo', 'Total histórico por categoria', 'btn-export') +
        '<div class="card-body">' + categorias.map(function (c) {
          return '<div class="mini-stat" style="display:block;padding:8px 0">' +
            '<div class="row-between mb-0" style="margin-bottom:4px"><span class="small">' + c.emoji + ' ' + c.nome + '</span><span class="small strong">' + Utils.formatBRL(c.valor) + '</span></div>' +
            '<div class="progress"><i style="width:' + ((c.valor / maximo) * 100).toFixed(0) + '%"></i></div></div>';
        }).join('') + '</div></section>';
      ligarExportar('btn-export', 'categorias-de-custo', categorias.map(function (c) { return { categoria: c.nome, valor: c.valor }; }));
      return;
    }

    if (abaAtiva === 'orcamentos') {
      var mapa = ReportService.orcamentosPorStatus();
      alvo.innerHTML = '<section class="card">' + cabecalhoRelatorio('Orçamentos por status', 'Quantidade e valor total', 'btn-export') +
        '<div class="table-wrap"><table class="table"><thead><tr><th>Status</th><th class="num">Quantidade</th><th class="num">Valor total</th></tr></thead><tbody>' +
        Object.keys(mapa).map(function (s) {
          return '<tr><td>' + Components.badge(Data.STATUS_ORCAMENTO, s) + '</td><td class="num">' + mapa[s].quantidade + '</td><td class="num">' + Utils.formatBRL(mapa[s].valor) + '</td></tr>';
        }).join('') + '</tbody></table></div></section>';
      ligarExportar('btn-export', 'orcamentos-por-status', Object.keys(mapa).map(function (s) {
        return { status: Data.STATUS_ORCAMENTO[s].label, quantidade: mapa[s].quantidade, valor: mapa[s].valor };
      }));
      return;
    }

    if (abaAtiva === 'previsto') {
      var pxr = ReportService.previstoXRealizado();
      alvo.innerHTML = '<section class="card">' + cabecalhoRelatorio('Previsto x Realizado', 'Custo por serviço', 'btn-export') +
        '<div class="card-body row-between mb-16"><span class="small">Total previsto <strong>' + Utils.formatBRL(pxr.previsto) + '</strong></span>' +
        '<span class="small">Total real <strong>' + Utils.formatBRL(pxr.real) + '</strong></span>' +
        '<span class="small">Diferença <strong class="' + (pxr.diferenca > 0 ? 'neg' : 'pos') + '">' + Utils.formatBRL(pxr.diferenca) + '</strong></span></div>' +
        '<div class="table-wrap"><table class="table"><thead><tr><th>Serviço</th><th class="num">Previsto</th><th class="num">Real</th><th class="num">Diferença</th></tr></thead><tbody>' +
        pxr.servicos.map(function (s) {
          return '<tr><td>#' + s.numero + ' ' + Utils.escapeHtml(s.titulo) + '</td><td class="num">' + Utils.formatBRL(s.previsto) + '</td>' +
            '<td class="num">' + Utils.formatBRL(s.real) + '</td><td class="num ' + (s.diferenca > 0 ? 'neg' : 'pos') + '">' + Utils.formatBRL(s.diferenca) + '</td></tr>';
        }).join('') + '</tbody></table></div></section>';
      ligarExportar('btn-export', 'previsto-x-realizado', pxr.servicos.map(function (s) {
        return { servico: s.numero, titulo: s.titulo, previsto: s.previsto, real: s.real, diferenca: s.diferenca };
      }));
      return;
    }

    if (abaAtiva === 'hora') {
      var horas = ReportService.lucroPorHora();
      alvo.innerHTML = '<section class="card">' + cabecalhoRelatorio('Lucro por hora', 'Somente serviços com horas registradas', 'btn-export') +
        '<div class="table-wrap">' + (horas.length ?
          '<table class="table"><thead><tr><th>Serviço</th><th class="num">Horas</th><th class="num">Lucro/hora</th></tr></thead><tbody>' +
          horas.map(function (h) {
            return '<tr><td>#' + h.numero + ' ' + Utils.escapeHtml(h.titulo) + '</td><td class="num">' + h.horas + 'h</td><td class="num">' + Utils.formatBRL(h.lucroPorHora) + '</td></tr>';
          }).join('') + '</tbody></table>'
          : Components.emptyState({ icone: '⏱️', titulo: 'Nenhum serviço com horas registradas', texto: 'Registre horas trabalhadas na aba Execução de cada serviço.' })
        ) + '</div></section>';
      ligarExportar('btn-export', 'lucro-por-hora', horas.map(function (h) { return { servico: h.numero, titulo: h.titulo, horas: h.horas, lucroPorHora: h.lucroPorHora }; }));
      return;
    }
  }

  function ligarExportar(id, nomeArquivo, linhas) {
    var botao = document.getElementById(id);
    if (!botao) return;
    botao.addEventListener('click', function () {
      if (!linhas.length) { showToast('Não há dados para exportar neste relatório.', 'error'); return; }
      ReportService.exportarCSV(nomeArquivo, linhas);
      showToast('Relatório exportado.', 'success');
    });
  }
});
