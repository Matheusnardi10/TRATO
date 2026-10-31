/* ============================================================
   TRATO — orcamento-detalhe.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  var usuario = App.iniciarPainel({ pagina: 'orcamentos' });
  if (!usuario) return;

  var id = Utils.param('id');
  var orcamento = id && BudgetService.buscar(id);

  if (!orcamento) {
    document.querySelector('.page').innerHTML = Components.emptyState({ icone: '🚫', titulo: 'Orçamento não encontrado', texto: 'Ele pode ter sido excluído.' });
    return;
  }

  document.title = 'Orçamento #' + orcamento.numero + ' — Trato';

  renderFaixaStatus();
  renderAcoes();
  renderDocumento();

  /* ---------- Faixa de status ---------- */
  function renderFaixaStatus() {
    var cliente = ClientService.buscar(orcamento.clienteId);
    var contrato = ContractService.buscarPorOrcamento(orcamento.id);
    var info = Data.STATUS_ORCAMENTO[orcamento.status];
    var alvo = document.getElementById('faixa-status');

    var mensagem = {
      rascunho: 'Este orçamento ainda não foi enviado ao cliente.',
      enviado: 'Enviado — aguardando o cliente abrir o link de aprovação.',
      aguardando: 'Aguardando a resposta de ' + (cliente ? cliente.nome : 'cliente') + '.',
      aprovado: 'Aprovado por ' + (cliente ? cliente.nome : 'cliente') + '. ' + (contrato ? 'O contrato já foi gerado.' : 'Gere o contrato para formalizar o serviço.'),
      recusado: 'O cliente recusou este orçamento.',
      expirado: 'A validade deste orçamento já passou.'
    }[orcamento.status];

    var acaoExtra = '';
    if (orcamento.status === 'aprovado' && !contrato) {
      acaoExtra = '<button class="btn btn-primary btn-sm" id="btn-gerar-contrato">Gerar contrato</button>';
    } else if (contrato) {
      acaoExtra = '<a class="btn btn-secondary btn-sm" href="contrato-detalhe.html?id=' + contrato.id + '">Ver contrato #' + contrato.numero + '</a>';
    } else if (orcamento.status === 'enviado' || orcamento.status === 'aguardando' || orcamento.status === 'rascunho') {
      acaoExtra = '<button class="btn btn-secondary btn-sm" id="btn-simular-cliente">Simular resposta do cliente</button>';
    }

    alvo.innerHTML = '<div class="card-body row-between wrap gap-16">' +
      '<div class="row gap-16">' + Components.badge(Data.STATUS_ORCAMENTO, orcamento.status) +
        '<span class="small muted">' + mensagem + '</span></div>' +
      '<div class="row gap-8">' + acaoExtra + '</div></div>';

    var btnContrato = document.getElementById('btn-gerar-contrato');
    if (btnContrato) btnContrato.addEventListener('click', function () {
      var gerado = ContractService.gerarDoOrcamento(orcamento.id);
      showToast('Contrato #' + gerado.numero + ' gerado a partir do orçamento.', 'success');
      window.location.href = 'contrato-detalhe.html?id=' + gerado.id;
    });

    var btnSimular = document.getElementById('btn-simular-cliente');
    if (btnSimular) btnSimular.addEventListener('click', abrirSimulacaoCliente);
  }

  function abrirSimulacaoCliente() {
    openModal({
      titulo: 'Simular resposta do cliente',
      subtitulo: 'Use isto para testar o fluxo sem abrir a página pública de aprovação.',
      conteudo: '<p class="small">Você também pode abrir a página real que o cliente veria: ' +
        '<a href="aprovacao-orcamento.html?id=' + orcamento.id + '" target="_blank">abrir link de aprovação</a>.</p>',
      botoes: [
        { texto: 'Cancelar', classe: 'btn-secondary', fechar: true },
        { texto: 'Recusar orçamento', classe: 'btn-danger', onClick: function () { BudgetService.recusar(orcamento.id); showToast('Orçamento marcado como recusado.', 'error'); setTimeout(function () { window.location.reload(); }, 300); } },
        { texto: 'Aprovar orçamento', classe: 'btn-primary', onClick: function () { BudgetService.aprovar(orcamento.id); showToast('Orçamento aprovado!', 'success'); setTimeout(function () { window.location.reload(); }, 300); } }
      ]
    });
  }

  /* ---------- Ações do topo ---------- */
  function renderAcoes() {
    var botoes = '<button class="btn btn-secondary btn-sm" id="btn-pdf">🖨️ Gerar PDF</button>';
    botoes += '<button class="btn btn-secondary btn-sm" id="btn-whats">💬 Enviar pelo WhatsApp</button>';
    if (orcamento.status !== 'aprovado') {
      botoes += '<a class="btn btn-secondary btn-sm" href="orcamento-novo.html?id=' + orcamento.id + '">✏️ Editar</a>';
    }
    if (orcamento.status === 'rascunho') {
      botoes += '<button class="btn btn-danger btn-sm" id="btn-excluir">🗑️ Excluir</button>';
    }
    document.getElementById('acoes-orcamento').innerHTML = botoes;

    document.getElementById('btn-pdf').addEventListener('click', function () { window.print(); });

    document.getElementById('btn-whats').addEventListener('click', function () {
      var cliente = ClientService.buscar(orcamento.clienteId);
      var texto = 'Olá' + (cliente ? ', ' + cliente.nome : '') + '! Segue o orçamento *#' + orcamento.numero + '* — ' +
        orcamento.titulo + ', no valor de ' + Utils.formatBRL(orcamento.valor) + '. ' +
        'Você pode aprovar por aqui: ' + window.location.origin + window.location.pathname.replace('orcamento-detalhe.html', 'aprovacao-orcamento.html') + '?id=' + orcamento.id;
      window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank');
    });

    var btnExcluir = document.getElementById('btn-excluir');
    if (btnExcluir) btnExcluir.addEventListener('click', function () {
      openModal({
        titulo: 'Excluir orçamento',
        conteudo: '<p class="small">Tem certeza de que deseja excluir este rascunho?</p>',
        botoes: [
          { texto: 'Cancelar', classe: 'btn-secondary', fechar: true },
          { texto: 'Excluir', classe: 'btn-danger', onClick: function () { BudgetService.excluir(orcamento.id); window.location.href = 'orcamentos.html'; } }
        ]
      });
    });
  }

  /* ---------- Documento ---------- */
  function renderDocumento() {
    var cliente = ClientService.buscar(orcamento.clienteId);
    var nicho = Data.getNicho(orcamento.nicho);
    var negocio = usuario.negocio || {};
    var custoTotal = Calc.custoTotal(orcamento.custos);
    var lucro = Calc.lucro(orcamento.valor, custoTotal);

    var camposNicho = (nicho.camposOrcamento || []).map(function (campo) {
      var valor = (orcamento.camposNicho || {})[campo.id];
      if (!valor) return '';
      return '<div class="item"><span>' + Utils.escapeHtml(campo.label) + '</span>' + Utils.escapeHtml(String(valor)) + '</div>';
    }).join('');

    var itens = orcamento.itens && orcamento.itens.length ? orcamento.itens : [{ descricao: orcamento.titulo, quantidade: 1, valorUnitario: orcamento.valor }];
    var linhasItens = itens.map(function (item) {
      return '<tr><td>' + Utils.escapeHtml(item.descricao) + '</td><td>' + item.quantidade + '</td>' +
        '<td>' + Utils.formatBRL(item.valorUnitario) + '</td><td>' + Utils.formatBRL(item.quantidade * item.valorUnitario) + '</td></tr>';
    }).join('');

    document.getElementById('documento').innerHTML =
      '<div class="doc-head">' +
        '<div class="doc-brand">' + Components.logoSVG(30, '#12564E') +
          '<div><div class="doc-brand-name">' + Utils.escapeHtml(negocio.nomeProfissional || usuario.nomeProfissional || Data.BRAND.nome) + '</div>' +
          '<div class="doc-brand-sub">' + Utils.escapeHtml(negocio.cidade || '') + '</div></div></div>' +
        '<div class="doc-meta"><span class="doc-numero">ORÇAMENTO #' + orcamento.numero + '</span>' +
          'Emitido em ' + Utils.formatDate(orcamento.criadoEm) + '<br>Validade: ' + (orcamento.validade ? Utils.formatDate(orcamento.validade) : '—') +
        '</div>' +
      '</div>' +

      '<div class="doc-parties">' +
        '<div class="doc-party"><h5>Prestador</h5><p><strong>' + Utils.escapeHtml(negocio.nomeProfissional || usuario.nomeProfissional) + '</strong><br>' +
          Utils.escapeHtml(negocio.telefoneProfissional || usuario.telefone || '') + '<br>' + Utils.escapeHtml(negocio.emailProfissional || usuario.email) + '</p></div>' +
        '<div class="doc-party"><h5>Cliente</h5><p><strong>' + Utils.escapeHtml(cliente ? cliente.nome : 'Cliente') + '</strong><br>' +
          Utils.escapeHtml(cliente ? cliente.telefone : '') + '<br>' + Utils.escapeHtml(cliente ? cliente.email || '' : '') + '</p></div>' +
      '</div>' +

      '<div class="doc-section"><h4>' + Utils.escapeHtml(orcamento.titulo) + '</h4>' +
        (orcamento.descricao ? '<p>' + Utils.escapeHtml(orcamento.descricao) + '</p>' : '') +
        (camposNicho ? '<div class="doc-grid mt-16">' + camposNicho + '</div>' : '') +
      '</div>' +

      '<div class="doc-section"><h4>Itens e valores</h4>' +
        '<table class="doc-items"><thead><tr><th>Descrição</th><th>Qtd.</th><th>Valor unit.</th><th>Subtotal</th></tr></thead>' +
        '<tbody>' + linhasItens + '</tbody>' +
        '<tfoot><tr><td colspan="3">Valor total</td><td>' + Utils.formatBRL(orcamento.valor) + '</td></tr></tfoot></table>' +
      '</div>' +

      '<div class="doc-section"><h4>Condições</h4><div class="doc-grid">' +
        '<div class="item"><span>Data prevista</span>' + Utils.formatDate(orcamento.dataPrevista) + '</div>' +
        '<div class="item"><span>Prazo estimado</span>' + Utils.escapeHtml(orcamento.prazoEstimado || '—') + '</div>' +
        '<div class="item"><span>Forma de pagamento</span>' + Utils.escapeHtml(orcamento.formaPagamento || '—') + '</div>' +
        '<div class="item"><span>Nicho</span>' + nicho.emoji + ' ' + nicho.nome + '</div>' +
      '</div></div>' +

      (orcamento.observacoes ? '<div class="doc-section"><h4>Observações</h4><p>' + Utils.escapeHtml(orcamento.observacoes) + '</p></div>' : '') +

      '<div class="doc-footer-note">Documento gerado pelo Trato — modelo personalizável e sem validade jurídica garantida.</div>';
  }
});
