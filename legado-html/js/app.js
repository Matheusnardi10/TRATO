/* ============================================================
   TRATO — app.js
   Ponto de entrada das páginas internas.
   Ordem de carregamento dos scripts:
   utils -> data -> store -> services -> components -> chart -> app -> (página)
   ============================================================ */

var App = (function () {

  /* Prepara o LocalStorage na primeira visita */
  function iniciarDados() {
    Store.init();
  }

  /* Redireciona para o login se não houver sessão */
  function exigirLogin() {
    var usuario = AuthService.usuarioAtual();
    if (!usuario) {
      window.location.href = 'login.html';
      return null;
    }
    return usuario;
  }

  /* Monta o layout padrão do painel */
  function iniciarPainel(opcoes) {
    opcoes = opcoes || {};
    iniciarDados();

    var usuario = exigirLogin();
    if (!usuario) return null;

    PaymentService.atualizarStatusVencidos();
    NotificationService.checarAutomaticas();

    Components.renderSidebar(opcoes.pagina);
    Components.renderHeader({ titulo: opcoes.titulo, subtitulo: opcoes.subtitulo });
    return usuario;
  }

  /* Páginas públicas (landing, login, cadastro) */
  function iniciarPublico() {
    iniciarDados();
  }

  return {
    iniciarDados: iniciarDados,
    exigirLogin: exigirLogin,
    iniciarPainel: iniciarPainel,
    iniciarPublico: iniciarPublico
  };
})();
