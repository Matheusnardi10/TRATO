/* ============================================================
   TRATO — orcamento-novo.js
   Cria ou edita um orçamento. Os campos do nicho e os cálculos
   de custo/margem/lucro são montados dinamicamente.
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  var usuario = App.iniciarPainel({ pagina: 'orcamentos' });
  if (!usuario) return;

  var nicho = Data.getNicho(usuario.nicho);
  var idEdicao = Utils.param('id');
  var orcamentoExistente = idEdicao ? BudgetService.buscar(idEdicao) : null;
  var travaCalculo = false; // evita loop entre margem <-> valor

  if (idEdicao && !orcamentoExistente) {
    document.querySelector('.page').innerHTML = Components.emptyState({ icone: '🚫', titulo: 'Orçamento não encontrado', texto: 'Ele pode ter sido excluído.' });
    return;
  }

  if (orcamentoExistente) {
    document.getElementById('titulo-pagina').textContent = 'Editar orçamento #' + orcamentoExistente.numero;
    document.getElementById('btn-enviar').textContent = orcamentoExistente.status === 'rascunho' ? 'Salvar e enviar ao cliente' : 'Salvar alterações';
  }

  renderClientes();
  renderCamposNicho();
  renderCamposCustos();
  preencherComExistente();
  ativarCalculo();
  calcular();

  document.getElementById('form-orcamento').addEventListener('submit', function (e) {
    e.preventDefault();
    salvar(orcamentoExistente ? orcamentoExistente.status : 'aguardando');
  });
  document.getElementById('btn-rascunho').addEventListener('click', function () { salvar('rascunho'); });

  /* ---------- Cliente ---------- */
  function renderClientes() {
    var select = document.getElementById('clienteId');
    var clientes = ClientService.listar();
    var preSelecionado = Utils.param('clienteId') || (orcamentoExistente && orcamentoExistente.clienteId);

    if (!clientes.length) {
      select.innerHTML = '<option value="">Nenhum cliente cadastrado</option>';
      return;
    }

    select.innerHTML = '<option value="">Selecione um cliente...</option>' +
      clientes.map(function (c) {
        return '<option value="' + c.id + '"' + (c.id === preSelecionado ? ' selected' : '') + '>' + Utils.escapeHtml(c.nome) + '</option>';
      }).join('');
  }

  /* ---------- Campos dinâmicos do nicho ---------- */
  function renderCamposNicho() {
    document.getElementById('titulo-nicho').textContent = nicho.emoji + ' Campos de ' + nicho.nome;
    document.getElementById('sub-nicho').textContent = 'Definidos pelo seu tipo de serviço — mude em Configurações se precisar.';

    var alvo = document.getElementById('campos-nicho');
    if (!nicho.camposOrcamento.length) {
      alvo.innerHTML = '<p class="small muted mb-0">Este nicho não possui campos específicos.</p>';
      return;
    }

    alvo.innerHTML = '<div class="field-row wrap-fields">' + nicho.camposOrcamento.map(function (campo) {
      return '<div class="field" style="flex:1;min-width:220px" data-campo-wrap="' + campo.id + '">' + campoHtml(campo) + '</div>';
    }).join('') + '</div>';

    // Layout em grade manual (2 colunas) sem depender do .field-row rígido
    alvo.querySelector('.wrap-fields').style.display = 'grid';
    alvo.querySelector('.wrap-fields').style.gridTemplateColumns = '1fr 1fr';
    alvo.querySelector('.wrap-fields').style.gap = '14px';
  }

  function campoHtml(campo) {
    var obrig = campo.obrigatorio ? ' <span class="req">*</span>' : '';
    var label = '<label for="nicho-' + campo.id + '">' + Utils.escapeHtml(campo.label) + obrig + '</label>';
    var id = 'nicho-' + campo.id;

    if (campo.tipo === 'select') {
      return label + '<select class="select" id="' + id + '" data-campo="' + campo.id + '">' +
        '<option value="">Selecione...</option>' +
        campo.opcoes.map(function (op) { return '<option value="' + Utils.escapeHtml(op) + '">' + Utils.escapeHtml(op) + '</option>'; }).join('') +
        '</select><span class="field-error"></span>';
    }
    if (campo.tipo === 'textarea') {
      return label + '<textarea class="textarea" id="' + id + '" data-campo="' + campo.id + '" style="min-height:64px"></textarea>';
    }
    if (campo.tipo === 'number') {
      return label + '<input class="input" type="number" min="0" id="' + id + '" data-campo="' + campo.id + '"><span class="field-error"></span>';
    }
    if (campo.tipo === 'time') {
      return label + '<input class="input" type="time" id="' + id + '" data-campo="' + campo.id + '"><span class="field-error"></span>';
    }
    return label + '<input class="input" type="text" id="' + id + '" data-campo="' + campo.id + '"><span class="field-error"></span>';
  }

  /* ---------- Custos estimados ---------- */
  function renderCamposCustos() {
    document.getElementById('campos-custos').innerHTML = Data.CATEGORIAS_DESPESA.map(function (cat) {
      return '<div class="field">' +
        '<label>' + cat.emoji + ' ' + cat.nome + '</label>' +
        '<div class="input-group"><span class="prefix">R$</span>' +
        '<input class="input" inputmode="decimal" placeholder="0,00" id="custo-' + cat.id + '" data-custo="' + cat.id + '"></div>' +
        '</div>';
    }).join('');
  }

  /* ---------- Preenche com dados existentes (edição) ---------- */
  function preencherComExistente() {
    if (!orcamentoExistente) {
      document.getElementById('dataPrevista').value = Utils.addDias(Utils.hojeISO(), 7);
      document.getElementById('validade').value = Utils.addDias(Utils.hojeISO(), 10);
      document.getElementById('formaPagamento').value = (usuario.negocio && usuario.negocio.formaPagamentoPadrao) || '';
      document.getElementById('prazoEstimado').value = (usuario.negocio && usuario.negocio.prazoPadrao) || '';
      document.getElementById('margem').value = 40;
      return;
    }

    var o = orcamentoExistente;
    document.getElementById('titulo').value = o.titulo || '';
    document.getElementById('descricao').value = o.descricao || '';
    document.getElementById('dataPrevista').value = o.dataPrevista || '';
    document.getElementById('prazoEstimado').value = o.prazoEstimado || '';
    document.getElementById('formaPagamento').value = o.formaPagamento || '';
    document.getElementById('validade').value = o.validade || '';
    document.getElementById('observacoes').value = o.observacoes || '';
    document.getElementById('margem').value = o.margem || 40;
    document.getElementById('valorFinal').value = Utils.mascaraMoeda(String(Math.round((o.valor || 0) * 100)));

    Object.keys(o.custos || {}).forEach(function (chave) {
      var campo = document.getElementById('custo-' + chave);
      if (campo) campo.value = Utils.mascaraMoeda(String(Math.round((o.custos[chave] || 0) * 100)));
    });

    Object.keys(o.camposNicho || {}).forEach(function (chave) {
      var campo = document.getElementById('nicho-' + chave);
      if (campo) campo.value = o.camposNicho[chave];
    });
  }

  /* ---------- Cálculo automático ---------- */
  function ativarCalculo() {
    Utils.$$('[data-custo]').forEach(function (campo) {
      campo.addEventListener('input', function () {
        campo.value = Utils.mascaraMoeda(campo.value);
        calcular('custo');
      });
    });

    document.getElementById('margem').addEventListener('input', function () { calcular('margem'); });

    var valorFinal = document.getElementById('valorFinal');
    valorFinal.addEventListener('input', function () {
      valorFinal.value = Utils.mascaraMoeda(valorFinal.value);
      calcular('valor');
    });
  }

  function lerCustos() {
    var custos = {};
    Data.CATEGORIAS_DESPESA.forEach(function (cat) {
      var campo = document.getElementById('custo-' + cat.id);
      custos[cat.id] = campo ? Utils.parseBRL(campo.value) : 0;
    });
    return custos;
  }

  function calcular(origem) {
    if (travaCalculo) return;
    travaCalculo = true;

    var custos = lerCustos();
    var custoTotal = Calc.custoTotal(custos);
    document.getElementById('custoTotal').value = Utils.formatBRL(custoTotal);

    var margemInput = document.getElementById('margem');
    var valorInput = document.getElementById('valorFinal');
    var valorAtual = Utils.parseBRL(valorInput.value);
    var margemAtual = Number(margemInput.value) || 0;

    if (origem === 'valor') {
      margemInput.value = custoTotal > 0 ? Calc.margem(valorAtual, custoTotal).toFixed(1) : margemAtual;
    } else {
      // custo mudou ou margem mudou: valor segue a margem
      var novoValor = Calc.valorComMargem(custoTotal, margemAtual);
      valorInput.value = novoValor ? Utils.mascaraMoeda(String(Math.round(novoValor * 100))) : '';
    }

    var valorFinalNumero = Utils.parseBRL(valorInput.value);
    var lucro = Calc.lucro(valorFinalNumero, custoTotal);
    document.getElementById('lucroEstimado').value = Utils.formatBRL(lucro);

    document.getElementById('resumo-custo').textContent = Utils.formatBRL(custoTotal);
    document.getElementById('resumo-valor').textContent = Utils.formatBRL(valorFinalNumero);
    document.getElementById('resumo-lucro').textContent = Utils.formatBRL(lucro);

    travaCalculo = false;
  }

  /* ---------- Salvar ---------- */
  function validar() {
    var ok = true;

    var clienteId = document.getElementById('clienteId');
    var titulo = document.getElementById('titulo');
    var dataPrevista = document.getElementById('dataPrevista');

    [clienteId, titulo, dataPrevista].forEach(function (c) { Utils.setErro(c, null); });

    if (!clienteId.value) { Utils.setErro(clienteId, 'Selecione um cliente.'); ok = false; }
    if (!Utils.Validar.obrigatorio(titulo.value)) { Utils.setErro(titulo, 'Campo obrigatório.'); ok = false; }
    if (!dataPrevista.value) { Utils.setErro(dataPrevista, 'Campo obrigatório.'); ok = false; }

    nicho.camposOrcamento.forEach(function (campo) {
      if (!campo.obrigatorio) return;
      var el = document.getElementById('nicho-' + campo.id);
      if (el) {
        Utils.setErro(el, null);
        if (!Utils.Validar.obrigatorio(el.value)) { Utils.setErro(el, 'Campo obrigatório.'); ok = false; }
      }
    });

    return ok;
  }

  function salvar(status) {
    if (!validar()) {
      showToast('Revise os campos destacados antes de continuar.', 'error', 'Faltam informações');
      return;
    }

    var camposNicho = {};
    nicho.camposOrcamento.forEach(function (campo) {
      var el = document.getElementById('nicho-' + campo.id);
      if (el) camposNicho[campo.id] = el.value;
    });

    var custos = lerCustos();
    var valor = Utils.parseBRL(document.getElementById('valorFinal').value);

    var dados = {
      clienteId: document.getElementById('clienteId').value,
      titulo: document.getElementById('titulo').value.trim(),
      descricao: document.getElementById('descricao').value.trim(),
      nicho: nicho.id,
      dataPrevista: document.getElementById('dataPrevista').value,
      prazoEstimado: document.getElementById('prazoEstimado').value.trim(),
      formaPagamento: document.getElementById('formaPagamento').value.trim(),
      validade: document.getElementById('validade').value,
      itens: [{ descricao: document.getElementById('titulo').value.trim() || 'Serviço', quantidade: 1, valorUnitario: valor }],
      custos: custos,
      margem: Number(document.getElementById('margem').value) || 0,
      valor: valor,
      camposNicho: camposNicho,
      observacoes: document.getElementById('observacoes').value.trim(),
      status: status
    };

    var salvo;
    if (orcamentoExistente) {
      salvo = BudgetService.atualizar(orcamentoExistente.id, dados);
      if (status === 'aguardando' && orcamentoExistente.status === 'rascunho') BudgetService.enviar(salvo.id);
      showToast('Orçamento atualizado.', 'success');
    } else {
      salvo = BudgetService.criar(dados);
      if (status === 'aguardando') BudgetService.enviar(salvo.id);
      showToast(status === 'rascunho' ? 'Orçamento salvo como rascunho.' : 'Orçamento enviado ao cliente.', 'success');
    }

    window.location.href = 'orcamento-detalhe.html?id=' + salvo.id;
  }
});
