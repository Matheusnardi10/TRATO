/* ============================================================
   TRATO — store.js
   Camada de persistência. Hoje grava no LocalStorage;
   amanhã pode chamar a API REST sem mudar os services.
   ============================================================ */

var Store = (function () {

  var PREFIXO = 'trato.';
  var CHAVE_VERSAO = PREFIXO + 'versao';
  var COLECOES = ['clientes', 'orcamentos', 'contratos', 'servicos',
    'despesas', 'pagamentos', 'notificacoes', 'historico', 'usuarios'];

  function chave(colecao) { return PREFIXO + colecao; }

  /* Cria os dados iniciais na primeira execução */
  function init() {
    var versao = Utils.Storage.get(CHAVE_VERSAO);
    if (versao === Data.BRAND.versaoDados) return;

    var inicial = Data.seed();
    Object.keys(inicial).forEach(function (colecao) {
      Utils.Storage.set(chave(colecao), inicial[colecao]);
    });
    Utils.Storage.set(chave('usuarios'), [Data.USUARIO_DEMO]);
    Utils.Storage.set(CHAVE_VERSAO, Data.BRAND.versaoDados);
  }

  function all(colecao) {
    return Utils.Storage.get(chave(colecao), []);
  }

  function saveAll(colecao, lista) {
    Utils.Storage.set(chave(colecao), lista);
    return lista;
  }

  function find(colecao, id) {
    return all(colecao).filter(function (item) { return item.id === id; })[0] || null;
  }

  function where(colecao, fn) {
    return all(colecao).filter(fn);
  }

  function insert(colecao, objeto) {
    var lista = all(colecao);
    if (!objeto.id) objeto.id = Utils.uid(colecao.slice(0, 3));
    lista.unshift(objeto);
    saveAll(colecao, lista);
    return objeto;
  }

  function update(colecao, id, mudancas) {
    var lista = all(colecao);
    var atualizado = null;
    lista = lista.map(function (item) {
      if (item.id !== id) return item;
      atualizado = Object.assign({}, item, mudancas);
      return atualizado;
    });
    saveAll(colecao, lista);
    return atualizado;
  }

  function remove(colecao, id) {
    saveAll(colecao, all(colecao).filter(function (item) { return item.id !== id; }));
  }

  /* Sessão simulada (nada de autenticação real nesta etapa) */
  var Sessao = {
    salvar: function (usuario, lembrar) {
      Utils.Storage.set(PREFIXO + 'sessao', {
        usuarioId: usuario.id,
        lembrar: !!lembrar,
        entrouEm: new Date().toISOString()
      });
    },
    atual: function () {
      var sessao = Utils.Storage.get(PREFIXO + 'sessao');
      if (!sessao) return null;
      var usuario = find('usuarios', sessao.usuarioId);
      return usuario || null;
    },
    encerrar: function () { Utils.Storage.remove(PREFIXO + 'sessao'); }
  };

  /* Restaura os dados de demonstração */
  function resetar() {
    COLECOES.forEach(function (colecao) { Utils.Storage.remove(chave(colecao)); });
    Utils.Storage.remove(CHAVE_VERSAO);
    Sessao.encerrar();
    init();
  }

  return {
    init: init,
    all: all,
    saveAll: saveAll,
    find: find,
    where: where,
    insert: insert,
    update: update,
    remove: remove,
    Sessao: Sessao,
    resetar: resetar
  };
})();
