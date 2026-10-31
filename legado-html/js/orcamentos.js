/* ============================================================
   TRATO — orcamentos.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  var usuario = App.iniciarPainel({ pagina: 'orcamentos', titulo: 'Orçamentos', subtitulo: 'Do primeiro contato até a aprovação.' });
  if (!usuario) return;

  var estado = { busca: '', status: 'todos' };
  render();

  document.getElementById('busca').addEventListener('input', Utils.debounce(function (e) {
    estado.busca = e.target.value.toLowerCase();
    render();
  }, 200));

  Utils.$$('.chip[data-status]').forEach(function (chip) {
    chip.addEventListener('click', function () {
      Utils.$$('.chip[data-status]').forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      estado.status = chip.dataset.status;
      render();
    });
  });

  function render() {
    var lista = BudgetService.listar().filter(function (o) {
      if (estado.status !== 'todos' && o.status !== estado.status) return false;
      if (!estado.busca) return true;
      var alvo = (o.titulo + ' ' + ClientService.nome(o.clienteId) + ' ' + o.numero).toLowerCase();
      return alvo.indexOf(estado.busca) !== -1;
    }).sort(function (a, b) { return a.criadoEm < b.criadoEm ? 1 : -1; });

    document.getElementById('contagem-orcamentos').textContent =
      lista.length + (lista.length === 1 ? ' orçamento encontrado' : ' orçamentos encontrados');

    var alvo = document.getElementById('tabela-orcamentos');

    if (!BudgetService.listar().length) {
      alvo.innerHTML = Components.emptyState({
        icone: '📑', titulo: 'Nenhum orçamento criado ainda',
        texto: 'Crie o primeiro orçamento para começar o fluxo de aprovação.',
        acao: '+ Novo orçamento', acaoId: 'btn-vazio'
      });
      var b = document.getElementById('btn-vazio');
      if (b) b.addEventListener('click', function () { window.location.href = 'orcamento-novo.html'; });
      return;
    }

    if (!lista.length) {
      alvo.innerHTML = Components.emptyState({ icone: '🔎', titulo: 'Nenhum orçamento encontrado', texto: 'Tente outro termo ou outro filtro.' });
      return;
    }

    alvo.innerHTML =
      '<table class="table"><thead><tr>' +
        '<th>Número</th><th>Cliente</th><th>Serviço</th><th>Data</th><th class="num">Valor</th><th>Status</th><th></th>' +
      '</tr></thead><tbody>' +
      lista.map(function (o) {
        return '<tr class="clickable" data-id="' + o.id + '">' +
          '<td class="mono">#' + o.numero + '</td>' +
          '<td><div class="cell-person"><span class="avatar">' + Utils.iniciais(ClientService.nome(o.clienteId)) + '</span>' +
            '<div><strong>' + Utils.escapeHtml(ClientService.nome(o.clienteId)) + '</strong></div></div></td>' +
          '<td>' + Utils.escapeHtml(o.titulo) + '</td>' +
          '<td class="small">' + Utils.formatDate(o.dataPrevista) + '</td>' +
          '<td class="num">' + Utils.formatBRL(o.valor) + '</td>' +
          '<td>' + Components.badge(Data.STATUS_ORCAMENTO, o.status) + '</td>' +
          '<td><div class="row-actions">' +
            '<button class="row-action" type="button" data-acao="duplicar" data-id="' + o.id + '" title="Duplicar">📋</button>' +
            (o.status === 'rascunho' ? '<button class="row-action" type="button" data-acao="excluir" data-id="' + o.id + '" title="Excluir">🗑️</button>' : '') +
          '</div></td></tr>';
      }).join('') + '</tbody></table>';

    Utils.$$('tr[data-id]', alvo).forEach(function (linha) {
      linha.addEventListener('click', function (e) {
        if (e.target.closest('[data-acao]')) return;
        window.location.href = 'orcamento-detalhe.html?id=' + linha.dataset.id;
      });
    });
    Utils.$$('[data-acao="duplicar"]', alvo).forEach(function (b) {
      b.addEventListener('click', function () {
        var copia = BudgetService.duplicar(b.dataset.id);
        showToast('Orçamento duplicado como rascunho.', 'success');
        window.location.href = 'orcamento-detalhe.html?id=' + copia.id;
      });
    });
    Utils.$$('[data-acao="excluir"]', alvo).forEach(function (b) {
      b.addEventListener('click', function () {
        openModal({
          titulo: 'Excluir orçamento',
          conteudo: '<p class="small">Tem certeza de que deseja excluir este rascunho? Esta ação não pode ser desfeita.</p>',
          botoes: [
            { texto: 'Cancelar', classe: 'btn-secondary', fechar: true },
            { texto: 'Excluir', classe: 'btn-danger', onClick: function () { BudgetService.excluir(b.dataset.id); showToast('Orçamento excluído.', 'success'); render(); } }
          ]
        });
      });
    });
  }
});
