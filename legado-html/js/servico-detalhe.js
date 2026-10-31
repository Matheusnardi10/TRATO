/* ============================================================
   TRATO — servico-detalhe.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  var usuario = App.iniciarPainel({ pagina: 'servicos' });
  if (!usuario) return;

  var id = Utils.param('id');
  var servico = id && ServiceService.buscar(id);

  if (!servico) {
    document.querySelector('.page').innerHTML = Components.emptyState({ icone: '🚫', titulo: 'Serviço não encontrado', texto: 'Ele pode ter sido excluído.' });
    return;
  }

  var ABAS = [
    { id: 'geral', nome: '📋 Visão geral' },
    { id: 'custos', nome: '💰 Custos' },
    { id: 'execucao', nome: '⏱️ Execução' },
    { id: 'documentos', nome: '📄 Documentos' },
    { id: 'agenda', nome: '📅 Agenda' },
    { id: 'pagamentos', nome: '💳 Pagamentos' },
    { id: 'rentabilidade', nome: '📊 Rentabilidade' }
  ];
  var abaAtiva = 'geral';

  document.title = servico.titulo + ' — Trato';
  recarregar();

  function recarregar() { servico = ServiceService.buscar(id); }

  function renderCabecalho() {
    document.getElementById('servico-titulo').textContent = servico.titulo;
    document.getElementById('servico-sub').innerHTML =
      '#' + servico.numero + ' · ' + Utils.escapeHtml(ClientService.nome(servico.clienteId)) + ' · ' +
      Utils.formatDate(servico.data) + ' às ' + servico.hora;
    document.getElementById('servico-status-badge').innerHTML = Components.badge(Data.STATUS_SERVICO, servico.status);
  }

  function renderKpis() {
    var rent = ServiceService.rentabilidade(servico);
    document.getElementById('servico-kpis').innerHTML =
      '<div class="kpi is-revenue"><div class="kpi-label">Valor contratado</div><div class="kpi-value">' + Utils.formatBRL(servico.valor) + '</div></div>' +
      '<div class="kpi is-cost"><div class="kpi-label">Custo real</div><div class="kpi-value">' + Utils.formatBRL(rent.custoReal) + '</div>' +
        (rent.acimaDoPrevisto ? '<div class="kpi-foot"><span class="neg">⚠️ acima do previsto</span></div>' : '') + '</div>' +
      '<div class="kpi is-profit"><div class="kpi-label">Lucro atual</div><div class="kpi-value">' + Utils.formatBRL(rent.lucroAtual) + '</div></div>' +
      '<div class="kpi is-count"><div class="kpi-label">Lucro por hora</div><div class="kpi-value">' + Utils.formatBRL(rent.lucroPorHora) + '</div></div>';
  }

  function renderTabs() {
    document.getElementById('tabs').innerHTML = ABAS.map(function (a) {
      return '<button class="tab' + (a.id === abaAtiva ? ' active' : '') + '" data-tab="' + a.id + '">' + a.nome + '</button>';
    }).join('');
    Utils.$$('[data-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () { abaAtiva = tab.dataset.tab; renderTabs(); renderConteudo(); });
    });
  }

  function renderTudo() {
    renderCabecalho();
    renderKpis();
    renderTabs();
    renderConteudo();
  }
  renderTudo();

  function renderConteudo() {
    var alvo = document.getElementById('conteudo-aba');
    if (abaAtiva === 'geral') return renderGeral(alvo);
    if (abaAtiva === 'custos') return renderCustos(alvo);
    if (abaAtiva === 'execucao') return renderExecucao(alvo);
    if (abaAtiva === 'documentos') return renderDocumentos(alvo);
    if (abaAtiva === 'agenda') return renderAgendaAba(alvo);
    if (abaAtiva === 'pagamentos') return renderPagamentos(alvo);
    if (abaAtiva === 'rentabilidade') return renderRentabilidade(alvo);
  }

  /* ---------- Visão geral ---------- */
  function renderGeral(alvo) {
    var cliente = ClientService.buscar(servico.clienteId);
    var nicho = Data.getNicho(servico.nicho);
    alvo.innerHTML =
      '<div class="grid grid-2">' +
        '<div>' +
          '<div class="mini-stat"><span class="muted">Cliente</span><span class="ms-value">' + (cliente ? '<a href="cliente-detalhe.html?id=' + cliente.id + '">' + Utils.escapeHtml(cliente.nome) + '</a>' : '—') + '</span></div>' +
          '<div class="mini-stat"><span class="muted">Tipo de serviço</span><span class="ms-value">' + nicho.emoji + ' ' + nicho.nome + '</span></div>' +
          '<div class="mini-stat"><span class="muted">Local</span><span class="ms-value">' + Utils.escapeHtml(servico.local || '—') + '</span></div>' +
          '<div class="mini-stat"><span class="muted">Duração prevista</span><span class="ms-value">' + servico.duracaoHoras + 'h</span></div>' +
        '</div>' +
        '<div>' +
          '<div class="mini-stat"><span class="muted">Orçamento de origem</span><span class="ms-value">' + (servico.orcamentoId ? '<a href="orcamento-detalhe.html?id=' + servico.orcamentoId + '">Ver orçamento</a>' : '—') + '</span></div>' +
          '<div class="mini-stat"><span class="muted">Contrato vinculado</span><span class="ms-value">' + (servico.contratoId ? '<a href="contrato-detalhe.html?id=' + servico.contratoId + '">Ver contrato</a>' : '—') + '</span></div>' +
          '<div class="mini-stat"><span class="muted">Criado</span><span class="ms-value">' + Utils.formatDate(servico.data) + '</span></div>' +
        '</div>' +
      '</div>' +
      '<div class="field mt-24" style="max-width:280px"><label>Status do serviço</label>' +
        '<select class="select" id="select-status">' +
          Object.keys(Data.STATUS_SERVICO).map(function (s) {
            return '<option value="' + s + '"' + (s === servico.status ? ' selected' : '') + '>' + Data.STATUS_SERVICO[s].label + '</option>';
          }).join('') +
        '</select></div>';

    document.getElementById('select-status').addEventListener('change', function (e) {
      ServiceService.alterarStatus(servico.id, e.target.value);
      recarregar();
      renderTudo();
      showToast('Status atualizado para "' + Data.STATUS_SERVICO[e.target.value].label + '".', 'success');
    });
  }

  /* ---------- Custos ---------- */
  function renderCustos(alvo) {
    var despesas = ExpenseService.porServico(servico.id);
    var total = ExpenseService.totalDoServico(servico.id);

    alvo.innerHTML =
      '<div class="row-between mb-16">' +
        '<span class="small muted">Previsto: <strong>' + Utils.formatBRL(servico.custoPrevisto) + '</strong> · Real: <strong class="' + (total > servico.custoPrevisto ? 'neg' : 'pos') + '">' + Utils.formatBRL(total) + '</strong></span>' +
        '<button class="btn btn-primary btn-sm" id="btn-add-despesa">+ Registrar despesa</button>' +
      '</div>' +
      (despesas.length ? '<table class="table"><thead><tr><th>Categoria</th><th>Descrição</th><th>Data</th><th class="num">Valor</th><th></th></tr></thead><tbody>' +
        despesas.map(function (d) {
          var cat = Data.CATEGORIAS_DESPESA.filter(function (c) { return c.id === d.categoria; })[0] || { nome: d.categoria, emoji: '•' };
          return '<tr><td>' + cat.emoji + ' ' + cat.nome + '</td><td>' + Utils.escapeHtml(d.descricao || '—') + '</td>' +
            '<td class="small">' + Utils.formatDate(d.data) + '</td><td class="num">' + Utils.formatBRL(d.valor) + '</td>' +
            '<td><button class="row-action" type="button" data-excluir="' + d.id + '">🗑️</button></td></tr>';
        }).join('') + '</tbody></table>'
        : Components.emptyState({ icone: '💰', titulo: 'Nenhuma despesa registrada', texto: 'Registre combustível, material, alimentação e outros custos deste serviço.' }));

    document.getElementById('btn-add-despesa').addEventListener('click', abrirModalDespesa);
    Utils.$$('[data-excluir]', alvo).forEach(function (b) {
      b.addEventListener('click', function () {
        ExpenseService.excluir(b.dataset.excluir);
        recarregar();
        renderTudo();
        showToast('Despesa removida.', 'success');
      });
    });
  }

  function abrirModalDespesa() {
    openModal({
      titulo: 'Registrar despesa',
      subtitulo: 'Vinculada ao serviço #' + servico.numero + '.',
      conteudo:
        '<div class="field"><label>Categoria</label><select class="select" id="d-categoria">' +
          Data.CATEGORIAS_DESPESA.map(function (c) { return '<option value="' + c.id + '">' + c.emoji + ' ' + c.nome + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="field-row">' +
          '<div class="field"><label>Valor <span class="req">*</span></label><div class="input-group"><span class="prefix">R$</span><input class="input" id="d-valor" placeholder="0,00"></div><span class="field-error"></span></div>' +
          '<div class="field"><label>Data</label><input class="input" type="date" id="d-data" value="' + Utils.hojeISO() + '"></div>' +
        '</div>' +
        '<div class="field"><label>Descrição</label><input class="input" id="d-descricao" placeholder="Ex.: Gasolina para deslocamento"></div>',
      botoes: [
        { texto: 'Cancelar', classe: 'btn-secondary', fechar: true },
        {
          texto: 'Registrar despesa', classe: 'btn-primary', onClick: function (overlay) {
            var valorCampo = overlay.querySelector('#d-valor');
            var valor = Utils.parseBRL(valorCampo.value);
            if (!valor) { Utils.setErro(valorCampo, 'Informe um valor.'); return false; }
            ExpenseService.criar({
              servicoId: servico.id,
              categoria: overlay.querySelector('#d-categoria').value,
              valor: valor,
              data: overlay.querySelector('#d-data').value || Utils.hojeISO(),
              descricao: overlay.querySelector('#d-descricao').value.trim()
            });
            recarregar();
            renderTudo();
            showToast('Despesa registrada.', 'success');
          }
        }
      ]
    });
    var campoValor = document.getElementById('d-valor');
    campoValor.addEventListener('input', function () { campoValor.value = Utils.mascaraMoeda(campoValor.value); });
  }

  /* ---------- Execução ---------- */
  function renderExecucao(alvo) {
    alvo.innerHTML =
      '<div class="field" style="max-width:280px"><label>Horas trabalhadas</label>' +
        '<input class="input" type="number" min="0" step="0.5" id="horas-trabalhadas" value="' + servico.horasTrabalhadas + '"></div>' +
      '<button class="btn btn-secondary btn-sm mb-24" id="btn-salvar-horas">Salvar horas</button>' +
      '<div class="row-between mb-16"><h4 style="margin:0">Status rápido</h4></div>' +
      '<div class="row gap-8 wrap">' +
        botaoStatus('em_andamento', '▶ Iniciar execução') +
        botaoStatus('pausado', '⏸ Pausar') +
        botaoStatus('concluido', '✓ Concluir') +
        botaoStatus('cancelado', '✕ Cancelar') +
      '</div>';

    document.getElementById('btn-salvar-horas').addEventListener('click', function () {
      var horas = Number(document.getElementById('horas-trabalhadas').value) || 0;
      ServiceService.atualizar(servico.id, { horasTrabalhadas: horas });
      recarregar();
      renderTudo();
      showToast('Horas trabalhadas atualizadas.', 'success');
    });

    Utils.$$('[data-status-rapido]', alvo).forEach(function (b) {
      b.addEventListener('click', function () {
        ServiceService.alterarStatus(servico.id, b.dataset.statusRapido);
        recarregar();
        renderTudo();
        showToast('Status atualizado.', 'success');
      });
    });
  }

  function botaoStatus(status, label) {
    var classe = status === 'cancelado' ? 'btn-danger' : (status === 'concluido' ? 'btn-primary' : 'btn-secondary');
    return '<button class="btn ' + classe + ' btn-sm" type="button" data-status-rapido="' + status + '">' + label + '</button>';
  }

  /* ---------- Documentos ---------- */
  function renderDocumentos(alvo) {
    var links = [];
    if (servico.orcamentoId) links.push({ icone: '📑', nome: 'Orçamento de origem', href: 'orcamento-detalhe.html?id=' + servico.orcamentoId });
    if (servico.contratoId) links.push({ icone: '📄', nome: 'Contrato vinculado', href: 'contrato-detalhe.html?id=' + servico.contratoId });

    if (!links.length) {
      alvo.innerHTML = Components.emptyState({ icone: '📄', titulo: 'Nenhum documento vinculado', texto: 'Este serviço foi criado sem orçamento ou contrato de origem.' });
      return;
    }

    alvo.innerHTML = links.map(function (l) {
      return '<a href="' + l.href + '" class="quick-action mb-16" style="max-width:360px">' +
        '<span class="qa-icon">' + l.icone + '</span><span>' + l.nome + '<span class="qa-sub">Abrir e imprimir</span></span></a>';
    }).join('');
  }

  /* ---------- Agenda ---------- */
  function renderAgendaAba(alvo) {
    alvo.innerHTML =
      '<div class="field-row" style="max-width:600px">' +
        '<div class="field"><label>Data</label><input class="input" type="date" id="e-data" value="' + servico.data + '"></div>' +
        '<div class="field"><label>Horário</label><input class="input" type="time" id="e-hora" value="' + servico.hora + '"></div>' +
      '</div>' +
      '<div class="field-row" style="max-width:600px">' +
        '<div class="field"><label>Duração (horas)</label><input class="input" type="number" min="1" id="e-duracao" value="' + servico.duracaoHoras + '"></div>' +
        '<div class="field"><label>Local</label><input class="input" id="e-local" value="' + Utils.escapeHtml(servico.local || '') + '"></div>' +
      '</div>' +
      '<div id="e-aviso"></div>' +
      '<button class="btn btn-primary btn-sm mt-8" id="btn-salvar-agenda">Salvar alterações na agenda</button>' +
      '<a href="agenda.html" class="btn btn-ghost btn-sm mt-8" style="margin-left:8px">Ver na agenda</a>';

    document.getElementById('btn-salvar-agenda').addEventListener('click', function () {
      var data = document.getElementById('e-data').value;
      var hora = document.getElementById('e-hora').value;
      var conflito = ScheduleService.temConflito(data, hora, servico.id);
      var avisoEl = document.getElementById('e-aviso');

      if (conflito && !this.dataset.confirmado) {
        avisoEl.innerHTML = '<div class="alert alert-danger mt-16"><span class="alert-icon">⚠️</span><div><strong>Conflito de agenda</strong><p>Já existe outro serviço nesse dia e horário. Clique novamente para confirmar mesmo assim.</p></div></div>';
        this.dataset.confirmado = '1';
        return;
      }

      ServiceService.atualizar(servico.id, {
        data: data, hora: hora,
        duracaoHoras: Number(document.getElementById('e-duracao').value) || 1,
        local: document.getElementById('e-local').value.trim()
      });
      recarregar();
      renderTudo();
      showToast('Agenda atualizada.', 'success');
    });
  }

  /* ---------- Pagamentos ---------- */
  function renderPagamentos(alvo) {
    var pagamentos = PaymentService.porServico(servico.id);

    if (!pagamentos.length) {
      alvo.innerHTML = Components.emptyState({ icone: '💳', titulo: 'Nenhum pagamento vinculado', texto: 'Este serviço não possui cobrança registrada.' });
      return;
    }

    alvo.innerHTML = pagamentos.map(function (p) {
      var restante = p.valorTotal - p.valorRecebido;
      return '<div class="card mb-16"><div class="card-body">' +
        '<div class="row-between mb-16">' +
          '<div><strong>' + Utils.formatBRL(p.valorTotal) + '</strong><span class="small muted"> · vencimento ' + Utils.formatDate(p.dataPrevista) + '</span></div>' +
          Components.badge(Data.STATUS_PAGAMENTO, p.status) +
        '</div>' +
        '<div class="progress"><i style="width:' + Math.min(100, (p.valorRecebido / p.valorTotal) * 100).toFixed(0) + '%"></i></div>' +
        '<p class="tiny muted mt-8">Recebido ' + Utils.formatBRL(p.valorRecebido) + ' de ' + Utils.formatBRL(p.valorTotal) + '</p>' +
        (p.status !== 'pago' ? '<button class="btn btn-primary btn-sm" data-registrar="' + p.id + '" data-restante="' + restante + '">Registrar recebimento</button>' : '') +
      '</div></div>';
    }).join('');

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
            renderTudo();
            showToast('Recebimento registrado.', 'success');
          }
        }
      ]
    });
    var campo = document.getElementById('r-valor');
    campo.addEventListener('input', function () { campo.value = Utils.mascaraMoeda(campo.value); });
  }

  /* ---------- Rentabilidade ---------- */
  function renderRentabilidade(alvo) {
    var rent = ServiceService.rentabilidade(servico);
    alvo.innerHTML =
      '<div class="grid grid-2 mb-24">' +
        '<div class="mini-stat"><span class="muted">Valor contratado</span><span class="ms-value">' + Utils.formatBRL(rent.valor) + '</span></div>' +
        '<div class="mini-stat"><span class="muted">Margem atual</span><span class="ms-value">' + Utils.formatPercent(rent.margem) + '</span></div>' +
        '<div class="mini-stat"><span class="muted">Custo previsto</span><span class="ms-value">' + Utils.formatBRL(rent.custoPrevisto) + '</span></div>' +
        '<div class="mini-stat"><span class="muted">Custo real</span><span class="ms-value ' + (rent.acimaDoPrevisto ? 'neg' : '') + '">' + Utils.formatBRL(rent.custoReal) + '</span></div>' +
        '<div class="mini-stat"><span class="muted">Lucro previsto</span><span class="ms-value">' + Utils.formatBRL(rent.lucroPrevisto) + '</span></div>' +
        '<div class="mini-stat"><span class="muted">Lucro atual</span><span class="ms-value">' + Utils.formatBRL(rent.lucroAtual) + '</span></div>' +
        '<div class="mini-stat"><span class="muted">Horas trabalhadas</span><span class="ms-value">' + servico.horasTrabalhadas + 'h</span></div>' +
        '<div class="mini-stat"><span class="muted">Lucro por hora</span><span class="ms-value">' + Utils.formatBRL(rent.lucroPorHora) + '</span></div>' +
      '</div>' +
      (rent.acimaDoPrevisto ? '<div class="alert alert-warning mb-16"><span class="alert-icon">⚠️</span><div><strong>Os custos deste serviço estão acima do previsto.</strong>' +
        '<p>Diferença de ' + Utils.formatBRL(rent.diferencaCusto) + ' em relação ao planejado.</p></div></div>' : '') +
      '<h4>Previsto x Realizado</h4>' +
      '<table class="table"><thead><tr><th></th><th class="num">Previsto</th><th class="num">Real</th></tr></thead><tbody>' +
        '<tr><td>Custo total</td><td class="num">' + Utils.formatBRL(rent.custoPrevisto) + '</td><td class="num">' + Utils.formatBRL(rent.custoReal) + '</td></tr>' +
        '<tr><td>Lucro</td><td class="num">' + Utils.formatBRL(rent.lucroPrevisto) + '</td><td class="num">' + Utils.formatBRL(rent.lucroAtual) + '</td></tr>' +
      '</tbody></table>';
  }
});
