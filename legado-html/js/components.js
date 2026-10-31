/* ============================================================
   TRATO — components.js
   Peças de interface reutilizadas em todas as páginas.
   Uso: Components.renderSidebar('dashboard'), showToast(...),
        openModal({...}), etc.
   ============================================================ */

var Components = (function () {

  /* ---------- Logo ---------- */
  function logoSVG(tamanho, cor) {
    var s = tamanho || 28;
    var c = cor || 'currentColor';
    return '<svg class="logo-mark" width="' + s + '" height="' + s + '" viewBox="0 0 32 32" fill="none" aria-hidden="true">' +
      '<rect x="1.5" y="1.5" width="29" height="29" rx="8" stroke="' + c + '" stroke-width="2"/>' +
      '<path d="M8 20.5l5-6 4.5 4L24 10" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="24" cy="10" r="2.6" fill="' + c + '"/>' +
      '</svg>';
  }

  /* ---------- Itens do menu ---------- */
  var MENU = [
    { id: 'dashboard',     nome: 'Dashboard',     icone: '📊', href: 'dashboard.html' },
    { id: 'clientes',      nome: 'Clientes',      icone: '👥', href: 'clientes.html' },
    { id: 'orcamentos',    nome: 'Orçamentos',    icone: '📑', href: 'orcamentos.html' },
    { id: 'contratos',     nome: 'Contratos',     icone: '📄', href: 'contratos.html' },
    { id: 'agenda',        nome: 'Agenda',        icone: '📅', href: 'agenda.html' },
    { id: 'servicos',      nome: 'Serviços',      icone: '🔨', href: 'servicos.html' },
    { id: 'financeiro',    nome: 'Financeiro',    icone: '💰', href: 'financeiro.html' },
    { id: 'relatorios',    nome: 'Relatórios',    icone: '📈', href: 'relatorios.html' },
    { id: 'configuracoes', nome: 'Configurações', icone: '⚙️', href: 'configuracoes.html' }
  ];

  function renderSidebar(paginaAtiva) {
    var alvo = document.getElementById('sidebar');
    if (!alvo) return;

    var itens = MENU.map(function (item) {
      var ativo = item.id === paginaAtiva ? ' active' : '';
      return '<a class="nav-item' + ativo + '" href="' + item.href + '">' +
        '<span class="nav-icon">' + item.icone + '</span>' + item.nome + '</a>';
    }).join('');

    alvo.className = 'sidebar';
    alvo.innerHTML =
      '<a class="sidebar-brand" href="dashboard.html">' +
        logoSVG(28, '#3E877C') +
        '<span class="logo-text">' + Data.BRAND.nome +
          '<span class="logo-sub">gestão de serviços</span>' +
        '</span>' +
      '</a>' +
      '<nav class="nav" aria-label="Menu principal">' +
        '<div class="nav-label">Operação</div>' + itens +
      '</nav>' +
      '<div class="sidebar-foot">' +
        '<div class="plan-card">' +
          '<strong>Versão de demonstração</strong>' +
          '<span>Dados fictícios salvos no seu navegador.</span>' +
        '</div>' +
      '</div>';
  }

  /* ---------- Header ---------- */
  function renderHeader(opcoes) {
    var alvo = document.getElementById('header');
    if (!alvo) return;
    opcoes = opcoes || {};

    var usuario = AuthService.usuarioAtual() || Data.USUARIO_DEMO;
    var nicho = Data.getNicho(usuario.nicho);
    var naoLidas = NotificationService.naoLidas().length;

    alvo.className = 'header';
    alvo.innerHTML =
      '<div class="header-greeting">' +
        '<h1>' + Utils.escapeHtml(opcoes.titulo || (Utils.saudacao() + ', ' + Utils.primeiroNome(usuario.nome) + '!')) + '</h1>' +
        '<p>' + Utils.escapeHtml(opcoes.subtitulo || 'Veja o resumo do seu negócio.') + '</p>' +
      '</div>' +
      '<div class="header-actions">' +
        '<div class="dropdown" id="dd-novo">' +
          '<button class="btn btn-primary" type="button" data-dd-toggle>+ Novo</button>' +
          '<div class="dropdown-menu hidden" data-dd-menu>' +
            '<div class="dropdown-title">Criar</div>' +
            '<a class="dropdown-item" href="clientes.html?novo=1">👥 Novo cliente</a>' +
            '<a class="dropdown-item" href="orcamento-novo.html">📑 Novo orçamento</a>' +
            '<a class="dropdown-item" href="agenda.html?novo=1">📅 Novo agendamento</a>' +
            '<div class="dropdown-sep"></div>' +
            '<button class="dropdown-item" type="button" id="btn-despesa-whats">💬 Registrar despesa pelo WhatsApp</button>' +
          '</div>' +
        '</div>' +
        '<div class="dropdown" id="dd-notif">' +
          '<button class="icon-btn" type="button" data-dd-toggle aria-label="Notificações">🔔' +
            (naoLidas ? '<span class="dot">' + naoLidas + '</span>' : '') +
          '</button>' +
          '<div class="dropdown-menu wide hidden" data-dd-menu>' +
            '<div class="row-between" style="padding:6px 10px 2px">' +
              '<span class="dropdown-title" style="padding:0">Notificações</span>' +
              '<button class="btn btn-ghost btn-sm" type="button" id="btn-ler-todas">Marcar todas como lidas</button>' +
            '</div>' +
            '<div id="lista-notificacoes"></div>' +
          '</div>' +
        '</div>' +
        '<div class="dropdown" id="dd-user">' +
          '<button class="user-chip" type="button" data-dd-toggle>' +
            '<span class="avatar">' + Utils.iniciais(usuario.nome) + '</span>' +
            '<span>' +
              '<span class="user-name">' + Utils.escapeHtml(Utils.primeiroNome(usuario.nome)) + '</span>' +
              '<span class="user-niche">' + nicho.emoji + ' ' + nicho.nome + '</span>' +
            '</span>' +
          '</button>' +
          '<div class="dropdown-menu hidden" data-dd-menu>' +
            '<div class="dropdown-title">' + Utils.escapeHtml(usuario.email) + '</div>' +
            '<a class="dropdown-item" href="configuracoes.html">⚙️ Configurações</a>' +
            '<button class="dropdown-item" type="button" id="btn-reset">♻️ Restaurar dados de demonstração</button>' +
            '<div class="dropdown-sep"></div>' +
            '<button class="dropdown-item" type="button" id="btn-sair">↩︎ Sair</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    renderNotificacoes();
    ativarDropdowns(alvo);

    var btnWhats = document.getElementById('btn-despesa-whats');
    if (btnWhats) btnWhats.addEventListener('click', modalWhatsApp);

    var btnLerTodas = document.getElementById('btn-ler-todas');
    if (btnLerTodas) btnLerTodas.addEventListener('click', function () {
      NotificationService.marcarTodasComoLidas();
      renderHeader(opcoes);
      showToast('Todas as notificações foram marcadas como lidas.', 'success');
    });

    var btnReset = document.getElementById('btn-reset');
    if (btnReset) btnReset.addEventListener('click', function () {
      openModal({
        titulo: 'Restaurar dados de demonstração',
        subtitulo: 'Tudo o que você criou nesta demonstração será apagado e os dados originais voltam.',
        conteudo: '<p class="small muted">Use isto sempre que quiser testar o sistema do zero.</p>',
        botoes: [
          { texto: 'Cancelar', classe: 'btn-secondary', fechar: true },
          {
            texto: 'Restaurar dados', classe: 'btn-danger', fechar: true, onClick: function () {
              var usuarioAtual = AuthService.usuarioAtual();
              Store.resetar();
              if (usuarioAtual) Store.Sessao.salvar(Data.USUARIO_DEMO, true);
              window.location.reload();
            }
          }
        ]
      });
    });

    var btnSair = document.getElementById('btn-sair');
    if (btnSair) btnSair.addEventListener('click', function () {
      AuthService.sair();
      window.location.href = 'login.html';
    });
  }

  function renderNotificacoes() {
    var alvo = document.getElementById('lista-notificacoes');
    if (!alvo) return;
    var lista = NotificationService.listar().slice(0, 6);

    if (!lista.length) {
      alvo.innerHTML = '<div class="empty" style="padding:24px 10px"><p class="small">Nenhuma notificação por enquanto.</p></div>';
      return;
    }

    var icones = { success: '✅', warning: '⚠️', danger: '⛔', info: 'ℹ️' };
    alvo.innerHTML = lista.map(function (n) {
      return '<div class="notif ' + (n.lida ? '' : 'unread') + '" data-notif="' + n.id + '">' +
        '<span class="n-icon">' + (icones[n.tipo] || 'ℹ️') + '</span>' +
        '<div><p><strong>' + Utils.escapeHtml(n.titulo) + '</strong></p>' +
        '<p class="muted small">' + Utils.escapeHtml(n.texto) + '</p>' +
        '<time>' + Utils.tempoRelativo(n.data) + '</time></div></div>';
    }).join('');

    Utils.$$('[data-notif]', alvo).forEach(function (item) {
      item.addEventListener('click', function () {
        NotificationService.marcarComoLida(item.dataset.notif);
        item.classList.remove('unread');
        var badge = document.querySelector('#dd-notif .dot');
        var restantes = NotificationService.naoLidas().length;
        if (badge) {
          if (restantes) badge.textContent = restantes;
          else badge.remove();
        }
      });
    });
  }

  /* ---------- Dropdowns ---------- */
  var listenerGlobalAtivo = false;

  function ativarDropdowns(contexto) {
    Utils.$$('.dropdown', contexto || document).forEach(function (dd) {
      var botao = dd.querySelector('[data-dd-toggle]');
      var menu = dd.querySelector('[data-dd-menu]');
      if (!botao || !menu) return;
      botao.addEventListener('click', function (evento) {
        evento.stopPropagation();
        var estavaAberto = !menu.classList.contains('hidden');
        fecharDropdowns();
        if (!estavaAberto) menu.classList.remove('hidden');
      });
      menu.addEventListener('click', function (evento) { evento.stopPropagation(); });
    });
    if (!listenerGlobalAtivo) {
      listenerGlobalAtivo = true;
      document.addEventListener('click', fecharDropdowns);
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') fecharDropdowns();
      });
    }
  }

  function fecharDropdowns() {
    Utils.$$('[data-dd-menu]').forEach(function (m) { m.classList.add('hidden'); });
  }

  /* ---------- Modal ---------- */
  function openModal(opcoes) {
    closeModal();
    opcoes = opcoes || {};

    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'modal-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    var botoes = (opcoes.botoes || []).map(function (b, i) {
      return '<button class="btn ' + (b.classe || 'btn-secondary') + '" type="button" data-btn="' + i + '">' +
        Utils.escapeHtml(b.texto) + '</button>';
    }).join('');

    overlay.innerHTML =
      '<div class="modal ' + (opcoes.tamanho === 'lg' ? 'modal-lg' : '') + '">' +
        '<div class="modal-head">' +
          '<div><h3>' + Utils.escapeHtml(opcoes.titulo || '') + '</h3>' +
          (opcoes.subtitulo ? '<p class="sub">' + Utils.escapeHtml(opcoes.subtitulo) + '</p>' : '') + '</div>' +
          '<button class="modal-close" type="button" aria-label="Fechar" data-fechar>&times;</button>' +
        '</div>' +
        '<div class="modal-body">' + (opcoes.conteudo || '') + '</div>' +
        (botoes ? '<div class="modal-foot">' + botoes + '</div>' : '<div style="height:18px"></div>') +
      '</div>';

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    overlay.querySelector('[data-fechar]').addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', escFecha);

    (opcoes.botoes || []).forEach(function (b, i) {
      var el = overlay.querySelector('[data-btn="' + i + '"]');
      if (!el) return;
      el.addEventListener('click', function () {
        var resultado = b.onClick ? b.onClick(overlay) : undefined;
        if (b.fechar !== false && resultado !== false) closeModal();
      });
    });

    if (opcoes.aoAbrir) opcoes.aoAbrir(overlay);
    return overlay;
  }

  function escFecha(e) { if (e.key === 'Escape') closeModal(); }

  function closeModal() {
    var overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.remove();
    document.body.style.overflow = '';
    document.removeEventListener('keydown', escFecha);
  }

  /* Modal "em breve" do WhatsApp */
  function modalWhatsApp() {
    openModal({
      titulo: 'Registrar despesa pelo WhatsApp',
      subtitulo: 'Funcionalidade em desenvolvimento.',
      conteudo:
        '<div class="whats-card">' +
          '<span class="badge badge-info">Em breve</span>' +
          '<p>Em breve você poderá registrar despesas diretamente pelo WhatsApp, enviando uma mensagem comum:</p>' +
          '<div class="bubble me" style="max-width:100%">"Paguei 80 reais de gasolina no serviço do João."<time>agora</time></div>' +
          '<p class="small muted mb-0">O sistema vai identificar o valor, a categoria e o serviço relacionado.</p>' +
        '</div>',
      botoes: [{ texto: 'Entendi', classe: 'btn-primary', fechar: true }]
    });
  }

  /* ---------- Toast ---------- */
  function showToast(mensagem, tipo, titulo) {
    var wrap = document.getElementById('toast-wrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'toast-wrap';
      wrap.className = 'toast-wrap';
      document.body.appendChild(wrap);
    }
    var icones = { success: '✅', error: '⛔', warning: '⚠️', info: 'ℹ️' };
    var toast = document.createElement('div');
    toast.className = 'toast ' + (tipo || 'info');
    toast.innerHTML = '<span class="toast-icon">' + (icones[tipo] || 'ℹ️') + '</span>' +
      '<div>' + (titulo ? '<strong>' + Utils.escapeHtml(titulo) + '</strong>' : '') +
      Utils.escapeHtml(mensagem) + '</div>';
    wrap.appendChild(toast);
    setTimeout(function () {
      toast.classList.add('out');
      setTimeout(function () { toast.remove(); }, 220);
    }, 3800);
  }

  /* ---------- Badges e estados ---------- */
  function badge(mapa, chave) {
    var item = mapa[chave] || { label: chave || '—', classe: 'badge-neutral' };
    return '<span class="badge ' + item.classe + '">' + item.label + '</span>';
  }

  function emptyState(opcoes) {
    opcoes = opcoes || {};
    return '<div class="empty">' +
      '<span class="empty-icon">' + (opcoes.icone || '📭') + '</span>' +
      '<h4>' + Utils.escapeHtml(opcoes.titulo || 'Nada por aqui ainda') + '</h4>' +
      '<p>' + Utils.escapeHtml(opcoes.texto || '') + '</p>' +
      (opcoes.acao ? '<button class="btn btn-primary" type="button" id="' + (opcoes.acaoId || 'empty-acao') + '">' +
        Utils.escapeHtml(opcoes.acao) + '</button>' : '') +
      '</div>';
  }

  function loading(linhas) {
    var html = '';
    for (var i = 0; i < (linhas || 3); i++) {
      html += '<div class="skeleton" style="margin:10px 0; width:' + (100 - i * 12) + '%"></div>';
    }
    return html;
  }

  return {
    logoSVG: logoSVG,
    renderSidebar: renderSidebar,
    renderHeader: renderHeader,
    renderNotificacoes: renderNotificacoes,
    ativarDropdowns: ativarDropdowns,
    openModal: openModal,
    closeModal: closeModal,
    modalWhatsApp: modalWhatsApp,
    showToast: showToast,
    badge: badge,
    emptyState: emptyState,
    loading: loading
  };
})();

/* Atalhos globais, como pedido na especificação */
function showToast(mensagem, tipo, titulo) { return Components.showToast(mensagem, tipo, titulo); }
function openModal(opcoes) { return Components.openModal(opcoes); }
function closeModal() { return Components.closeModal(); }
function renderSidebar(pagina) { return Components.renderSidebar(pagina); }
function renderHeader(opcoes) { return Components.renderHeader(opcoes); }
