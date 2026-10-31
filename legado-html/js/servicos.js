/* ============================================================
   TRATO — servicos.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  var usuario = App.iniciarPainel({ pagina: 'servicos', titulo: 'Serviços', subtitulo: 'Do agendamento até a conclusão.' });
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
    var lista = ServiceService.listar().filter(function (s) {
      if (estado.status !== 'todos' && s.status !== estado.status) return false;
      if (!estado.busca) return true;
      var alvo = (s.titulo + ' ' + ClientService.nome(s.clienteId) + ' ' + s.numero).toLowerCase();
      return alvo.indexOf(estado.busca) !== -1;
    }).sort(function (a, b) { return a.data < b.data ? 1 : -1; });

    document.getElementById('contagem-servicos').textContent =
      lista.length + (lista.length === 1 ? ' serviço encontrado' : ' serviços encontrados');

    var alvo = document.getElementById('tabela-servicos');

    if (!ServiceService.listar().length) {
      alvo.innerHTML = Components.emptyState({
        icone: '🔨', titulo: 'Nenhum serviço criado ainda',
        texto: 'Serviços são criados a partir de um contrato ou diretamente pela agenda.'
      });
      return;
    }

    if (!lista.length) {
      alvo.innerHTML = Components.emptyState({ icone: '🔎', titulo: 'Nenhum serviço encontrado', texto: 'Tente outro termo ou outro filtro.' });
      return;
    }

    alvo.innerHTML =
      '<table class="table"><thead><tr>' +
        '<th>Serviço</th><th>Cliente</th><th>Data</th><th class="num">Valor</th>' +
        '<th class="num">Custo</th><th class="num">Lucro</th><th>Status</th>' +
      '</tr></thead><tbody>' +
      lista.map(function (s) {
        var rent = ServiceService.rentabilidade(s);
        var classeLucro = rent.lucroAtual >= 0 ? 'pos' : 'neg';
        return '<tr class="clickable" data-id="' + s.id + '">' +
          '<td><div class="cell-person"><span class="avatar">🔨</span>' +
            '<div><strong>' + Utils.escapeHtml(s.titulo) + '</strong><span>#' + s.numero + '</span></div></div></td>' +
          '<td>' + Utils.escapeHtml(ClientService.nome(s.clienteId)) + '</td>' +
          '<td class="small">' + Utils.formatDate(s.data) + ' ' + s.hora + '</td>' +
          '<td class="num">' + Utils.formatBRL(s.valor) + '</td>' +
          '<td class="num">' + Utils.formatBRL(rent.custoReal) + (rent.acimaDoPrevisto ? ' ⚠️' : '') + '</td>' +
          '<td class="num ' + classeLucro + '">' + Utils.formatBRL(rent.lucroAtual) + '</td>' +
          '<td>' + Components.badge(Data.STATUS_SERVICO, s.status) + '</td></tr>';
      }).join('') + '</tbody></table>';

    Utils.$$('tr[data-id]', alvo).forEach(function (linha) {
      linha.addEventListener('click', function () { window.location.href = 'servico-detalhe.html?id=' + linha.dataset.id; });
    });
  }
});
