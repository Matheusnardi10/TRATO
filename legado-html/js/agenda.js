/* ============================================================
   TRATO — agenda.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  var usuario = App.iniciarPainel({ pagina: 'agenda', titulo: 'Agenda', subtitulo: 'Seus compromissos e o impacto financeiro de cada dia.' });
  if (!usuario) return;

  var DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  var MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  var estado = { view: 'mes', cursor: Utils.toDate(Utils.hojeISO()) };

  renderAlertaConflitos();
  render();

  document.getElementById('nav-anterior').addEventListener('click', function () { navegar(-1); });
  document.getElementById('nav-proximo').addEventListener('click', function () { navegar(1); });
  document.getElementById('nav-hoje').addEventListener('click', function () { estado.cursor = Utils.toDate(Utils.hojeISO()); render(); });

  Utils.$$('.agenda-views [data-view]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      Utils.$$('.agenda-views [data-view]').forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      estado.view = chip.dataset.view;
      render();
    });
  });

  document.getElementById('btn-novo-agendamento').addEventListener('click', function () { abrirNovoAgendamento(); });
  if (Utils.param('novo') === '1') abrirNovoAgendamento();

  /* ---------- Navegação de datas ---------- */
  function navegar(direcao) {
    var d = new Date(estado.cursor);
    if (estado.view === 'mes') d.setMonth(d.getMonth() + direcao);
    else if (estado.view === 'semana') d.setDate(d.getDate() + direcao * 7);
    else d.setDate(d.getDate() + direcao);
    estado.cursor = d;
    render();
  }

  function irParaDia(iso) {
    estado.cursor = Utils.toDate(iso);
    estado.view = 'dia';
    Utils.$$('.agenda-views [data-view]').forEach(function (c) { c.classList.toggle('active', c.dataset.view === 'dia'); });
    render();
  }

  /* ---------- Conflitos (alerta fixo no topo) ---------- */
  function renderAlertaConflitos() {
    var conflitos = ScheduleService.conflitos();
    var alvo = document.getElementById('alerta-conflitos');
    if (!conflitos.length) { alvo.innerHTML = ''; return; }

    alvo.innerHTML = conflitos.map(function (par) {
      return '<div class="alert alert-danger"><span class="alert-icon">⚠️</span>' +
        '<div><strong>Conflito de agenda em ' + Utils.formatDate(par[0].data) + ' às ' + par[0].hora + '</strong>' +
        '<p>"' + Utils.escapeHtml(par[0].titulo) + '" e "' + Utils.escapeHtml(par[1].titulo) + '" estão marcados para o mesmo horário.</p></div>' +
        '<button class="alert-link" type="button" data-ver-dia="' + par[0].data + '">Ver o dia</button></div>';
    }).join('');

    Utils.$$('[data-ver-dia]', alvo).forEach(function (b) {
      b.addEventListener('click', function () { irParaDia(b.dataset.verDia); });
    });
  }

  /* ---------- Render geral ---------- */
  function render() {
    document.getElementById('agenda-titulo').textContent = tituloPeriodo();
    var alvo = document.getElementById('agenda-conteudo');
    if (estado.view === 'mes') alvo.innerHTML = '<div class="card"><div class="card-body"><div class="cal-grid" id="cal-grid"></div></div></div>';
    if (estado.view === 'semana') alvo.innerHTML = '<div class="week-grid" id="week-grid"></div>';
    if (estado.view === 'dia') alvo.innerHTML = '<div class="card"><div class="card-body" id="dia-conteudo"></div></div>';

    if (estado.view === 'mes') renderMes();
    if (estado.view === 'semana') renderSemana();
    if (estado.view === 'dia') renderDia();
  }

  function tituloPeriodo() {
    if (estado.view === 'mes') return MESES[estado.cursor.getMonth()] + ' de ' + estado.cursor.getFullYear();
    if (estado.view === 'dia') return Utils.formatDayFull(Utils.toISO(estado.cursor));
    var inicio = inicioDaSemana(estado.cursor);
    var fim = new Date(inicio); fim.setDate(fim.getDate() + 6);
    return Utils.formatDateLong(Utils.toISO(inicio)) + ' – ' + Utils.formatDateLong(Utils.toISO(fim));
  }

  function inicioDaSemana(data) {
    var d = new Date(data);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  function servicosDoDia(iso) {
    return ServiceService.listar().filter(function (s) { return s.data === iso; })
      .sort(function (a, b) { return a.hora < b.hora ? -1 : 1; });
  }

  function diaTemConflito(iso) {
    var horarios = {};
    var conflito = false;
    servicosDoDia(iso).forEach(function (s) {
      if (s.status === 'cancelado') return;
      horarios[s.hora] = (horarios[s.hora] || 0) + 1;
      if (horarios[s.hora] > 1) conflito = true;
    });
    return conflito;
  }

  /* ---------- Visão mensal ---------- */
  function renderMes() {
    var ano = estado.cursor.getFullYear(), mes = estado.cursor.getMonth();
    var primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    var totalDias = new Date(ano, mes + 1, 0).getDate();
    var diasMesAnterior = new Date(ano, mes, 0).getDate();
    var hoje = Utils.hojeISO();

    var celulas = [];
    for (var i = primeiroDiaSemana - 1; i >= 0; i--) {
      celulas.push({ dia: diasMesAnterior - i, outroMes: true, mesOffset: -1 });
    }
    for (var d = 1; d <= totalDias; d++) celulas.push({ dia: d, outroMes: false, mesOffset: 0 });
    while (celulas.length % 7 !== 0) celulas.push({ dia: celulas.length, outroMes: true, mesOffset: 1 });

    var html = DIAS_SEMANA.map(function (nome) { return '<div class="cal-weekday">' + nome + '</div>'; }).join('');

    html += celulas.map(function (cel) {
      var mesReal = mes + cel.mesOffset;
      var iso = Utils.toISO(new Date(ano, mesReal, cel.dia));
      var servicos = servicosDoDia(iso).filter(function (s) { return s.status !== 'cancelado'; });
      var temConflito = diaTemConflito(iso);
      var classe = 'cal-day' + (cel.outroMes ? ' outro-mes' : '') + (iso === hoje ? ' hoje' : '') + (temConflito ? ' tem-conflito' : '');

      var chips = servicos.slice(0, 3).map(function (s) {
        return '<span class="cal-chip' + (temConflito ? ' conflito' : '') + '">' + s.hora + ' ' + Utils.escapeHtml(s.titulo) + '</span>';
      }).join('');
      var mais = servicos.length > 3 ? '<span class="cal-mais">+' + (servicos.length - 3) + ' mais</span>' : '';

      return '<div class="' + classe + '" data-dia="' + iso + '"><span class="cal-day-num">' + cel.dia + '</span>' + chips + mais + '</div>';
    }).join('');

    var grid = document.getElementById('cal-grid');
    grid.innerHTML = html;
    Utils.$$('[data-dia]', grid).forEach(function (cel) {
      cel.addEventListener('click', function () { irParaDia(cel.dataset.dia); });
    });
  }

  /* ---------- Visão semanal ---------- */
  function renderSemana() {
    var inicio = inicioDaSemana(estado.cursor);
    var hoje = Utils.hojeISO();
    var html = '';

    for (var i = 0; i < 7; i++) {
      var data = new Date(inicio); data.setDate(data.getDate() + i);
      var iso = Utils.toISO(data);
      var servicos = servicosDoDia(iso).filter(function (s) { return s.status !== 'cancelado'; });
      var temConflito = diaTemConflito(iso);

      html += '<div class="week-day' + (iso === hoje ? ' hoje' : '') + '" data-dia="' + iso + '">' +
        '<div class="week-day-head">' + DIAS_SEMANA[i] + '</div>' +
        '<div class="week-day-num">' + data.getDate() + '</div>' +
        servicos.map(function (s) {
          return '<span class="cal-chip' + (temConflito ? ' conflito' : '') + '" style="display:block;margin-bottom:4px">' + s.hora + ' ' + Utils.escapeHtml(s.titulo) + '</span>';
        }).join('') +
        '</div>';
    }

    var grid = document.getElementById('week-grid');
    grid.innerHTML = html;
    Utils.$$('[data-dia]', grid).forEach(function (cel) {
      cel.addEventListener('click', function () { irParaDia(cel.dataset.dia); });
    });
  }

  /* ---------- Visão diária ---------- */
  function renderDia() {
    var iso = Utils.toISO(estado.cursor);
    var servicos = servicosDoDia(iso);
    var alvo = document.getElementById('dia-conteudo');

    if (!servicos.length) {
      alvo.innerHTML = Components.emptyState({
        icone: '📅', titulo: 'Nenhum serviço neste dia', texto: 'Que tal agendar um novo serviço para esta data?',
        acao: '+ Novo agendamento', acaoId: 'btn-vazio-dia'
      });
      var b = document.getElementById('btn-vazio-dia');
      if (b) b.addEventListener('click', function () { abrirNovoAgendamento(iso); });
      return;
    }

    var valorDia = servicos.reduce(function (s, sv) { return s + (sv.status !== 'cancelado' ? sv.valor : 0); }, 0);
    var lucroDia = servicos.reduce(function (s, sv) { return s + (sv.status !== 'cancelado' ? Calc.lucro(sv.valor, sv.custoPrevisto) : 0); }, 0);
    var conflito = diaTemConflito(iso);

    alvo.innerHTML =
      (conflito ? '<div class="alert alert-danger mb-16"><span class="alert-icon">⚠️</span><div><strong>Conflito de agenda</strong><p>Mais de um serviço está marcado para o mesmo horário neste dia.</p></div></div>' : '') +
      '<div class="row-between mb-16">' +
        '<span class="small muted">' + servicos.length + ' serviço(s) neste dia</span>' +
        '<span class="small">Valor total <strong>' + Utils.formatBRL(valorDia) + '</strong> · lucro estimado <strong class="pos">' + Utils.formatBRL(lucroDia) + '</strong></span>' +
      '</div>' +
      servicos.map(function (s) {
        var conflitoItem = conflito && servicos.some(function (o) { return o.id !== s.id && o.hora === s.hora && o.status !== 'cancelado'; });
        return '<div class="agenda-item' + (conflitoItem ? '' : '') + '" style="' + (conflitoItem ? 'border-color:var(--danger)' : '') + '">' +
          '<span class="hour">' + s.hora + '</span>' +
          '<div class="info"><strong>' + Utils.escapeHtml(s.titulo) + '</strong>' +
          '<span>' + Utils.escapeHtml(ClientService.nome(s.clienteId)) + ' · ' + s.duracaoHoras + 'h' + (s.local ? ' · ' + Utils.escapeHtml(s.local) : '') + '</span></div>' +
          '<div class="valores"><div class="v">' + Utils.formatBRL(s.valor) + '</div><div class="muted">lucro ' + Utils.formatBRL(Calc.lucro(s.valor, s.custoPrevisto)) + '</div></div>' +
          '<div style="margin-left:12px">' + Components.badge(Data.STATUS_SERVICO, s.status) + '</div>' +
          '<a href="servico-detalhe.html?id=' + s.id + '" class="btn btn-ghost btn-sm" style="margin-left:8px">Abrir</a>' +
        '</div>';
      }).join('') +
      '<button class="btn btn-secondary btn-sm mt-16" type="button" id="btn-add-dia">+ Adicionar serviço neste dia</button>';

    var btnAdd = document.getElementById('btn-add-dia');
    if (btnAdd) btnAdd.addEventListener('click', function () { abrirNovoAgendamento(iso); });
  }

  /* ---------- Novo agendamento ---------- */
  function abrirNovoAgendamento(isoSugerido) {
    var clientes = ClientService.listar();

    var overlay = openModal({
      titulo: 'Novo agendamento',
      subtitulo: 'Cria um serviço e adiciona à agenda.',
      tamanho: 'lg',
      conteudo:
        '<div class="field-row">' +
          '<div class="field"><label>Cliente <span class="req">*</span></label><select class="select" id="ag-cliente">' +
            '<option value="">Selecione...</option>' +
            clientes.map(function (c) { return '<option value="' + c.id + '">' + Utils.escapeHtml(c.nome) + '</option>'; }).join('') +
          '</select><span class="field-error"></span></div>' +
          '<div class="field"><label>Vincular a um contrato (opcional)</label><select class="select" id="ag-contrato"><option value="">Nenhum</option></select></div>' +
        '</div>' +
        '<div class="field"><label>Título do serviço <span class="req">*</span></label><input class="input" id="ag-titulo" placeholder="Ex.: Ensaio externo"><span class="field-error"></span></div>' +
        '<div class="field-row">' +
          '<div class="field"><label>Data <span class="req">*</span></label><input class="input" type="date" id="ag-data" value="' + (isoSugerido || Utils.hojeISO()) + '"><span class="field-error"></span></div>' +
          '<div class="field"><label>Horário <span class="req">*</span></label><input class="input" type="time" id="ag-hora" value="09:00"><span class="field-error"></span></div>' +
        '</div>' +
        '<div class="field-row">' +
          '<div class="field"><label>Duração (horas)</label><input class="input" type="number" min="1" id="ag-duracao" value="2"></div>' +
          '<div class="field"><label>Local</label><input class="input" id="ag-local" placeholder="Endereço do serviço"></div>' +
        '</div>' +
        '<div class="field-row">' +
          '<div class="field"><label>Valor</label><div class="input-group"><span class="prefix">R$</span><input class="input" id="ag-valor" placeholder="0,00"></div></div>' +
          '<div class="field"><label>Custo previsto</label><div class="input-group"><span class="prefix">R$</span><input class="input" id="ag-custo" placeholder="0,00"></div></div>' +
        '</div>' +
        '<div id="ag-aviso-conflito"></div>',
      botoes: [
        { texto: 'Cancelar', classe: 'btn-secondary', fechar: true },
        {
          texto: 'Criar agendamento', classe: 'btn-primary', onClick: function (ov) { return criarAgendamento(ov); }
        }
      ]
    });

    Utils.$$('[id^="ag-valor"], [id^="ag-custo"]', overlay).forEach(function (campo) {
      campo.addEventListener('input', function () { campo.value = Utils.mascaraMoeda(campo.value); });
    });

    var selectCliente = overlay.querySelector('#ag-cliente');
    var selectContrato = overlay.querySelector('#ag-contrato');
    selectCliente.addEventListener('change', function () {
      var contratosCliente = ContractService.listar().filter(function (c) {
        return c.clienteId === selectCliente.value && (c.status === 'ativo' || c.status === 'aguardando');
      });
      selectContrato.innerHTML = '<option value="">Nenhum</option>' + contratosCliente.map(function (c) {
        return '<option value="' + c.id + '">#' + c.numero + ' — ' + Utils.escapeHtml(c.titulo) + '</option>';
      }).join('');
    });
    selectContrato.addEventListener('change', function () {
      if (!selectContrato.value) return;
      var contrato = ContractService.buscar(selectContrato.value);
      overlay.querySelector('#ag-titulo').value = contrato.titulo;
      overlay.querySelector('#ag-valor').value = Utils.mascaraMoeda(String(Math.round(ContractService.valorTotal(contrato) * 100)));
    });

    function criarAgendamento(overlay) {
      var cliente = overlay.querySelector('#ag-cliente');
      var titulo = overlay.querySelector('#ag-titulo');
      var data = overlay.querySelector('#ag-data');
      var hora = overlay.querySelector('#ag-hora');
      var ok = true;

      [cliente, titulo, data, hora].forEach(function (c) { Utils.setErro(c, null); });
      if (!cliente.value) { Utils.setErro(cliente, 'Selecione um cliente.'); ok = false; }
      if (!Utils.Validar.obrigatorio(titulo.value)) { Utils.setErro(titulo, 'Campo obrigatório.'); ok = false; }
      if (!data.value) { Utils.setErro(data, 'Campo obrigatório.'); ok = false; }
      if (!hora.value) { Utils.setErro(hora, 'Campo obrigatório.'); ok = false; }
      if (!ok) return false;

      if (ScheduleService.temConflito(data.value, hora.value) && !overlay.dataset.confirmado) {
        overlay.querySelector('#ag-aviso-conflito').innerHTML =
          '<div class="alert alert-danger mt-16"><span class="alert-icon">⚠️</span><div><strong>Conflito de agenda</strong>' +
          '<p>Já existe um serviço neste dia e horário. Clique novamente em "Criar agendamento" para confirmar mesmo assim.</p></div></div>';
        overlay.dataset.confirmado = '1';
        return false;
      }

      var contratoSelecionado = overlay.querySelector('#ag-contrato').value || null;
      var servico = ServiceService.criar({
        clienteId: cliente.value,
        contratoId: contratoSelecionado,
        orcamentoId: contratoSelecionado ? ContractService.buscar(contratoSelecionado).orcamentoId : null,
        titulo: titulo.value.trim(),
        nicho: usuario.nicho,
        data: data.value,
        hora: hora.value,
        duracaoHoras: Number(overlay.querySelector('#ag-duracao').value) || 1,
        local: overlay.querySelector('#ag-local').value.trim(),
        valor: Utils.parseBRL(overlay.querySelector('#ag-valor').value),
        custoPrevisto: Utils.parseBRL(overlay.querySelector('#ag-custo').value),
        status: 'agendado'
      });

      showToast('Serviço #' + servico.numero + ' agendado.', 'success');
      estado.cursor = Utils.toDate(servico.data);
      renderAlertaConflitos();
      render();
    }
  }
});
