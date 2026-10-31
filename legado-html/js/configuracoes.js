/* ============================================================
   TRATO — configuracoes.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  var usuario = App.iniciarPainel({ pagina: 'configuracoes' });
  if (!usuario) return;

  var ABAS = [
    { id: 'perfil', nome: 'Dados pessoais' },
    { id: 'negocio', nome: 'Dados do negócio' },
    { id: 'nicho', nome: 'Meu nicho' },
    { id: 'preferencias', nome: 'Preferências' },
    { id: 'seguranca', nome: 'Segurança' }
  ];
  var abaAtiva = 'perfil';

  renderTabs();
  renderConteudo();

  function renderTabs() {
    document.getElementById('tabs-config').innerHTML = ABAS.map(function (a) {
      return '<button class="tab' + (a.id === abaAtiva ? ' active' : '') + '" data-tab="' + a.id + '">' + a.nome + '</button>';
    }).join('');
    Utils.$$('[data-tab]').forEach(function (tab) {
      tab.addEventListener('click', function () { abaAtiva = tab.dataset.tab; renderTabs(); renderConteudo(); });
    });
  }

  function recarregarUsuario() { usuario = AuthService.usuarioAtual(); }

  function renderConteudo() {
    var alvo = document.getElementById('conteudo-config');
    if (abaAtiva === 'perfil') return renderPerfil(alvo);
    if (abaAtiva === 'negocio') return renderNegocio(alvo);
    if (abaAtiva === 'nicho') return renderNicho(alvo);
    if (abaAtiva === 'preferencias') return renderPreferencias(alvo);
    if (abaAtiva === 'seguranca') return renderSeguranca(alvo);
  }

  /* ---------- Dados pessoais ---------- */
  function renderPerfil(alvo) {
    alvo.innerHTML =
      '<section class="card"><div class="card-head"><h3>Dados pessoais</h3></div><div class="card-body">' +
        '<div class="field-row">' +
          '<div class="field"><label>Nome completo</label><input class="input" id="p-nome" value="' + Utils.escapeHtml(usuario.nome) + '"></div>' +
          '<div class="field"><label>Telefone</label><input class="input" id="p-telefone" value="' + Utils.escapeHtml(usuario.telefone || '') + '"></div>' +
        '</div>' +
        '<div class="field"><label>E-mail de acesso</label><input class="input" type="email" id="p-email" value="' + Utils.escapeHtml(usuario.email) + '"></div>' +
      '</div><div class="card-foot"><button class="btn btn-primary" id="btn-salvar-perfil">Salvar alterações</button></div></section>';

    document.getElementById('btn-salvar-perfil').addEventListener('click', function () {
      var nome = document.getElementById('p-nome');
      var telefone = document.getElementById('p-telefone');
      var email = document.getElementById('p-email');
      Utils.setErro(nome, null); Utils.setErro(email, null);

      if (!Utils.Validar.obrigatorio(nome.value)) { Utils.setErro(nome, 'Campo obrigatório.'); return; }
      if (!Utils.Validar.email(email.value)) { Utils.setErro(email, 'E-mail inválido.'); return; }

      AuthService.atualizar(usuario.id, { nome: nome.value.trim(), telefone: telefone.value.trim(), email: email.value.trim() });
      recarregarUsuario();
      showToast('Dados pessoais atualizados.', 'success');
      renderHeader({});
    });
  }

  /* ---------- Dados do negócio ---------- */
  function renderNegocio(alvo) {
    var n = usuario.negocio || {};
    alvo.innerHTML =
      '<section class="card"><div class="card-head"><h3>Dados do negócio</h3><p class="sub">Aparecem nos seus orçamentos e contratos.</p></div><div class="card-body">' +
        '<div class="logo-upload mb-16">' +
          '<div class="logo-preview" id="logo-preview">' + (n.logo ? '<img src="' + n.logo + '">' : Utils.iniciais(n.nomeProfissional || usuario.nome)) + '</div>' +
          '<div><input type="file" id="logo" accept="image/*" class="hidden"><button class="btn btn-secondary btn-sm" type="button" id="btn-logo">Trocar imagem</button></div>' +
        '</div>' +
        '<div class="field-row">' +
          '<div class="field"><label>Nome profissional</label><input class="input" id="n-nome" value="' + Utils.escapeHtml(n.nomeProfissional || '') + '"></div>' +
          '<div class="field"><label>Cidade</label><input class="input" id="n-cidade" value="' + Utils.escapeHtml(n.cidade || '') + '"></div>' +
        '</div>' +
        '<div class="field-row">' +
          '<div class="field"><label>Telefone profissional</label><input class="input" id="n-telefone" value="' + Utils.escapeHtml(n.telefoneProfissional || '') + '"></div>' +
          '<div class="field"><label>E-mail profissional</label><input class="input" id="n-email" value="' + Utils.escapeHtml(n.emailProfissional || '') + '"></div>' +
        '</div>' +
        '<div class="field-row">' +
          '<div class="field"><label>Chave Pix</label><input class="input" id="n-pix" value="' + Utils.escapeHtml(n.pix || '') + '"></div>' +
          '<div class="field"><label>Forma de pagamento padrão</label><input class="input" id="n-forma" value="' + Utils.escapeHtml(n.formaPagamentoPadrao || '') + '"></div>' +
        '</div>' +
        '<div class="field" style="max-width:280px"><label>Prazo padrão</label><input class="input" id="n-prazo" value="' + Utils.escapeHtml(n.prazoPadrao || '') + '"></div>' +
      '</div><div class="card-foot"><button class="btn btn-primary" id="btn-salvar-negocio">Salvar alterações</button></div></section>';

    var logoBase64 = n.logo || '';
    document.getElementById('btn-logo').addEventListener('click', function () { document.getElementById('logo').click(); });
    document.getElementById('logo').addEventListener('change', function (e) {
      var arquivo = e.target.files[0];
      if (!arquivo) return;
      var leitor = new FileReader();
      leitor.onload = function () {
        logoBase64 = leitor.result;
        document.getElementById('logo-preview').innerHTML = '<img src="' + logoBase64 + '">';
      };
      leitor.readAsDataURL(arquivo);
    });

    document.getElementById('btn-salvar-negocio').addEventListener('click', function () {
      AuthService.atualizar(usuario.id, {
        negocio: {
          nomeProfissional: document.getElementById('n-nome').value.trim(),
          cidade: document.getElementById('n-cidade').value.trim(),
          logo: logoBase64,
          telefoneProfissional: document.getElementById('n-telefone').value.trim(),
          emailProfissional: document.getElementById('n-email').value.trim(),
          pix: document.getElementById('n-pix').value.trim(),
          formaPagamentoPadrao: document.getElementById('n-forma').value.trim(),
          prazoPadrao: document.getElementById('n-prazo').value.trim()
        },
        nomeProfissional: document.getElementById('n-nome').value.trim() || usuario.nomeProfissional
      });
      recarregarUsuario();
      showToast('Dados do negócio atualizados.', 'success');
    });
  }

  /* ---------- Nicho ---------- */
  function renderNicho(alvo) {
    var atual = Data.getNicho(usuario.nicho);
    alvo.innerHTML =
      '<section class="card"><div class="card-head"><h3>Meu nicho</h3><p class="sub">Define os campos de orçamento e o modelo de contrato usados em novos registros.</p></div>' +
      '<div class="card-body">' +
        '<div class="alert alert-info mb-16"><span class="alert-icon">ℹ️</span><div><strong>Nicho atual: ' + atual.emoji + ' ' + atual.nome + '</strong>' +
          '<p>Orçamentos e contratos já criados não são alterados ao trocar de nicho.</p></div></div>' +
        '<div class="niche-grid" id="niche-grid-config"></div>' +
      '</div><div class="card-foot"><button class="btn btn-primary" id="btn-salvar-nicho" disabled>Salvar novo nicho</button></div></section>';

    var novoNicho = null;
    document.getElementById('niche-grid-config').innerHTML = Data.NICHOS.map(function (n) {
      return '<button class="niche-card' + (n.id === usuario.nicho ? ' selected' : '') + '" type="button" data-nicho="' + n.id + '">' +
        '<span class="n-emoji">' + n.emoji + '</span><span class="n-name">' + n.nome + '</span><span class="n-desc">' + n.descricao + '</span></button>';
    }).join('');

    Utils.$$('[data-nicho]', alvo).forEach(function (card) {
      card.addEventListener('click', function () {
        Utils.$$('.niche-card', alvo).forEach(function (c) { c.classList.remove('selected'); });
        card.classList.add('selected');
        novoNicho = card.dataset.nicho;
        document.getElementById('btn-salvar-nicho').disabled = (novoNicho === usuario.nicho);
      });
    });

    document.getElementById('btn-salvar-nicho').addEventListener('click', function () {
      if (!novoNicho || novoNicho === usuario.nicho) return;
      openModal({
        titulo: 'Trocar de nicho',
        conteudo: '<p class="small">Novos orçamentos passarão a usar os campos e o modelo de contrato de <strong>' + Data.getNicho(novoNicho).nome + '</strong>. Registros já existentes não mudam.</p>',
        botoes: [
          { texto: 'Cancelar', classe: 'btn-secondary', fechar: true },
          {
            texto: 'Confirmar troca', classe: 'btn-primary', onClick: function () {
              AuthService.atualizar(usuario.id, { nicho: novoNicho });
              recarregarUsuario();
              showToast('Nicho atualizado para ' + Data.getNicho(novoNicho).nome + '.', 'success');
              renderHeader({});
              renderNicho(alvo);
            }
          }
        ]
      });
    });
  }

  /* ---------- Preferências ---------- */
  function renderPreferencias(alvo) {
    var prefs = Utils.Storage.get('trato.preferencias', { notifAprovacao: true, notifPagamento: true, notifAgenda: true });
    alvo.innerHTML =
      '<section class="card"><div class="card-head"><h3>Preferências de notificação</h3></div><div class="card-body">' +
        linhaPref('notifAprovacao', 'Orçamentos aprovados ou recusados', prefs.notifAprovacao) +
        linhaPref('notifPagamento', 'Pagamentos pendentes ou atrasados', prefs.notifPagamento) +
        linhaPref('notifAgenda', 'Conflitos e lembretes de agenda', prefs.notifAgenda) +
      '</div></section>';

    Utils.$$('[data-pref]', alvo).forEach(function (input) {
      input.addEventListener('change', function () {
        var atual = Utils.Storage.get('trato.preferencias', {});
        atual[input.dataset.pref] = input.checked;
        Utils.Storage.set('trato.preferencias', atual);
        showToast('Preferência salva.', 'success');
      });
    });
  }

  function linhaPref(chave, rotulo, valor) {
    return '<label class="check mb-16" style="display:flex">' +
      '<input type="checkbox" data-pref="' + chave + '"' + (valor ? ' checked' : '') + '> ' + rotulo + '</label>';
  }

  /* ---------- Segurança ---------- */
  function renderSeguranca(alvo) {
    alvo.innerHTML =
      '<section class="card"><div class="card-head"><h3>Alterar senha</h3></div><div class="card-body">' +
        '<div class="field"><label>Senha atual</label><input class="input" type="password" id="s-atual"><span class="field-error"></span></div>' +
        '<div class="field-row">' +
          '<div class="field"><label>Nova senha</label><input class="input" type="password" id="s-nova"><span class="field-error"></span></div>' +
          '<div class="field"><label>Confirmar nova senha</label><input class="input" type="password" id="s-confirmar"><span class="field-error"></span></div>' +
        '</div>' +
      '</div><div class="card-foot"><button class="btn btn-primary" id="btn-salvar-senha">Salvar nova senha</button></div></section>';

    document.getElementById('btn-salvar-senha').addEventListener('click', function () {
      var atual = document.getElementById('s-atual');
      var nova = document.getElementById('s-nova');
      var confirmar = document.getElementById('s-confirmar');
      [atual, nova, confirmar].forEach(function (c) { Utils.setErro(c, null); });

      if (atual.value !== usuario.senha) { Utils.setErro(atual, 'Senha atual incorreta.'); return; }
      if (!Utils.Validar.minimo(nova.value, 6)) { Utils.setErro(nova, 'Mínimo de 6 caracteres.'); return; }
      if (nova.value !== confirmar.value) { Utils.setErro(confirmar, 'As senhas não coincidem.'); return; }

      AuthService.atualizar(usuario.id, { senha: nova.value });
      recarregarUsuario();
      showToast('Senha atualizada.', 'success');
      atual.value = nova.value = confirmar.value = '';
    });
  }
});
