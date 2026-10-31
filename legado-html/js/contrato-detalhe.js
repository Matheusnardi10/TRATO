/* ============================================================
   TRATO — contrato-detalhe.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  var usuario = App.iniciarPainel({ pagina: 'contratos' });
  if (!usuario) return;

  var id = Utils.param('id');
  var contrato = id && ContractService.buscar(id);
  var editandoClausulas = false;

  var TIPOS_ADITIVO = {
    data: 'Alteração de data', valor: 'Alteração de valor', prazo: 'Alteração de prazo',
    servico: 'Inclusão de serviço', outras: 'Outras condições'
  };

  if (!contrato) {
    document.querySelector('.page').innerHTML = Components.emptyState({ icone: '🚫', titulo: 'Contrato não encontrado', texto: 'Ele pode ter sido excluído.' });
    return;
  }

  document.title = 'Contrato #' + contrato.numero + ' — Trato';

  renderFaixaStatus();
  renderAcoes();
  renderServicosVinculados();
  renderAditivos();
  renderDocumento();

  document.getElementById('btn-criar-servico').addEventListener('click', abrirCriarServico);
  document.getElementById('btn-novo-aditivo').addEventListener('click', abrirNovoAditivo);

  /* ---------- Recarrega o contrato após mudanças ---------- */
  function recarregar() { contrato = ContractService.buscar(id); }

  /* ---------- Faixa de status ---------- */
  function renderFaixaStatus() {
    var cliente = ClientService.buscar(contrato.clienteId);
    var mensagens = {
      rascunho: 'Contrato gerado a partir do orçamento. Revise e envie para o aceite do cliente.',
      aguardando: 'Aguardando o aceite de ' + (cliente ? cliente.nome : 'cliente') + '.',
      ativo: 'Contrato ativo — o serviço pode ser agendado e executado.',
      concluido: 'Contrato concluído.',
      cancelado: 'Este contrato foi cancelado.'
    };

    var acaoExtra = '';
    if (contrato.status === 'rascunho') acaoExtra = '<button class="btn btn-primary btn-sm" id="btn-enviar-aceite">Enviar para aceite</button>';
    else if (contrato.status === 'aguardando') acaoExtra = '<button class="btn btn-primary btn-sm" id="btn-marcar-aceito">Simular aceite do cliente</button>';
    else if (contrato.status === 'ativo') acaoExtra = '<button class="btn btn-secondary btn-sm" id="btn-concluir">Marcar como concluído</button>';

    document.getElementById('faixa-status').innerHTML =
      '<div class="card-body row-between wrap gap-16">' +
        '<div class="row gap-16">' + Components.badge(Data.STATUS_CONTRATO, contrato.status) +
          '<span class="small muted">' + mensagens[contrato.status] + '</span></div>' +
        '<div class="row gap-8">' + acaoExtra + '</div></div>';

    var b1 = document.getElementById('btn-enviar-aceite');
    if (b1) b1.addEventListener('click', function () { ContractService.enviarParaAceite(contrato.id); showToast('Contrato enviado para aceite.', 'success'); recarregarTudo(); });

    var b2 = document.getElementById('btn-marcar-aceito');
    if (b2) b2.addEventListener('click', function () { ContractService.marcarAceito(contrato.id); showToast('Contrato aceito pelo cliente!', 'success'); recarregarTudo(); });

    var b3 = document.getElementById('btn-concluir');
    if (b3) b3.addEventListener('click', function () { ContractService.concluir(contrato.id); showToast('Contrato marcado como concluído.', 'success'); recarregarTudo(); });
  }

  function recarregarTudo() {
    recarregar();
    renderFaixaStatus();
    renderAcoes();
    renderDocumento();
  }

  /* ---------- Ações do topo ---------- */
  function renderAcoes() {
    var botoes = '<button class="btn btn-secondary btn-sm" id="btn-pdf">🖨️ Gerar PDF</button>';
    botoes += '<button class="btn btn-secondary btn-sm" id="btn-editar-clausulas">' + (editandoClausulas ? '✓ Concluir edição' : '✏️ Editar cláusulas') + '</button>';
    if (contrato.orcamentoId) botoes += '<a class="btn btn-ghost btn-sm" href="orcamento-detalhe.html?id=' + contrato.orcamentoId + '">Ver orçamento de origem</a>';
    if (contrato.status !== 'cancelado' && contrato.status !== 'concluido') {
      botoes += '<button class="btn btn-danger btn-sm" id="btn-cancelar">Cancelar contrato</button>';
    }
    document.getElementById('acoes-contrato').innerHTML = botoes;

    document.getElementById('btn-pdf').addEventListener('click', function () { window.print(); });
    document.getElementById('btn-editar-clausulas').addEventListener('click', function () {
      if (editandoClausulas) salvarClausulas();
      editandoClausulas = !editandoClausulas;
      renderAcoes();
      renderDocumento();
    });
    var btnCancelar = document.getElementById('btn-cancelar');
    if (btnCancelar) btnCancelar.addEventListener('click', function () {
      openModal({
        titulo: 'Cancelar contrato',
        conteudo: '<p class="small">Tem certeza de que deseja cancelar este contrato? Os serviços vinculados não serão excluídos.</p>',
        botoes: [
          { texto: 'Voltar', classe: 'btn-secondary', fechar: true },
          { texto: 'Cancelar contrato', classe: 'btn-danger', onClick: function () { ContractService.cancelar(contrato.id); showToast('Contrato cancelado.', 'success'); recarregarTudo(); } }
        ]
      });
    });
  }

  function salvarClausulas() {
    var novas = Utils.$$('[data-clausula]').map(function (area, i) {
      return { numero: i + 1, titulo: contrato.clausulas[i].titulo, texto: area.value };
    });
    ContractService.atualizarClausulas(contrato.id, novas);
    recarregar();
    showToast('Cláusulas atualizadas.', 'success');
  }

  /* ---------- Serviços vinculados ---------- */
  function renderServicosVinculados() {
    var servicos = ServiceService.porContrato(contrato.id);
    var alvo = document.getElementById('servicos-vinculados');

    if (!servicos.length) {
      alvo.innerHTML = '<p class="small muted mb-0">Nenhum serviço criado a partir deste contrato ainda.</p>';
      return;
    }

    alvo.innerHTML = servicos.map(function (s) {
      return '<a href="servico-detalhe.html?id=' + s.id + '" class="quick-action" style="margin-bottom:8px">' +
        '<span class="qa-icon">🔨</span><span>#' + s.numero + ' ' + Utils.escapeHtml(s.titulo) +
        '<span class="qa-sub">' + Utils.formatDate(s.data) + ' às ' + s.hora + '</span></span></a>';
    }).join('');
  }

  /* ---------- Aditivos ---------- */

  function renderAditivos() {
    var alvo = document.getElementById('lista-aditivos');
    var aditivos = contrato.aditivos || [];

    if (!aditivos.length) {
      alvo.innerHTML = '<p class="small muted mb-0">Nenhum aditivo registrado.</p>';
      return;
    }

    alvo.innerHTML = aditivos.map(function (a) {
      return '<div class="alert alert-info">' +
        '<span class="alert-icon">➕</span>' +
        '<div><strong>Aditivo #' + a.numero + ' — ' + (TIPOS_ADITIVO[a.tipo] || 'Outras condições') + '</strong>' +
        '<p>' + Utils.escapeHtml(a.descricao) + (a.valor ? ' · ' + Utils.formatBRL(a.valor) : '') + ' · ' + Utils.formatDate(a.data) + '</p></div>' +
        '<button class="alert-link" type="button" data-remover="' + a.id + '">Remover</button>' +
      '</div>';
    }).join('');

    Utils.$$('[data-remover]', alvo).forEach(function (b) {
      b.addEventListener('click', function () {
        ContractService.removerAditivo(contrato.id, b.dataset.remover);
        recarregar();
        renderAditivos();
        renderDocumento();
        showToast('Aditivo removido.', 'success');
      });
    });
  }

  function abrirNovoAditivo() {
    openModal({
      titulo: 'Novo aditivo',
      subtitulo: 'Vincula uma alteração ao contrato #' + contrato.numero + '.',
      conteudo:
        '<div class="field"><label>Tipo de aditivo</label><select class="select" id="a-tipo">' +
          Object.keys(TIPOS_ADITIVO).map(function (k) { return '<option value="' + k + '">' + TIPOS_ADITIVO[k] + '</option>'; }).join('') +
        '</select></div>' +
        '<div class="field"><label>Descrição <span class="req">*</span></label><textarea class="textarea" id="a-descricao" placeholder="Ex.: Inclusão de álbum físico 30x30"></textarea><span class="field-error"></span></div>' +
        '<div class="field-row">' +
          '<div class="field"><label>Valor adicional (opcional)</label><div class="input-group"><span class="prefix">R$</span><input class="input" id="a-valor" placeholder="0,00"></div></div>' +
          '<div class="field"><label>Data</label><input class="input" type="date" id="a-data" value="' + Utils.hojeISO() + '"></div>' +
        '</div>' +
        '<div class="field"><label>Condições</label><textarea class="textarea" id="a-condicoes" placeholder="Ex.: Entrega em até 30 dias após a definição das fotos"></textarea></div>',
      botoes: [
        { texto: 'Cancelar', classe: 'btn-secondary', fechar: true },
        {
          texto: 'Adicionar aditivo', classe: 'btn-primary', onClick: function (overlay) {
            var descricao = overlay.querySelector('#a-descricao');
            if (!Utils.Validar.obrigatorio(descricao.value)) { Utils.setErro(descricao, 'Campo obrigatório.'); return false; }
            ContractService.adicionarAditivo(contrato.id, {
              tipo: overlay.querySelector('#a-tipo').value,
              descricao: descricao.value.trim(),
              valor: Utils.parseBRL(overlay.querySelector('#a-valor').value),
              data: overlay.querySelector('#a-data').value || Utils.hojeISO(),
              condicoes: overlay.querySelector('#a-condicoes').value.trim()
            });
            recarregar();
            renderAditivos();
            renderDocumento();
            showToast('Aditivo adicionado ao contrato.', 'success');
          }
        }
      ]
    });
  }

  /* ---------- Criar serviço a partir do contrato ---------- */
  function abrirCriarServico() {
    var orcamento = contrato.orcamentoId ? BudgetService.buscar(contrato.orcamentoId) : null;
    var custoPrevisto = orcamento ? Calc.custoTotal(orcamento.custos) : 0;

    openModal({
      titulo: 'Criar serviço',
      subtitulo: 'O serviço entra automaticamente na agenda.',
      conteudo:
        '<div class="field-row">' +
          '<div class="field"><label>Data <span class="req">*</span></label><input class="input" type="date" id="s-data" value="' + (contrato.dataInicio || Utils.hojeISO()) + '"><span class="field-error"></span></div>' +
          '<div class="field"><label>Horário <span class="req">*</span></label><input class="input" type="time" id="s-hora" value="09:00"><span class="field-error"></span></div>' +
        '</div>' +
        '<div class="field-row">' +
          '<div class="field"><label>Duração (horas)</label><input class="input" type="number" min="1" id="s-duracao" value="2"></div>' +
          '<div class="field"><label>Local / endereço</label><input class="input" id="s-local" placeholder="Onde o serviço acontece"></div>' +
        '</div>' +
        '<div class="field-row">' +
          '<div class="field"><label>Valor do serviço</label><div class="input-group"><span class="prefix">R$</span><input class="input" id="s-valor" value="' + Utils.mascaraMoeda(String(Math.round(ContractService.valorTotal(contrato) * 100))) + '"></div></div>' +
          '<div class="field"><label>Custo previsto</label><div class="input-group"><span class="prefix">R$</span><input class="input" id="s-custo" value="' + Utils.mascaraMoeda(String(Math.round(custoPrevisto * 100))) + '"></div></div>' +
        '</div>' +
        '<div id="aviso-conflito"></div>',
      botoes: [
        { texto: 'Cancelar', classe: 'btn-secondary', fechar: true },
        {
          texto: 'Criar serviço', classe: 'btn-primary', onClick: function (overlay) {
            var data = overlay.querySelector('#s-data');
            var hora = overlay.querySelector('#s-hora');
            if (!data.value) { Utils.setErro(data, 'Campo obrigatório.'); return false; }
            if (!hora.value) { Utils.setErro(hora, 'Campo obrigatório.'); return false; }

            if (ScheduleService.temConflito(data.value, hora.value)) {
              overlay.querySelector('#aviso-conflito').innerHTML =
                '<div class="alert alert-danger mt-16"><span class="alert-icon">⚠️</span><div><strong>Conflito de agenda</strong>' +
                '<p>Já existe um serviço agendado neste dia e horário. Ajuste a data/hora ou confirme mesmo assim clicando novamente em "Criar serviço".</p></div></div>';
              if (!overlay.dataset.confirmadoConflito) { overlay.dataset.confirmadoConflito = '1'; return false; }
            }

            var servico = ServiceService.criar({
              contratoId: contrato.id,
              orcamentoId: contrato.orcamentoId,
              clienteId: contrato.clienteId,
              titulo: contrato.titulo,
              nicho: contrato.nicho,
              data: data.value,
              hora: hora.value,
              duracaoHoras: Number(overlay.querySelector('#s-duracao').value) || 1,
              local: overlay.querySelector('#s-local').value.trim(),
              valor: Utils.parseBRL(overlay.querySelector('#s-valor').value),
              custoPrevisto: Utils.parseBRL(overlay.querySelector('#s-custo').value),
              status: 'agendado'
            });

            showToast('Serviço #' + servico.numero + ' criado e agendado.', 'success');
            renderServicosVinculados();
          }
        }
      ]
    });
  }

  /* ---------- Documento ---------- */
  function renderDocumento() {
    var cliente = ClientService.buscar(contrato.clienteId);
    var nicho = Data.getNicho(contrato.nicho);
    var negocio = usuario.negocio || {};
    var aditivos = contrato.aditivos || [];

    var linhasClausulas = contrato.clausulas.map(function (c, i) {
      if (editandoClausulas) {
        return '<div class="doc-clause"><h4>' + c.numero + '. ' + Utils.escapeHtml(c.titulo) + '</h4>' +
          '<textarea class="textarea" data-clausula="' + i + '" style="min-height:70px">' + Utils.escapeHtml(c.texto) + '</textarea></div>';
      }
      return '<div class="doc-clause"><h4>' + c.numero + '. ' + Utils.escapeHtml(c.titulo) + '</h4><p>' + Utils.escapeHtml(c.texto) + '</p></div>';
    }).join('');

    var linhasAditivos = aditivos.length ? '<div class="doc-section"><h4>Aditivos</h4>' +
      aditivos.map(function (a) {
        return '<div class="doc-clause"><h4>Aditivo #' + a.numero + ' — ' + (TIPOS_ADITIVO[a.tipo] || '') + '</h4>' +
          '<p>' + Utils.escapeHtml(a.descricao) + (a.valor ? ' — valor adicional de ' + Utils.formatBRL(a.valor) : '') + '.' +
          (a.condicoes ? ' ' + Utils.escapeHtml(a.condicoes) : '') + ' (' + Utils.formatDate(a.data) + ')</p></div>';
      }).join('') + '</div>' : '';

    document.getElementById('documento').innerHTML =
      '<div class="doc-head">' +
        '<div class="doc-brand">' + Components.logoSVG(30, '#12564E') +
          '<div><div class="doc-brand-name">' + Utils.escapeHtml(negocio.nomeProfissional || usuario.nomeProfissional) + '</div>' +
          '<div class="doc-brand-sub">' + Utils.escapeHtml(negocio.cidade || '') + '</div></div></div>' +
        '<div class="doc-meta"><span class="doc-numero">CONTRATO #' + contrato.numero + '</span>' +
          'Início: ' + Utils.formatDate(contrato.dataInicio) + '</div>' +
      '</div>' +

      '<div class="doc-parties">' +
        '<div class="doc-party"><h5>Contratado (prestador)</h5><p><strong>' + Utils.escapeHtml(negocio.nomeProfissional || usuario.nomeProfissional) + '</strong><br>' +
          Utils.escapeHtml(negocio.telefoneProfissional || usuario.telefone || '') + '<br>' + Utils.escapeHtml(negocio.emailProfissional || usuario.email) + '</p></div>' +
        '<div class="doc-party"><h5>Contratante (cliente)</h5><p><strong>' + Utils.escapeHtml(cliente ? cliente.nome : 'Cliente') + '</strong><br>' +
          Utils.escapeHtml(cliente ? cliente.telefone : '') + '<br>' + Utils.escapeHtml(cliente && cliente.documento || '') + '</p></div>' +
      '</div>' +

      '<div class="doc-section"><h4>' + Utils.escapeHtml(nicho.contrato.titulo) + '</h4>' +
        '<p><strong>Objeto:</strong> ' + Utils.escapeHtml(contrato.titulo) + ' · <strong>Valor total:</strong> ' + Utils.formatBRL(ContractService.valorTotal(contrato)) + '</p>' +
      '</div>' +

      '<div class="doc-section">' + linhasClausulas + '</div>' +
      linhasAditivos +

      '<div class="doc-signature">' +
        '<div class="line">' + Utils.escapeHtml(negocio.nomeProfissional || usuario.nomeProfissional) + '<br><span class="tiny muted">Contratado</span></div>' +
        '<div class="line">' + Utils.escapeHtml(cliente ? cliente.nome : 'Cliente') + '<br><span class="tiny muted">Contratante</span></div>' +
      '</div>' +

      '<div class="doc-footer-note">Este contrato é um modelo personalizável gerado pelo Trato e não substitui orientação jurídica.</div>';
  }
});
