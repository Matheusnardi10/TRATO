/* ============================================================
   TRATO — landing.js
   Comportamentos da página inicial pública.
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {

  // Prepara os dados de demonstração já na landing
  Store.init();

  // Logo (SVG + nome vindo de Data.BRAND)
  Utils.$$('.lp-logo').forEach(function (logo) {
    logo.innerHTML = Components.logoSVG(26, 'var(--brand)') + '<span>' + Data.BRAND.nome + '</span>';
  });

  // Ano do rodapé
  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  // Rolagem suave dos links internos
  Utils.$$('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (evento) {
      var alvo = link.getAttribute('href');
      if (alvo === '#' || alvo.length < 2) return;
      var secao = document.querySelector(alvo);
      if (!secao) return;
      evento.preventDefault();
      window.scrollTo({ top: secao.offsetTop - 80, behavior: 'smooth' });
    });
  });

  // Aviso sobre os modelos de contrato
  var aviso = document.getElementById('link-aviso');
  if (aviso) {
    aviso.addEventListener('click', function (evento) {
      evento.preventDefault();
      openModal({
        titulo: 'Sobre os modelos de contrato',
        subtitulo: 'Leia antes de usar.',
        conteudo:
          '<p class="small">Os contratos do Trato são <strong>modelos personalizáveis</strong>, criados para ajudar você a ' +
          'registrar o que foi combinado com o cliente.</p>' +
          '<p class="small">Eles não são documentos com garantia jurídica e a plataforma não substitui a orientação ' +
          'de um profissional do direito. Revise sempre o texto antes de enviar.</p>',
        botoes: [{ texto: 'Entendi', classe: 'btn-primary', fechar: true }]
      });
    });
  }
});
