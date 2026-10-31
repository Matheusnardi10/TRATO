/* ============================================================
   TRATO — onboarding.js
   Etapa 3: configuração do negócio · Etapa 4: finalização
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
  App.iniciarDados();

  var usuario = AuthService.usuarioAtual();
  if (!usuario) {
    window.location.href = 'login.html';
    return;
  }

  var PASSOS = ['Dados', 'Tipo de serviço', 'Configuração', 'Pronto'];
  var logoBase64 = (usuario.negocio && usuario.negocio.logo) || '';

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
  renderStepper(3);

  /* ---------- Nicho escolhido (coluna lateral) ---------- */
  var nicho = Data.getNicho(usuario.nicho);
  document.getElementById('aside-nicho').innerHTML =
    '<li><span class="s-n">' + nicho.emoji + '</span><span>Seu tipo de serviço: <strong style="color:#fff">' +
    nicho.nome + '</strong></span></li>' +
    '<li><span class="s-n">📄</span><span>Modelo de contrato: ' + nicho.contrato.titulo + '</span></li>' +
    '<li><span class="s-n">📑</span><span>' + nicho.camposOrcamento.length + ' campos específicos no orçamento</span></li>';

  /* ---------- Campos ---------- */
  var form = document.getElementById('form-config');
  var campos = {
    nomeProfissional: document.getElementById('nomeProfissional'),
    cidade: document.getElementById('cidade'),
    telefoneProfissional: document.getElementById('telefoneProfissional'),
    emailProfissional: document.getElementById('emailProfissional'),
    pix: document.getElementById('pix'),
    formaPagamentoPadrao: document.getElementById('formaPagamentoPadrao'),
    prazoPadrao: document.getElementById('prazoPadrao')
  };

  // Preenche com o que já existe
  campos.nomeProfissional.value = usuario.nomeProfissional || usuario.nome || '';
  campos.telefoneProfissional.value = (usuario.negocio && usuario.negocio.telefoneProfissional) || usuario.telefone || '';
  campos.emailProfissional.value = (usuario.negocio && usuario.negocio.emailProfissional) || usuario.email || '';
  campos.cidade.value = (usuario.negocio && usuario.negocio.cidade) || '';
  campos.pix.value = (usuario.negocio && usuario.negocio.pix) || '';

  atualizarPreviewLogo();

  campos.telefoneProfissional.addEventListener('input', function () {
    campos.telefoneProfissional.value = Utils.mascaraTelefone(campos.telefoneProfissional.value);
  });

  Object.keys(campos).forEach(function (chave) {
    campos[chave].addEventListener('input', function () { Utils.setErro(campos[chave], null); });
  });

  /* ---------- Logo ---------- */
  function atualizarPreviewLogo() {
    var preview = document.getElementById('logo-preview');
    var botaoRemover = document.getElementById('btn-logo-remover');
    if (logoBase64) {
      preview.innerHTML = '<img src="' + logoBase64 + '" alt="Logo do negócio">';
      botaoRemover.classList.remove('hidden');
    } else {
      preview.textContent = Utils.iniciais(campos.nomeProfissional.value || usuario.nome);
      botaoRemover.classList.add('hidden');
    }
  }

  document.getElementById('btn-logo').addEventListener('click', function () {
    document.getElementById('logo').click();
  });

  document.getElementById('logo').addEventListener('change', function (evento) {
    var arquivo = evento.target.files[0];
    if (!arquivo) return;
    if (arquivo.size > 1024 * 1024) {
      showToast('A imagem precisa ter no máximo 1 MB.', 'error', 'Arquivo grande demais');
      return;
    }
    var leitor = new FileReader();
    leitor.onload = function () {
      logoBase64 = leitor.result;
      atualizarPreviewLogo();
      showToast('Logo carregada.', 'success');
    };
    leitor.readAsDataURL(arquivo);
  });

  document.getElementById('btn-logo-remover').addEventListener('click', function () {
    logoBase64 = '';
    document.getElementById('logo').value = '';
    atualizarPreviewLogo();
  });

  /* ---------- Validação e gravação ---------- */
  function validar() {
    var ok = true;
    Utils.limparErros(form);

    if (!Utils.Validar.obrigatorio(campos.nomeProfissional.value)) {
      Utils.setErro(campos.nomeProfissional, 'Campo obrigatório.'); ok = false;
    }
    if (!Utils.Validar.obrigatorio(campos.cidade.value)) {
      Utils.setErro(campos.cidade, 'Campo obrigatório.'); ok = false;
    }
    if (campos.emailProfissional.value && !Utils.Validar.email(campos.emailProfissional.value)) {
      Utils.setErro(campos.emailProfissional, 'E-mail inválido.'); ok = false;
    }
    if (campos.telefoneProfissional.value && !Utils.Validar.telefone(campos.telefoneProfissional.value)) {
      Utils.setErro(campos.telefoneProfissional, 'Telefone incompleto.'); ok = false;
    }
    return ok;
  }

  function salvar(negocio) {
    AuthService.atualizar(usuario.id, {
      nomeProfissional: negocio.nomeProfissional || usuario.nomeProfissional,
      negocio: negocio
    });
  }

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    if (!validar()) {
      showToast('Revise os campos destacados.', 'error', 'Configuração incompleta');
      return;
    }

    var negocio = {
      nomeProfissional: campos.nomeProfissional.value.trim(),
      cidade: campos.cidade.value.trim(),
      logo: logoBase64,
      telefoneProfissional: campos.telefoneProfissional.value.trim(),
      emailProfissional: campos.emailProfissional.value.trim(),
      pix: campos.pix.value.trim(),
      formaPagamentoPadrao: campos.formaPagamentoPadrao.value,
      prazoPadrao: campos.prazoPadrao.value
    };

    salvar(negocio);
    mostrarConclusao(negocio);
  });

  document.getElementById('btn-pular').addEventListener('click', function () {
    salvar({
      nomeProfissional: campos.nomeProfissional.value.trim() || usuario.nome,
      cidade: campos.cidade.value.trim() || '—',
      logo: logoBase64,
      telefoneProfissional: usuario.telefone || '',
      emailProfissional: usuario.email,
      pix: '',
      formaPagamentoPadrao: campos.formaPagamentoPadrao.value,
      prazoPadrao: campos.prazoPadrao.value
    });
    window.location.href = 'dashboard.html';
  });

  /* ---------- Etapa 4 ---------- */
  function mostrarConclusao(negocio) {
    document.getElementById('etapa-3').classList.add('hidden');
    document.getElementById('etapa-4').classList.remove('hidden');
    renderStepper(4);

    document.getElementById('resumo-config').innerHTML =
      '<li><span class="ok">✓</span> Perfil de <strong>' + Utils.escapeHtml(negocio.nomeProfissional) + '</strong> criado</li>' +
      '<li><span class="ok">✓</span> Tipo de serviço: ' + nicho.emoji + ' <strong>' + nicho.nome + '</strong></li>' +
      '<li><span class="ok">✓</span> Modelo de contrato do seu nicho disponível</li>' +
      '<li><span class="ok">✓</span> Forma de pagamento padrão: ' + Utils.escapeHtml(negocio.formaPagamentoPadrao) + '</li>' +
      '<li><span class="ok">✓</span> Prazo padrão: ' + Utils.escapeHtml(negocio.prazoPadrao) + '</li>';

    showToast('Configuração concluída.', 'success', 'Tudo pronto');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.getElementById('btn-dashboard').addEventListener('click', function () {
    window.location.href = 'dashboard.html';
  });
});
