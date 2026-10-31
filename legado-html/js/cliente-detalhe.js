/* ============================================================
   TRATO — cliente-detalhe.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  var usuario = App.iniciarPainel({ pagina: 'clientes' });
  if (!usuario) return;

  var id = Utils.param('id');
  var cliente = id && ClientService.buscar(id);

  if (!cliente) {
    document.querySelector('.page').innerHTML = Components.emptyState({
      icone: '🚫', titulo: 'Cliente não encontrado', texto: 'Ele pode ter sido excluído.'
    });
    return;
  }

  var ABAS = [
    { id: 'orcamentos', nome: 'Orçamentos' },
    { id: 'contratos', nome: 'Contratos' },
    { id: 'servicos', nome: 'Serviços' },
    { id: 'pagamentos', nome: 'Pagamentos' }
  ];
  var abaAtiva = 'orcamentos';

  renderCabecalho();
  renderResumo();
  renderDados();
  renderTabs();
  renderConteudo();

  document.getElementById('btn-orcamento').addEventListener('click', function () {
    window.location.href = 'orcamento-novo.html?clienteId=' + cliente.id;
  });

  document.getElementById('btn-editar').addEventListener('click', abrirEdicao);

  /* ---------- Cabeçalho ---------- */
  function renderCabecalho() {
    document.title = cliente.nome + ' — Trato';
    document.getElementById('cliente-avatar').textContent = Utils.iniciais(cliente.nome);
    document.getElementById('cliente-nome').textContent = cliente.nome;
    document.getElementById('cliente-sub').innerHTML = Components.badge(
      { ativo: { label: 'Ativo', classe: 'badge-success' }, inativo: { label: 'Inativo', classe: 'badge-neutral' } },
      cliente.status
    ) + ' <span class="muted">· cliente desde ' + Utils.formatDate(cliente.criadoEm) + '</span>';
  }

  /* ---------- Resumo ---------- */
  function renderResumo() {
    var resumo = ClientService.resumo(cliente.id);
    document.getElementById('resumo-cliente').innerHTML =
      '<div class="grid grid-3">' +
        '<div class="kpi is-count"><div class="kpi-label">Serviços</div><div class="kpi-value">' + resumo.quantidade + '</div></div>' +
        '<div class="kpi is-revenue"><div class="kpi-label">Valor movimentado</div><div class="kpi-value">' + Utils.formatBRL(resumo.total) + '</div></div>' +
        '<div class="kpi is-cost"><div class="kpi-label">Último serviço</div><div class="kpi-value" style="font-size:16px">' +
          (resumo.ultimoServico ? Utils.formatDate(resumo.ultimoServico.data) : '—') + '</div></div>' +
      '</div>';
  }

  /* ---------- Dados de contato ---------- */
  function renderDados() {
    document.getElementById('dados-cliente').innerHTML =
      linhaDado('Telefone', cliente.telefone) +
      linhaDado('E-mail', cliente.email) +
      linhaDado('CPF/CNPJ', cliente.documento) +
      linhaDado('Endereço', cliente.endereco);

    document.getElementById('observacoes-cliente').innerHTML =
      '<p class="small mb-0">' + (cliente.observacoes ? Utils.escapeHtml(cliente.observacoes) : '<span class="muted">Nenhuma observação registrada.</span>') + '</p>';
  }

  function linhaDado(rotulo, valor) {
    return '<div class="mini-stat"><span class="muted">' + rotulo + '</span><span class="ms-value" style="font-weight:500">' +
      (valor ? Utils.escapeHtml(valor) : '—') + '</span></div>';
  }

  /* ---------- Abas ---------- */
  function renderTabs() {
    var historico = ClientService.historico(cliente.id);
    document.getElementById('tabs-historico').innerHTML = ABAS.map(function (a) {
      var qtd = historico[a.id] ? historico[a.id].length : 0;
      return '<button class="tab' + (a.id === abaAtiva ? ' active' : '') + '" data-tab="' + a.id + '">' + a.nome + ' (' + qtd + ')</button>';
    }).join('');

    Utils.$$('[data-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () {
        abaAtiva = tab.dataset.tab;
        renderTabs();
        renderConteudo();
      });
    });
  }

  /* ---------- Conteúdo de cada aba ---------- */
  function renderConteudo() {
    var historico = ClientService.historico(cliente.id);
    var alvo = document.getElementById('conteudo-historico');
    var lista = historico[abaAtiva] || [];

    if (!lista.length) {
      alvo.innerHTML = Components.emptyState({ icone: '📭', titulo: 'Nada por aqui ainda', texto: 'Quando existir, aparece nesta aba.' });
      return;
    }

    if (abaAtiva === 'orcamentos') {
      alvo.innerHTML = '<table class="table"><thead><tr><th>Número</th><th>Título</th><th>Data</th><th class="num">Valor</th><th>Status</th></tr></thead><tbody>' +
        lista.map(function (o) {
          return '<tr class="clickable" data-href="orcamento-detalhe.html?id=' + o.id + '">' +
            '<td class="mono">#' + o.numero + '</td><td class="strong">' + Utils.escapeHtml(o.titulo) + '</td>' +
            '<td class="small">' + Utils.formatDate(o.criadoEm) + '</td><td class="num">' + Utils.formatBRL(o.valor) + '</td>' +
            '<td>' + Components.badge(Data.STATUS_ORCAMENTO, o.status) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }

    if (abaAtiva === 'contratos') {
      alvo.innerHTML = '<table class="table"><thead><tr><th>Número</th><th>Título</th><th>Início</th><th class="num">Valor</th><th>Status</th></tr></thead><tbody>' +
        lista.map(function (c) {
          return '<tr class="clickable" data-href="contrato-detalhe.html?id=' + c.id + '">' +
            '<td class="mono">#' + c.numero + '</td><td class="strong">' + Utils.escapeHtml(c.titulo) + '</td>' +
            '<td class="small">' + Utils.formatDate(c.dataInicio) + '</td><td class="num">' + Utils.formatBRL(ContractService.valorTotal(c)) + '</td>' +
            '<td>' + Components.badge(Data.STATUS_CONTRATO, c.status) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }

    if (abaAtiva === 'servicos') {
      alvo.innerHTML = '<table class="table"><thead><tr><th>Número</th><th>Serviço</th><th>Data</th><th class="num">Valor</th><th>Status</th></tr></thead><tbody>' +
        lista.map(function (s) {
          return '<tr class="clickable" data-href="servico-detalhe.html?id=' + s.id + '">' +
            '<td class="mono">#' + s.numero + '</td><td class="strong">' + Utils.escapeHtml(s.titulo) + '</td>' +
            '<td class="small">' + Utils.formatDate(s.data) + '</td><td class="num">' + Utils.formatBRL(s.valor) + '</td>' +
            '<td>' + Components.badge(Data.STATUS_SERVICO, s.status) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }

    if (abaAtiva === 'pagamentos') {
      alvo.innerHTML = '<table class="table"><thead><tr><th>Vencimento</th><th class="num">Total</th><th class="num">Recebido</th><th>Status</th></tr></thead><tbody>' +
        lista.map(function (p) {
          return '<tr><td class="small">' + Utils.formatDate(p.dataPrevista) + '</td>' +
            '<td class="num">' + Utils.formatBRL(p.valorTotal) + '</td>' +
            '<td class="num">' + Utils.formatBRL(p.valorRecebido) + '</td>' +
            '<td>' + Components.badge(Data.STATUS_PAGAMENTO, p.status) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }

    Utils.$$('[data-href]', alvo).forEach(function (linha) {
      linha.addEventListener('click', function () { window.location.href = linha.dataset.href; });
    });
  }

  /* ---------- Edição ---------- */
  function abrirEdicao() {
    openModal({
      titulo: 'Editar cliente',
      tamanho: 'lg',
      conteudo:
        '<form id="form-editar-cliente">' +
          '<div class="field-row">' +
            '<div class="field"><label>Nome completo</label><input class="input" id="e-nome" value="' + Utils.escapeHtml(cliente.nome) + '"></div>' +
            '<div class="field"><label>Telefone</label><input class="input" id="e-telefone" value="' + Utils.escapeHtml(cliente.telefone || '') + '"></div>' +
          '</div>' +
          '<div class="field-row">' +
            '<div class="field"><label>E-mail</label><input class="input" id="e-email" value="' + Utils.escapeHtml(cliente.email || '') + '"></div>' +
            '<div class="field"><label>CPF/CNPJ</label><input class="input" id="e-documento" value="' + Utils.escapeHtml(cliente.documento || '') + '"></div>' +
          '</div>' +
          '<div class="field"><label>Endereço</label><input class="input" id="e-endereco" value="' + Utils.escapeHtml(cliente.endereco || '') + '"></div>' +
          '<div class="field"><label>Status</label><select class="select" id="e-status">' +
            '<option value="ativo"' + (cliente.status === 'ativo' ? ' selected' : '') + '>Ativo</option>' +
            '<option value="inativo"' + (cliente.status === 'inativo' ? ' selected' : '') + '>Inativo</option>' +
          '</select></div>' +
          '<div class="field"><label>Observações</label><textarea class="textarea" id="e-observacoes">' + Utils.escapeHtml(cliente.observacoes || '') + '</textarea></div>' +
        '</form>',
      botoes: [
        { texto: 'Cancelar', classe: 'btn-secondary', fechar: true },
        {
          texto: 'Salvar alterações', classe: 'btn-primary', onClick: function (overlay) {
            ClientService.atualizar(cliente.id, {
              nome: overlay.querySelector('#e-nome').value.trim(),
              telefone: overlay.querySelector('#e-telefone').value.trim(),
              email: overlay.querySelector('#e-email').value.trim(),
              documento: overlay.querySelector('#e-documento').value.trim(),
              endereco: overlay.querySelector('#e-endereco').value.trim(),
              status: overlay.querySelector('#e-status').value,
              observacoes: overlay.querySelector('#e-observacoes').value.trim()
            });
            showToast('Cliente atualizado.', 'success');
            setTimeout(function () { window.location.reload(); }, 300);
          }
        }
      ]
    });
  }
});
