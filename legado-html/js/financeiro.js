/* ============================================================
   TRATO — financeiro.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  var usuario = App.iniciarPainel({ pagina: 'financeiro' });
  if (!usuario) return;

  var periodo = 'mes';
  render();

  Utils.$$('.chip[data-periodo]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      Utils.$$('.chip[data-periodo]').forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      periodo = chip.dataset.periodo;
      render();
    });
  });

  function render() {
    renderKpis();
    renderFluxo();
    renderCategorias();
    renderPagamentos();
  }

  /* ---------- Indicadores ---------- */
  function renderKpis() {
    var resumo = FinanceService.resumo(periodo);
    document.getElementById('fin-kpis').innerHTML =
      '<div class="kpi is-revenue"><div class="kpi-label">Receitas</div><div class="kpi-value">' + Utils.formatBRL(resumo.receitas) + '</div></div>' +
      '<div class="kpi is-cost"><div class="kpi-label">Despesas</div><div class="kpi-value">' + Utils.formatBRL(resumo.despesas) + '</div></div>' +
      '<div class="kpi is-profit"><div class="kpi-label">Lucro</div><div class="kpi-value">' + Utils.formatBRL(resumo.lucro) + '</div></div>' +
      '<div class="kpi is-count"><div class="kpi-label">A receber</div><div class="kpi-value">' + Utils.formatBRL(resumo.aReceber) + '</div></div>';
  }

  /* ---------- Fluxo de caixa (14 dias) ---------- */
  function renderFluxo() {
    var pontos = FinanceService.fluxoCaixa(14);
    var maximo = Math.max.apply(null, pontos.map(function (p) { return Math.max(p.entradas, p.saidas); })) || 1;

    document.getElementById('fin-fluxo').innerHTML = pontos.map(function (p) {
      var largEntrada = (p.entradas / maximo) * 100;
      var largSaida = (p.saidas / maximo) * 100;
      return '<div class="mini-stat" style="display:block;padding:8px 0">' +
        '<div class="row-between mb-0" style="margin-bottom:4px"><span class="tiny muted">' + Utils.formatDate(p.data) + '</span>' +
          '<span class="tiny"><span class="pos">+' + Utils.formatBRL(p.entradas) + '</span> · <span class="neg">−' + Utils.formatBRL(p.saidas) + '</span></span></div>' +
        '<div class="progress" style="margin-top:0"><i style="width:' + largEntrada.toFixed(0) + '%;background:var(--success)"></i></div>' +
        '<div class="progress" style="margin-top:4px"><i style="width:' + largSaida.toFixed(0) + '%;background:var(--danger)"></i></div>' +
      '</div>';
    }).join('');
  }

  /* ---------- Despesas por categoria ---------- */
  function renderCategorias() {
    var categorias = FinanceService.despesasPorCategoria(periodo).filter(function (c) { return c.valor > 0; });
    var alvo = document.getElementById('fin-categorias');

    if (!categorias.length) {
      alvo.innerHTML = Components.emptyState({ icone: '💰', titulo: 'Nenhuma despesa no período', texto: 'Registre custos nos serviços para ver a distribuição aqui.' });
      return;
    }

    var maximo = Math.max.apply(null, categorias.map(function (c) { return c.valor; }));
    alvo.innerHTML = categorias.map(function (c) {
      return '<div class="mini-stat" style="display:block;padding:8px 0">' +
        '<div class="row-between mb-0" style="margin-bottom:4px"><span class="small">' + c.emoji + ' ' + c.nome + '</span>' +
          '<span class="small strong">' + Utils.formatBRL(c.valor) + '</span></div>' +
        '<div class="progress"><i style="width:' + ((c.valor / maximo) * 100).toFixed(0) + '%"></i></div>' +
      '</div>';
    }).join('');
  }

  /* ---------- Pagamentos ---------- */
  function renderPagamentos() {
    var pagamentos = PaymentService.listar().sort(function (a, b) { return a.dataPrevista < b.dataPrevista ? 1 : -1; });
    var alvo = document.getElementById('fin-pagamentos');

    if (!pagamentos.length) {
      alvo.innerHTML = Components.emptyState({ icone: '💳', titulo: 'Nenhum pagamento registrado', texto: 'Pagamentos aparecem automaticamente quando um serviço é criado.' });
      return;
    }

    alvo.innerHTML = '<table class="table"><thead><tr>' +
      '<th>Cliente</th><th>Vencimento</th><th class="num">Total</th><th class="num">Recebido</th><th>Status</th><th></th>' +
      '</tr></thead><tbody>' +
      pagamentos.map(function (p) {
        var restante = p.valorTotal - p.valorRecebido;
        return '<tr>' +
          '<td>' + Utils.escapeHtml(ClientService.nome(p.clienteId)) + '</td>' +
          '<td class="small">' + Utils.formatDate(p.dataPrevista) + '</td>' +
          '<td class="num">' + Utils.formatBRL(p.valorTotal) + '</td>' +
          '<td class="num">' + Utils.formatBRL(p.valorRecebido) + '</td>' +
          '<td>' + Components.badge(Data.STATUS_PAGAMENTO, p.status) + '</td>' +
          '<td>' + (p.status !== 'pago' ? '<button class="btn btn-secondary btn-sm" data-registrar="' + p.id + '" data-restante="' + restante + '">Registrar</button>' : '') + '</td>' +
        '</tr>';
      }).join('') + '</tbody></table>';

    Utils.$$('[data-registrar]', alvo).forEach(function (b) {
      b.addEventListener('click', function () { abrirModalRecebimento(b.dataset.registrar, Number(b.dataset.restante)); });
    });
  }

  function abrirModalRecebimento(pagamentoId, restante) {
    openModal({
      titulo: 'Registrar recebimento',
      conteudo:
        '<div class="field"><label>Valor recebido</label><div class="input-group"><span class="prefix">R$</span>' +
          '<input class="input" id="r-valor" value="' + Utils.mascaraMoeda(String(Math.round(restante * 100))) + '"></div>' +
          '<span class="label-hint">Restante em aberto: ' + Utils.formatBRL(restante) + '</span></div>' +
        '<div class="field-row"><div class="field"><label>Forma de pagamento</label><select class="select" id="r-forma">' +
          '<option>Pix</option><option>Dinheiro</option><option>Cartão</option><option>Transferência</option></select></div>' +
          '<div class="field"><label>Data</label><input class="input" type="date" id="r-data" value="' + Utils.hojeISO() + '"></div></div>',
      botoes: [
        { texto: 'Cancelar', classe: 'btn-secondary', fechar: true },
        {
          texto: 'Registrar', classe: 'btn-primary', onClick: function (overlay) {
            var valor = Utils.parseBRL(overlay.querySelector('#r-valor').value);
            if (!valor) return false;
            PaymentService.registrarRecebimento(pagamentoId, valor, overlay.querySelector('#r-forma').value, overlay.querySelector('#r-data').value);
            render();
            showToast('Recebimento registrado.', 'success');
          }
        }
      ]
    });
    var campo = document.getElementById('r-valor');
    campo.addEventListener('input', function () { campo.value = Utils.mascaraMoeda(campo.value); });
  }
});
