/* ============================================================
   TRATO — cadastro.js
   Etapa 1: dados de acesso · Etapa 2: escolha do nicho
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  App.iniciarPublico();

  var PASSOS = ['Dados', 'Tipo de serviço', 'Configuração', 'Pronto'];
  var dadosCadastro = {};
  var nichoSelecionado = null;

  var logo = document.getElementById('aside-logo');
  if (logo) logo.innerHTML = Components.logoSVG(26, '#3E877C') + '<span>' + Data.BRAND.nome + '</span>';

  /* ---------- Passos ---------- */
  function renderStepper(atual) {
    var html = '';
    PASSOS.forEach(function (nome, i) {
      var numero = i + 1;
      var classe = numero === atual ? 'active' : (numero < atual ? 'done' : '');
      html += '<div class="step ' + classe + '">' +
        '<span class="step-bullet">' + (numero < atual ? '✓' : numero) + '</span>' + nome + '</div>';
      if (i < PASSOS.length - 1) html += '<span class="step-line"></span>';
    });
    document.getElementById('stepper').innerHTML = html;
  }

  function irParaEtapa(numero) {
    document.getElementById('etapa-1').classList.toggle('hidden', numero !== 1);
    document.getElementById('etapa-2').classList.toggle('hidden', numero !== 2);
    renderStepper(numero);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  renderStepper(1);

  /* ---------- Etapa 1: formulário ---------- */
  var form = document.getElementById('form-dados');
  var campos = {
    nome: document.getElementById('nome'),
    nomeProfissional: document.getElementById('nomeProfissional'),
    email: document.getElementById('email'),
    telefone: document.getElementById('telefone'),
    senha: document.getElementById('senha'),
    confirmarSenha: document.getElementById('confirmarSenha')
  };

  // Máscara de telefone
  campos.telefone.addEventListener('input', function () {
    campos.telefone.value = Utils.mascaraTelefone(campos.telefone.value);
  });

  // Força da senha
  var medidor = document.getElementById('pass-meter');
  campos.senha.addEventListener('input', function () {
    var valor = campos.senha.value;
    var nivel = '';
    if (valor.length >= 10 && /\d/.test(valor) && /[A-Za-z]/.test(valor)) nivel = 'strong';
    else if (valor.length >= 6) nivel = 'medium';
    else if (valor.length > 0) nivel = 'weak';
    medidor.className = 'pass-meter ' + nivel;
  });

  Object.keys(campos).forEach(function (chave) {
    campos[chave].addEventListener('input', function () { Utils.setErro(campos[chave], null); });
  });

  Utils.$$('[data-toggle-pass]').forEach(function (botao) {
    botao.addEventListener('click', function () {
      var campo = document.getElementById(botao.dataset.togglePass);
      campo.type = campo.type === 'password' ? 'text' : 'password';
      botao.textContent = campo.type === 'password' ? '👁' : '🙈';
    });
  });

  function validarDados() {
    var ok = true;
    Utils.limparErros(form);

    if (!Utils.Validar.obrigatorio(campos.nome.value)) {
      Utils.setErro(campos.nome, 'Campo obrigatório.'); ok = false;
    } else if (!Utils.Validar.minimo(campos.nome.value, 3)) {
      Utils.setErro(campos.nome, 'Informe seu nome completo.'); ok = false;
    }

    if (!Utils.Validar.obrigatorio(campos.email.value)) {
      Utils.setErro(campos.email, 'Campo obrigatório.'); ok = false;
    } else if (!Utils.Validar.email(campos.email.value)) {
      Utils.setErro(campos.email, 'E-mail inválido.'); ok = false;
    }

    if (!Utils.Validar.obrigatorio(campos.telefone.value)) {
      Utils.setErro(campos.telefone, 'Campo obrigatório.'); ok = false;
    } else if (!Utils.Validar.telefone(campos.telefone.value)) {
      Utils.setErro(campos.telefone, 'Telefone incompleto.'); ok = false;
    }

    if (!Utils.Validar.minimo(campos.senha.value, 6)) {
      Utils.setErro(campos.senha, 'A senha precisa ter pelo menos 6 caracteres.'); ok = false;
    }

    if (!Utils.Validar.iguais(campos.senha.value, campos.confirmarSenha.value)) {
      Utils.setErro(campos.confirmarSenha, 'As senhas não coincidem.'); ok = false;
    }

    return ok;
  }

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    if (!validarDados()) {
      showToast('Revise os campos destacados para continuar.', 'error', 'Dados incompletos');
      return;
    }
    dadosCadastro = {
      nome: campos.nome.value.trim(),
      nomeProfissional: campos.nomeProfissional.value.trim() || campos.nome.value.trim(),
      email: campos.email.value.trim(),
      telefone: campos.telefone.value.trim(),
      senha: campos.senha.value
    };
    irParaEtapa(2);
  });

  /* ---------- Etapa 2: nichos ---------- */
  var grid = document.getElementById('niche-grid');
  grid.innerHTML = Data.NICHOS.map(function (nicho) {
    return '<button class="niche-card" type="button" data-nicho="' + nicho.id + '" aria-pressed="false">' +
      '<span class="n-emoji">' + nicho.emoji + '</span>' +
      '<span class="n-name">' + nicho.nome + '</span>' +
      '<span class="n-desc">' + nicho.descricao + '</span>' +
      '</button>';
  }).join('');

  Utils.$$('[data-nicho]', grid).forEach(function (card) {
    card.addEventListener('click', function () {
      Utils.$$('.niche-card', grid).forEach(function (c) {
        c.classList.remove('selected');
        c.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
      nichoSelecionado = card.dataset.nicho;
      document.getElementById('erro-nicho').style.display = 'none';
    });
  });

  document.getElementById('btn-voltar').addEventListener('click', function () { irParaEtapa(1); });

  document.getElementById('btn-criar-conta').addEventListener('click', function () {
    if (!nichoSelecionado) {
      document.getElementById('erro-nicho').style.display = 'block';
      showToast('Escolha o tipo de serviço que você faz.', 'error', 'Falta um passo');
      return;
    }

    dadosCadastro.nicho = nichoSelecionado;
    var resultado = AuthService.criar(dadosCadastro);

    if (!resultado.ok) {
      showToast(resultado.erro, 'error', 'Não foi possível criar a conta');
      irParaEtapa(1);
      Utils.setErro(campos.email, resultado.erro);
      return;
    }

    Store.Sessao.salvar(resultado.usuario, true);
    NotificationService.criar({
      tipo: 'success',
      titulo: 'Bem-vindo ao ' + Data.BRAND.nome,
      texto: 'Sua conta foi criada. Configure seu perfil para começar.'
    });
    window.location.href = 'onboarding.html';
  });
});
