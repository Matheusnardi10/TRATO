/* ============================================================
   TRATO — dashboard.js
   Monta os indicadores, o gráfico, os alertas e a agenda.
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  var usuario = App.iniciarPainel({ pagina: 'dashboard' });
  if (!usuario) return;

  var resumo = DashboardService.resumoMes();

  renderKpis(resumo);
  renderGrafico(resumo);
  renderAlertas();
  renderAgenda();
  renderServicos();
  renderMiniFinanceiro(resumo);
  ativarBotoesAuxiliares();

  /* ---------- Indicadores ---------- */
  function renderKpis(resumo) {
    function variacao(valor) {
      if (!valor) return '<span class="muted">sem comparação</span>';
      var positivo = valor >= 0;
      return '<span class="kpi-delta ' + (positivo ? 'pos' : 'neg') + '">' +
        (positivo ? '▲ ' : '▼ ') + Utils.formatPercent(Math.abs(valor)) + '</span> vs. mês anterior';
    }

    document.getElementById('kpis').innerHTML =
      '<article class="kpi is-revenue">' +
        '<div class="kpi-label">Faturamento do mês</div>' +
        '<div class="kpi-value">' + Utils.formatBRL(resumo.faturamento) + '</div>' +
        '<div class="kpi-foot">' + variacao(resumo.variacaoFaturamento) + '</div>' +
      '</article>' +
      '<article class="kpi is-cost">' +
        '<div class="kpi-label">Custos</div>' +
        '<div class="kpi-value">' + Utils.formatBRL(resumo.custos) + '</div>' +
        '<div class="kpi-foot">' + Utils.formatPercent((resumo.custos / (resumo.faturamento || 1)) * 100) +
        ' do que você faturou</div>' +
      '</article>' +
      '<article class="kpi is-profit">' +
        '<div class="kpi-label">Lucro</div>' +
        '<div class="kpi-value">' + Utils.formatBRL(resumo.lucro) + '</div>' +
        '<div class="kpi-foot">' + variacao(resumo.variacaoLucro) + '</div>' +
      '</article>' +
      '<article class="kpi is-count">' +
        '<div class="kpi-label">Serviços em andamento</div>' +
        '<div class="kpi-value">' + String(resumo.emAndamento).padStart(2, '0') + '</div>' +
        '<div class="kpi-foot">' + Utils.formatBRL(resumo.aReceber) + ' ainda a receber</div>' +
      '</article>';
  }

  /* ---------- Gráfico ---------- */
  function renderGrafico(resumo) {
    Grafico.faturamentoCustosLucro(document.getElementById('grafico'), DashboardService.historico());
    document.getElementById('badge-margem').textContent =
      'Margem do mês: ' + Utils.formatPercent(resumo.margem);
  }

  /* ---------- Alertas ---------- */
  function renderAlertas() {
    var alertas = DashboardService.alertas();
    var alvo = document.getElementById('alertas');
    var sub = document.getElementById('alertas-sub');

    sub.textContent = alertas.length
      ? alertas.length + (alertas.length === 1 ? ' item pendente' : ' itens pendentes')
      : 'Nada pendente por enquanto';

    if (!alertas.length) {
      alvo.innerHTML = Components.emptyState({
        icone: '✅',
        titulo: 'Tudo em dia',
        texto: 'Nenhum orçamento parado, conflito de agenda ou custo fora do previsto.'
      });
      return;
    }

    alvo.innerHTML = alertas.slice(0, 6).map(function (a) {
      return '<div class="alert alert-' + a.tipo + '">' +
        '<span class="alert-icon">' + a.icone + '</span>' +
        '<div><strong>' + Utils.escapeHtml(a.titulo) + '</strong>' +
        '<p>' + Utils.escapeHtml(a.texto) + '</p></div>' +
        '</div>';
    }).join('');
  }

  /* ---------- Agenda financeira ---------- */
  function renderAgenda() {
    var dias = ScheduleService.agrupadosPorDia(8);
    var alvo = document.getElementById('agenda');

    if (!dias.length) {
      alvo.innerHTML = Components.emptyState({
        icone: '📅',
        titulo: 'Nenhum serviço agendado',
        texto: 'Quando um orçamento for aprovado, o serviço aparece aqui.'
      });
      return;
    }

    alvo.innerHTML = dias.map(function (dia) {
      var etiqueta = Utils.diffDias(dia.data) === 0 ? 'Hoje'
        : (Utils.diffDias(dia.data) === 1 ? 'Amanhã' : Utils.nomeDiaCurto(dia.data));

      var itens = dia.servicos.map(function (s) {
        var lucro = Calc.lucro(s.valor, s.custoPrevisto);
        return '<div class="agenda-item clickable" data-id="' + s.id + '">' +
          '<span class="hour">' + s.hora + '</span>' +
          '<div class="info">' +
            '<strong>' + Utils.escapeHtml(s.titulo) + '</strong>' +
            '<span>' + Utils.escapeHtml(ClientService.nome(s.clienteId)) + ' · ' + s.duracaoHoras + 'h</span>' +
          '</div>' +
          '<div class="valores">' +
            '<div class="v">' + Utils.formatBRL(s.valor) + '</div>' +
            '<div class="muted">lucro ' + Utils.formatBRL(lucro) + '</div>' +
          '</div>' +
        '</div>';
      }).join('');

      return '<div class="agenda-day">' +
        '<div class="agenda-day-head">' +
          '<span class="day">' + etiqueta + ' · ' + Utils.formatDateLong(dia.data) + '</span>' +
          '<span class="small">lucro do dia <strong class="pos">' + Utils.formatBRL(dia.lucro) + '</strong></span>' +
        '</div>' + itens + '</div>';
    }).join('');

    Utils.$$('.agenda-item[data-id]', alvo).forEach(function (item) {
      item.addEventListener('click', function () { window.location.href = 'servico-detalhe.html?id=' + item.dataset.id; });
    });
  }

  /* ---------- Serviços recentes ---------- */
  function renderServicos() {
    var servicos = ServiceService.recentes(6);
    var alvo = document.getElementById('tabela-servicos');

    if (!servicos.length) {
      alvo.innerHTML = Components.emptyState({
        icone: '🔨',
        titulo: 'Você ainda não possui serviços',
        texto: 'Crie um orçamento para começar a acompanhar seus trabalhos.'
      });
      return;
    }

    var linhas = servicos.map(function (s) {
      var rent = ServiceService.rentabilidade(s);
      var classeLucro = rent.lucroAtual >= rent.lucroPrevisto ? 'pos' : 'neg';
      return '<tr class="clickable" data-id="' + s.id + '">' +
        '<td>' +
          '<div class="cell-person">' +
            '<span class="avatar">' + Utils.iniciais(ClientService.nome(s.clienteId)) + '</span>' +
            '<div><strong>' + Utils.escapeHtml(s.titulo) + '</strong>' +
            '<span>' + Utils.escapeHtml(ClientService.nome(s.clienteId)) + ' · <span class="mono">#' + s.numero + '</span></span></div>' +
          '</div>' +
        '</td>' +
        '<td class="small">' + Utils.formatDate(s.data) + '</td>' +
        '<td class="num">' + Utils.formatBRL(s.valor) + '</td>' +
        '<td class="num">' + Utils.formatBRL(rent.custoReal) +
          (rent.acimaDoPrevisto ? ' <span class="tip" data-tip="Acima do custo previsto">⚠️</span>' : '') + '</td>' +
        '<td class="num ' + classeLucro + '">' + Utils.formatBRL(rent.lucroAtual) + '</td>' +
        '<td>' + Components.badge(Data.STATUS_SERVICO, s.status) + '</td>' +
      '</tr>';
    }).join('');

    alvo.innerHTML =
      '<table class="table">' +
        '<thead><tr>' +
          '<th>Serviço</th><th>Data</th><th class="num">Valor</th>' +
          '<th class="num">Custo</th><th class="num">Lucro</th><th>Status</th>' +
        '</tr></thead>' +
        '<tbody>' + linhas + '</tbody>' +
      '</table>' +
      '<div class="table-foot"><span>Mostrando ' + servicos.length + ' de ' +
        ServiceService.listar().length + ' serviços</span>' +
        '<span>Lucro considera as despesas já lançadas.</span></div>';

    Utils.$$('tr[data-id]', alvo).forEach(function (linha) {
      linha.addEventListener('click', function () { window.location.href = 'servico-detalhe.html?id=' + linha.dataset.id; });
    });
  }

  /* ---------- Financeiro resumido ---------- */
  function renderMiniFinanceiro(resumo) {
    var pagamentos = PaymentService.listar();
    var recebido = pagamentos.reduce(function (s, p) { return s + (Number(p.valorRecebido) || 0); }, 0);
    var total = pagamentos.reduce(function (s, p) { return s + (Number(p.valorTotal) || 0); }, 0);
    var percentual = total ? (recebido / total) * 100 : 0;
    var atrasados = pagamentos.filter(function (p) { return p.status === 'atrasado'; }).length;

    document.getElementById('mini-financeiro').innerHTML =
      '<div class="mini-stat"><span>Já recebido</span><span class="ms-value pos">' + Utils.formatBRL(recebido) + '</span></div>' +
      '<div class="mini-stat"><span>A receber</span><span class="ms-value">' + Utils.formatBRL(total - recebido) + '</span></div>' +
      '<div class="mini-stat"><span>Pagamentos atrasados</span><span class="ms-value ' + (atrasados ? 'neg' : '') + '">' + atrasados + '</span></div>' +
      '<div class="mini-stat"><span>Margem do mês</span><span class="ms-value">' + Utils.formatPercent(resumo.margem) + '</span></div>' +
      '<div class="progress"><i style="width:' + Math.min(100, percentual).toFixed(1) + '%"></i></div>' +
      '<p class="tiny muted mt-8 mb-0">' + Utils.formatPercent(percentual) + ' do valor contratado já entrou no caixa.</p>';
  }

  /* ---------- Botões auxiliares ---------- */
  function ativarBotoesAuxiliares() {
    var btnWhats = document.getElementById('btn-whats');
    if (btnWhats) btnWhats.addEventListener('click', Components.modalWhatsApp);
  }
});
