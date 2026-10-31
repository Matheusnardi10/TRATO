/* ============================================================
   TRATO — aprovacao-orcamento.js
   Página pública (sem login) que o cliente abre para aprovar
   ou recusar um orçamento.
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  Store.init();

  var logo = document.getElementById('pub-logo');
  logo.innerHTML = Components.logoSVG(26, '#12564E') + '<span>' + Data.BRAND.nome + '</span>';

  var id = Utils.param('id');
  var orcamento = id && BudgetService.buscar(id);
  var profissional = Store.all('usuarios')[0] || Data.USUARIO_DEMO;
  var negocio = profissional.negocio || {};
  var alvo = document.getElementById('conteudo');

  if (!orcamento) {
    alvo.innerHTML = statusHtml('🚫', 'Orçamento não encontrado', 'Verifique se o link está correto ou peça um novo link ao profissional.');
    return;
  }

  if (orcamento.status === 'aprovado') {
    alvo.innerHTML = statusHtml('✅', 'Orçamento já aprovado', 'Você já aprovou este orçamento. O profissional foi notificado e vai formalizar o contrato.');
    return;
  }
  if (orcamento.status === 'recusado') {
    alvo.innerHTML = statusHtml('✖️', 'Orçamento recusado', 'Este orçamento foi marcado como recusado.');
    return;
  }

  renderDocumento();

  function renderDocumento() {
    var cliente = ClientService.buscar(orcamento.clienteId);
    var nicho = Data.getNicho(orcamento.nicho);
    var custoIgnorar = 0;
    var itens = orcamento.itens && orcamento.itens.length ? orcamento.itens : [{ descricao: orcamento.titulo, quantidade: 1, valorUnitario: orcamento.valor }];

    var linhasItens = itens.map(function (item) {
      return '<tr><td>' + Utils.escapeHtml(item.descricao) + '</td><td>' + item.quantidade + '</td>' +
        '<td>' + Utils.formatBRL(item.valorUnitario) + '</td><td>' + Utils.formatBRL(item.quantidade * item.valorUnitario) + '</td></tr>';
    }).join('');

    var camposNicho = (nicho.camposOrcamento || []).map(function (campo) {
      var valor = (orcamento.camposNicho || {})[campo.id];
      if (!valor) return '';
      return '<div class="item"><span>' + Utils.escapeHtml(campo.label) + '</span>' + Utils.escapeHtml(String(valor)) + '</div>';
    }).join('');

    alvo.innerHTML =
      '<div class="doc">' +
        '<div class="doc-head">' +
          '<div class="doc-brand">' + Components.logoSVG(28, '#12564E') +
            '<div><div class="doc-brand-name">' + Utils.escapeHtml(negocio.nomeProfissional || profissional.nomeProfissional) + '</div>' +
            '<div class="doc-brand-sub">' + Utils.escapeHtml(negocio.cidade || '') + '</div></div></div>' +
          '<div class="doc-meta"><span class="doc-numero">ORÇAMENTO #' + orcamento.numero + '</span>' +
            'Validade: ' + (orcamento.validade ? Utils.formatDate(orcamento.validade) : '—') + '</div>' +
        '</div>' +

        '<div class="doc-section"><h4>Olá' + (cliente ? ', ' + Utils.escapeHtml(Utils.primeiroNome(cliente.nome)) : '') + '!</h4>' +
          '<p>Confira abaixo os detalhes do serviço <strong>' + Utils.escapeHtml(orcamento.titulo) + '</strong> e responda quando quiser.</p>' +
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
        '</div></div>' +

        (orcamento.observacoes ? '<div class="doc-section"><h4>Observações</h4><p>' + Utils.escapeHtml(orcamento.observacoes) + '</p></div>' : '') +
      '</div>' +

      '<div class="pub-cta">' +
        '<button class="btn btn-danger" id="btn-recusar">✖ RECUSAR ORÇAMENTO</button>' +
        '<button class="btn btn-primary" id="btn-aceitar">✓ ACEITAR ORÇAMENTO</button>' +
      '</div>' +
      '<p class="tiny muted center mt-16">Ao aceitar, o profissional será avisado e poderá gerar o contrato deste serviço.</p>';

    document.getElementById('btn-aceitar').addEventListener('click', function () {
      openModal({
        titulo: 'Confirmar aprovação',
        conteudo: '<p class="small">Você está aprovando o orçamento <strong>#' + orcamento.numero + '</strong> no valor de ' + Utils.formatBRL(orcamento.valor) + '.</p>',
        botoes: [
          { texto: 'Voltar', classe: 'btn-secondary', fechar: true },
          {
            texto: 'Confirmar aprovação', classe: 'btn-primary', onClick: function () {
              BudgetService.aprovar(orcamento.id);
              alvo.innerHTML = statusHtml('✅', 'Orçamento aprovado com sucesso!', 'Obrigado! O profissional foi notificado e vai preparar o contrato deste serviço.');
            }
          }
        ]
      });
    });

    document.getElementById('btn-recusar').addEventListener('click', function () {
      openModal({
        titulo: 'Recusar orçamento',
        conteudo: '<p class="small">Tem certeza de que deseja recusar este orçamento?</p>',
        botoes: [
          { texto: 'Voltar', classe: 'btn-secondary', fechar: true },
          {
            texto: 'Recusar orçamento', classe: 'btn-danger', onClick: function () {
              BudgetService.recusar(orcamento.id);
              alvo.innerHTML = statusHtml('✖️', 'Orçamento recusado', 'Sua resposta foi registrada. Caso mude de ideia, peça um novo link ao profissional.');
            }
          }
        ]
      });
    });
  }

  function statusHtml(emoji, titulo, texto) {
    return '<div class="card"><div class="pub-status">' +
      '<span class="emoji">' + emoji + '</span><h2>' + titulo + '</h2><p class="muted">' + texto + '</p>' +
      '</div></div>';
  }
});
