/* ============================================================
   TRATO — clientes.js
   Lista de clientes com busca, filtros e CRUD completo.
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  var usuario = App.iniciarPainel({ pagina: 'clientes', titulo: 'Clientes', subtitulo: 'Organize quem você atende.' });
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

  document.getElementById('btn-novo-cliente').addEventListener('click', function () { abrirFormulario(); });

  // Abre direto o formulário se veio de "?novo=1" (atalho do header)
  if (Utils.param('novo') === '1') abrirFormulario();

  /* ---------- Render da lista ---------- */
  function render() {
    var lista = ClientService.listar().filter(function (c) {
      if (estado.status !== 'todos' && c.status !== estado.status) return false;
      if (!estado.busca) return true;
      var alvo = (c.nome + ' ' + c.telefone + ' ' + c.email).toLowerCase();
      return alvo.indexOf(estado.busca) !== -1;
    });

    document.getElementById('contagem-clientes').textContent =
      lista.length + (lista.length === 1 ? ' cliente encontrado' : ' clientes encontrados');

    var alvo = document.getElementById('tabela-clientes');

    if (!ClientService.listar().length) {
      alvo.innerHTML = Components.emptyState({
        icone: '👥', titulo: 'Você ainda não possui clientes cadastrados',
        texto: 'Cadastre o primeiro cliente para começar a criar orçamentos.',
        acao: '+ Cadastrar primeiro cliente', acaoId: 'btn-vazio-cliente'
      });
      var botaoVazio = document.getElementById('btn-vazio-cliente');
      if (botaoVazio) botaoVazio.addEventListener('click', function () { abrirFormulario(); });
      return;
    }

    if (!lista.length) {
      alvo.innerHTML = Components.emptyState({ icone: '🔎', titulo: 'Nenhum cliente encontrado', texto: 'Tente outro termo de busca ou outro filtro.' });
      return;
    }

    alvo.innerHTML =
      '<table class="table">' +
        '<thead><tr>' +
          '<th>Nome</th><th>Telefone</th><th>E-mail</th><th class="num">Serviços</th>' +
          '<th>Último serviço</th><th class="num">Valor movimentado</th><th>Status</th><th></th>' +
        '</tr></thead><tbody>' +
        lista.map(linhaCliente).join('') +
        '</tbody></table>';

    Utils.$$('tr[data-id]', alvo).forEach(function (linha) {
      linha.addEventListener('click', function (e) {
        if (e.target.closest('[data-acao]')) return;
        window.location.href = 'cliente-detalhe.html?id=' + linha.dataset.id;
      });
    });
    Utils.$$('[data-acao="editar"]', alvo).forEach(function (b) {
      b.addEventListener('click', function () { abrirFormulario(ClientService.buscar(b.dataset.id)); });
    });
    Utils.$$('[data-acao="excluir"]', alvo).forEach(function (b) {
      b.addEventListener('click', function () { confirmarExclusao(b.dataset.id); });
    });
  }

  function linhaCliente(c) {
    var resumo = ClientService.resumo(c.id);
    return '<tr class="clickable" data-id="' + c.id + '">' +
      '<td><div class="cell-person"><span class="avatar">' + Utils.iniciais(c.nome) + '</span>' +
        '<div><strong>' + Utils.escapeHtml(c.nome) + '</strong></div></div></td>' +
      '<td>' + Utils.escapeHtml(c.telefone || '—') + '</td>' +
      '<td>' + Utils.escapeHtml(c.email || '—') + '</td>' +
      '<td class="num">' + resumo.quantidade + '</td>' +
      '<td class="small">' + (resumo.ultimoServico ? Utils.formatDate(resumo.ultimoServico.data) : '—') + '</td>' +
      '<td class="num">' + Utils.formatBRL(resumo.total) + '</td>' +
      '<td>' + Components.badge({ ativo: { label: 'Ativo', classe: 'badge-success' }, inativo: { label: 'Inativo', classe: 'badge-neutral' } }, c.status) + '</td>' +
      '<td><div class="row-actions">' +
        '<button class="row-action" type="button" data-acao="editar" data-id="' + c.id + '" title="Editar">✏️</button>' +
        '<button class="row-action" type="button" data-acao="excluir" data-id="' + c.id + '" title="Excluir">🗑️</button>' +
      '</div></td></tr>';
  }

  /* ---------- Modal de cadastro/edição ---------- */
  function abrirFormulario(clienteExistente) {
    var editando = !!clienteExistente;
    var c = clienteExistente || { nome: '', telefone: '', email: '', documento: '', endereco: '', observacoes: '', status: 'ativo' };

    var overlay = openModal({
      titulo: editando ? 'Editar cliente' : 'Novo cliente',
      subtitulo: editando ? 'Atualize os dados de ' + c.nome + '.' : 'Preencha os dados para cadastrar.',
      tamanho: 'lg',
      conteudo:
        '<form id="form-cliente" novalidate>' +
          '<div class="field-row">' +
            '<div class="field"><label>Nome completo <span class="req">*</span></label>' +
              '<input class="input" id="c-nome" value="' + Utils.escapeHtml(c.nome) + '" placeholder="Ex.: Ana Beatriz Ramos">' +
              '<span class="field-error"></span></div>' +
            '<div class="field"><label>Telefone <span class="req">*</span></label>' +
              '<input class="input" id="c-telefone" value="' + Utils.escapeHtml(c.telefone) + '" placeholder="(11) 90000-0000">' +
              '<span class="field-error"></span></div>' +
          '</div>' +
          '<div class="field-row">' +
            '<div class="field"><label>E-mail</label>' +
              '<input class="input" type="email" id="c-email" value="' + Utils.escapeHtml(c.email) + '" placeholder="cliente@email.com">' +
              '<span class="field-error"></span></div>' +
            '<div class="field"><label>CPF/CNPJ</label>' +
              '<input class="input" id="c-documento" value="' + Utils.escapeHtml(c.documento || '') + '" placeholder="000.000.000-00">' +
            '</div>' +
          '</div>' +
          '<div class="field"><label>Endereço</label>' +
            '<input class="input" id="c-endereco" value="' + Utils.escapeHtml(c.endereco || '') + '" placeholder="Rua, número — bairro, cidade">' +
          '</div>' +
          '<div class="field-row">' +
            '<div class="field"><label>Status</label>' +
              '<select class="select" id="c-status">' +
                '<option value="ativo"' + (c.status === 'ativo' ? ' selected' : '') + '>Ativo</option>' +
                '<option value="inativo"' + (c.status === 'inativo' ? ' selected' : '') + '>Inativo</option>' +
              '</select></div>' +
            '<div class="field"></div>' +
          '</div>' +
          '<div class="field"><label>Observações</label>' +
            '<textarea class="textarea" id="c-observacoes" placeholder="Preferências, indicação, detalhes de acesso...">' + Utils.escapeHtml(c.observacoes || '') + '</textarea>' +
          '</div>' +
        '</form>',
      botoes: [
        { texto: 'Cancelar', classe: 'btn-secondary', fechar: true },
        {
          texto: editando ? 'Salvar alterações' : 'Cadastrar cliente', classe: 'btn-primary', onClick: function (ov) {
            return salvar(ov, editando ? c.id : null);
          }
        }
      ]
    });

    setTimeout(function () { document.getElementById('c-nome').focus(); }, 50);
  }

  function salvar(overlay, id) {
    var campos = {
      nome: overlay.querySelector('#c-nome'),
      telefone: overlay.querySelector('#c-telefone'),
      email: overlay.querySelector('#c-email'),
      documento: overlay.querySelector('#c-documento'),
      endereco: overlay.querySelector('#c-endereco'),
      status: overlay.querySelector('#c-status'),
      observacoes: overlay.querySelector('#c-observacoes')
    };

    var ok = true;
    [campos.nome, campos.telefone, campos.email].forEach(function (campo) { Utils.setErro(campo, null); });

    if (!Utils.Validar.obrigatorio(campos.nome.value)) { Utils.setErro(campos.nome, 'Campo obrigatório.'); ok = false; }
    if (!Utils.Validar.obrigatorio(campos.telefone.value)) { Utils.setErro(campos.telefone, 'Campo obrigatório.'); ok = false; }
    else if (!Utils.Validar.telefone(campos.telefone.value)) { Utils.setErro(campos.telefone, 'Telefone incompleto.'); ok = false; }
    if (campos.email.value && !Utils.Validar.email(campos.email.value)) { Utils.setErro(campos.email, 'E-mail inválido.'); ok = false; }

    if (!ok) return false;

    var dados = {
      nome: campos.nome.value.trim(),
      telefone: campos.telefone.value.trim(),
      email: campos.email.value.trim(),
      documento: campos.documento.value.trim(),
      endereco: campos.endereco.value.trim(),
      status: campos.status.value,
      observacoes: campos.observacoes.value.trim()
    };

    if (id) { ClientService.atualizar(id, dados); showToast('Cliente atualizado.', 'success'); }
    else { ClientService.criar(dados); showToast('Cliente cadastrado.', 'success'); }

    render();
  }

  function confirmarExclusao(id) {
    var cliente = ClientService.buscar(id);
    var vinculado = ClientService.possuiVinculos(id);
    openModal({
      titulo: 'Excluir cliente',
      subtitulo: 'Esta ação não pode ser desfeita.',
      conteudo: '<p class="small">Tem certeza de que deseja excluir <strong>' + Utils.escapeHtml(cliente.nome) + '</strong>?</p>' +
        (vinculado ? '<div class="alert alert-warning mt-16"><span class="alert-icon">⚠️</span><div><strong>Este cliente possui orçamentos, contratos ou serviços.</strong><p>O histórico permanecerá salvo nesses registros, mas eles deixarão de referenciar um cliente ativo.</p></div></div>' : ''),
      botoes: [
        { texto: 'Cancelar', classe: 'btn-secondary', fechar: true },
        {
          texto: 'Excluir cliente', classe: 'btn-danger', onClick: function () {
            ClientService.excluir(id);
            showToast('Cliente excluído.', 'success');
            render();
          }
        }
      ]
    });
  }
});
