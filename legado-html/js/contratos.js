/* ============================================================
   TRATO — contratos.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  var usuario = App.iniciarPainel({ pagina: 'contratos', titulo: 'Contratos', subtitulo: 'O principal diferencial: um modelo para cada nicho.' });
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
    var lista = ContractService.listar().filter(function (c) {
      if (estado.status !== 'todos' && c.status !== estado.status) return false;
      if (!estado.busca) return true;
      var alvo = (c.titulo + ' ' + ClientService.nome(c.clienteId) + ' ' + c.numero).toLowerCase();
      return alvo.indexOf(estado.busca) !== -1;
    }).sort(function (a, b) { return a.criadoEm < b.criadoEm ? 1 : -1; });

    document.getElementById('contagem-contratos').textContent =
      lista.length + (lista.length === 1 ? ' contrato encontrado' : ' contratos encontrados');

    var alvo = document.getElementById('tabela-contratos');

    if (!ContractService.listar().length) {
      alvo.innerHTML = Components.emptyState({
        icone: '📄', titulo: 'Nenhum contrato gerado ainda',
        texto: 'Contratos são gerados automaticamente a partir de um orçamento aprovado.'
      });
      return;
    }

    if (!lista.length) {
      alvo.innerHTML = Components.emptyState({ icone: '🔎', titulo: 'Nenhum contrato encontrado', texto: 'Tente outro termo ou outro filtro.' });
      return;
    }

    alvo.innerHTML =
      '<table class="table"><thead><tr>' +
        '<th>Número</th><th>Cliente</th><th>Serviço</th><th>Nicho</th><th class="num">Valor</th><th>Status</th>' +
      '</tr></thead><tbody>' +
      lista.map(function (c) {
        var nicho = Data.getNicho(c.nicho);
        return '<tr class="clickable" data-id="' + c.id + '">' +
          '<td class="mono">#' + c.numero + '</td>' +
          '<td><div class="cell-person"><span class="avatar">' + Utils.iniciais(ClientService.nome(c.clienteId)) + '</span>' +
            '<div><strong>' + Utils.escapeHtml(ClientService.nome(c.clienteId)) + '</strong></div></div></td>' +
          '<td>' + Utils.escapeHtml(c.titulo) + '</td>' +
          '<td>' + nicho.emoji + ' ' + nicho.nome + '</td>' +
          '<td class="num">' + Utils.formatBRL(ContractService.valorTotal(c)) + '</td>' +
          '<td>' + Components.badge(Data.STATUS_CONTRATO, c.status) + '</td></tr>';
      }).join('') + '</tbody></table>';

    Utils.$$('tr[data-id]', alvo).forEach(function (linha) {
      linha.addEventListener('click', function () { window.location.href = 'contrato-detalhe.html?id=' + linha.dataset.id; });
    });
  }
});
