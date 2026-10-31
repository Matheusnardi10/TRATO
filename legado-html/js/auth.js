/* ============================================================
   TRATO — auth.js
   Tela de login (autenticação simulada, sem backend).
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  App.iniciarPublico();

  // Logo da coluna lateral
  var logo = document.getElementById('aside-logo');
  if (logo) logo.innerHTML = Components.logoSVG(26, '#3E877C') + '<span>' + Data.BRAND.nome + '</span>';

  // Se já existe sessão, vai direto ao painel
  if (AuthService.usuarioAtual()) {
    window.location.href = 'dashboard.html';
    return;
  }

  var form = document.getElementById('form-login');
  var campoEmail = document.getElementById('email');
  var campoSenha = document.getElementById('senha');
  var lembrar = document.getElementById('lembrar');

  // Preenche o e-mail lembrado da última vez
  var emailLembrado = Utils.Storage.get('trato.emailLembrado');
  if (emailLembrado) {
    campoEmail.value = emailLembrado;
    lembrar.checked = true;
  }

  // Mostrar/ocultar senha
  Utils.$$('[data-toggle-pass]').forEach(function (botao) {
    botao.addEventListener('click', function () {
      var campo = document.getElementById(botao.dataset.togglePass);
      campo.type = campo.type === 'password' ? 'text' : 'password';
      botao.textContent = campo.type === 'password' ? '👁' : '🙈';
    });
  });

  function validar() {
    var ok = true;
    Utils.limparErros(form);

    if (!Utils.Validar.obrigatorio(campoEmail.value)) {
      Utils.setErro(campoEmail, 'Campo obrigatório.'); ok = false;
    } else if (!Utils.Validar.email(campoEmail.value)) {
      Utils.setErro(campoEmail, 'E-mail inválido.'); ok = false;
    }

    if (!Utils.Validar.obrigatorio(campoSenha.value)) {
      Utils.setErro(campoSenha, 'Campo obrigatório.'); ok = false;
    }
    return ok;
  }

  [campoEmail, campoSenha].forEach(function (campo) {
    campo.addEventListener('input', function () { Utils.setErro(campo, null); });
  });

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    if (!validar()) return;

    var botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;
    botao.innerHTML = '<span class="spinner"></span> Entrando...';

    // Pequeno atraso apenas para simular o envio
    setTimeout(function () {
      var resultado = AuthService.entrar(campoEmail.value, campoSenha.value);

      if (!resultado.ok) {
        botao.disabled = false;
        botao.textContent = 'Entrar';
        Utils.setErro(campoSenha, resultado.erro);
        showToast(resultado.erro, 'error', 'Não foi possível entrar');
        return;
      }

      Store.Sessao.salvar(resultado.usuario, lembrar.checked);
      if (lembrar.checked) Utils.Storage.set('trato.emailLembrado', resultado.usuario.email);
      else Utils.Storage.remove('trato.emailLembrado');

      // Quem ainda não configurou o negócio vai para o onboarding
      var precisaOnboarding = !resultado.usuario.nicho ||
        !resultado.usuario.negocio || !resultado.usuario.negocio.cidade;
      window.location.href = precisaOnboarding ? 'onboarding.html' : 'dashboard.html';
    }, 450);
  });

  // Esqueci minha senha
  document.getElementById('btn-esqueci').addEventListener('click', function () {
    openModal({
      titulo: 'Esqueci minha senha',
      subtitulo: 'Enviaremos um link de redefinição para o seu e-mail.',
      conteudo:
        '<div class="field">' +
          '<label for="email-recuperar">E-mail cadastrado</label>' +
          '<input class="input" type="email" id="email-recuperar" placeholder="voce@email.com" value="' +
            Utils.escapeHtml(campoEmail.value) + '">' +
          '<span class="field-error"></span>' +
        '</div>' +
        '<p class="tiny muted">Nesta versão de demonstração nenhum e-mail é enviado de verdade.</p>',
      botoes: [
        { texto: 'Cancelar', classe: 'btn-secondary', fechar: true },
        {
          texto: 'Enviar link', classe: 'btn-primary', onClick: function (overlay) {
            var campo = overlay.querySelector('#email-recuperar');
            if (!Utils.Validar.email(campo.value)) {
              campo.closest('.field').classList.add('invalid');
              overlay.querySelector('.field-error').textContent = 'E-mail inválido.';
              return false;
            }
            showToast('Se este e-mail estiver cadastrado, você receberá o link em instantes.', 'success', 'Link enviado');
          }
        }
      ]
    });
  });
});
