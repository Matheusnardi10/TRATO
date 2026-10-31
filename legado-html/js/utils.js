/* ============================================================
   TRATO — utils.js
   Funções auxiliares usadas em todo o sistema.
   ============================================================ */

var Utils = (function () {

  /* ---------- Dinheiro ---------- */

  function formatBRL(valor) {
    var n = Number(valor) || 0;
    return n.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    });
  }

  // Aceita "1.250,50", "1250.5", 1250.5 e devolve número
  function parseBRL(texto) {
    if (typeof texto === 'number') return texto;
    if (!texto) return 0;
    var limpo = String(texto)
      .replace(/[^\d,.-]/g, '')
      .replace(/\.(?=\d{3}(\D|$))/g, '')
      .replace(',', '.');
    var n = parseFloat(limpo);
    return isNaN(n) ? 0 : n;
  }

  function formatPercent(valor, casas) {
    var n = Number(valor) || 0;
    return n.toFixed(casas === undefined ? 1 : casas).replace('.', ',') + '%';
  }

  /* ---------- Datas (trabalhamos com ISO: 2026-08-21) ---------- */

  var MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  var MESES_CURTO = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun',
    'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  var DIAS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
    'quinta-feira', 'sexta-feira', 'sábado'];

  function toDate(iso) {
    if (iso instanceof Date) return iso;
    var partes = String(iso).slice(0, 10).split('-');
    return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  }

  function toISO(date) {
    var d = date instanceof Date ? date : new Date();
    var mes = String(d.getMonth() + 1).padStart(2, '0');
    var dia = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + mes + '-' + dia;
  }

  function hojeISO() {
    return toISO(new Date());
  }

  function addDias(iso, dias) {
    var d = toDate(iso);
    d.setDate(d.getDate() + dias);
    return toISO(d);
  }

  // 21/08/2026
  function formatDate(iso) {
    if (!iso) return '—';
    var d = toDate(iso);
    return String(d.getDate()).padStart(2, '0') + '/' +
      String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  }

  // 21 de agosto
  function formatDateLong(iso) {
    var d = toDate(iso);
    return d.getDate() + ' de ' + MESES[d.getMonth()];
  }

  // sexta-feira, 21 de agosto
  function formatDayFull(iso) {
    var d = toDate(iso);
    return DIAS[d.getDay()] + ', ' + formatDateLong(iso);
  }

  function nomeDiaCurto(iso) {
    var d = toDate(iso);
    var nome = DIAS[d.getDay()].replace('-feira', '');
    return nome.charAt(0).toUpperCase() + nome.slice(1);
  }

  function mesCurto(mesIndex) {
    return MESES_CURTO[mesIndex];
  }

  function mesmoMes(iso, referencia) {
    var a = toDate(iso);
    var b = referencia ? toDate(referencia) : new Date();
    return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  }

  function diffDias(isoA, isoB) {
    var a = toDate(isoA), b = toDate(isoB || hojeISO());
    return Math.round((a - b) / 86400000);
  }

  // "há 2 horas", "ontem", "há 3 dias"
  function tempoRelativo(isoDataHora) {
    var d = new Date(isoDataHora);
    if (isNaN(d)) return '';
    var seg = Math.floor((Date.now() - d.getTime()) / 1000);
    if (seg < 60) return 'agora';
    if (seg < 3600) return 'há ' + Math.floor(seg / 60) + ' min';
    if (seg < 86400) return 'há ' + Math.floor(seg / 3600) + 'h';
    var dias = Math.floor(seg / 86400);
    if (dias === 1) return 'ontem';
    if (dias < 30) return 'há ' + dias + ' dias';
    return formatDate(d);
  }

  function saudacao() {
    var h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  /* ---------- Texto ---------- */

  function iniciais(nome) {
    if (!nome) return '?';
    var partes = String(nome).trim().split(/\s+/);
    var a = partes[0] ? partes[0][0] : '';
    var b = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (a + b).toUpperCase();
  }

  function primeiroNome(nome) {
    return String(nome || '').trim().split(/\s+/)[0] || '';
  }

  function escapeHtml(texto) {
    return String(texto === undefined || texto === null ? '' : texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function uid(prefixo) {
    return (prefixo || 'id') + '-' + Date.now().toString(36) + '-' +
      Math.random().toString(36).slice(2, 7);
  }

  // Gera número sequencial no formato #007
  function proximoNumero(lista, campo) {
    var maior = 0;
    (lista || []).forEach(function (item) {
      var n = parseInt(String(item[campo || 'numero']).replace(/\D/g, ''), 10);
      if (!isNaN(n) && n > maior) maior = n;
    });
    return String(maior + 1).padStart(3, '0');
  }

  /* ---------- Máscaras ---------- */

  function mascaraTelefone(valor) {
    var d = String(valor).replace(/\D/g, '').slice(0, 11);
    if (d.length <= 10) {
      return d.replace(/(\d{2})(\d{0,4})(\d{0,4})/, function (_, a, b, c) {
        return (a ? '(' + a : '') + (b ? ') ' + b : '') + (c ? '-' + c : '');
      });
    }
    return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
  }

  function mascaraMoeda(valor) {
    var d = String(valor).replace(/\D/g, '');
    if (!d) return '';
    var n = (parseInt(d, 10) / 100);
    return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /* ---------- Validação ---------- */

  var Validar = {
    obrigatorio: function (v) { return String(v || '').trim().length > 0; },
    email: function (v) { return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(String(v).trim()); },
    telefone: function (v) { return String(v).replace(/\D/g, '').length >= 10; },
    minimo: function (v, n) { return String(v || '').trim().length >= n; },
    iguais: function (a, b) { return a === b && String(a).length > 0; }
  };

  // Marca/desmarca erro em um campo (.field > .input + .field-error)
  function setErro(input, mensagem) {
    var field = input.closest('.field');
    if (!field) return;
    var box = field.querySelector('.field-error');
    if (mensagem) {
      field.classList.add('invalid');
      if (box) box.textContent = mensagem;
      input.setAttribute('aria-invalid', 'true');
    } else {
      field.classList.remove('invalid');
      input.removeAttribute('aria-invalid');
    }
  }

  function limparErros(form) {
    form.querySelectorAll('.field.invalid').forEach(function (f) {
      f.classList.remove('invalid');
    });
  }

  /* ---------- DOM ---------- */

  function $(seletor, contexto) { return (contexto || document).querySelector(seletor); }
  function $$(seletor, contexto) {
    return Array.prototype.slice.call((contexto || document).querySelectorAll(seletor));
  }

  function param(nome) {
    return new URLSearchParams(window.location.search).get(nome);
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms || 250);
    };
  }

  /* ---------- LocalStorage ---------- */

  var Storage = {
    get: function (chave, padrao) {
      try {
        var bruto = localStorage.getItem(chave);
        return bruto === null ? padrao : JSON.parse(bruto);
      } catch (e) {
        console.warn('[Trato] Não foi possível ler', chave, e);
        return padrao;
      }
    },
    set: function (chave, valor) {
      try {
        localStorage.setItem(chave, JSON.stringify(valor));
        return true;
      } catch (e) {
        console.warn('[Trato] Não foi possível gravar', chave, e);
        return false;
      }
    },
    remove: function (chave) { localStorage.removeItem(chave); }
  };

  return {
    formatBRL: formatBRL,
    parseBRL: parseBRL,
    formatPercent: formatPercent,
    toDate: toDate,
    toISO: toISO,
    hojeISO: hojeISO,
    addDias: addDias,
    formatDate: formatDate,
    formatDateLong: formatDateLong,
    formatDayFull: formatDayFull,
    nomeDiaCurto: nomeDiaCurto,
    mesCurto: mesCurto,
    mesmoMes: mesmoMes,
    diffDias: diffDias,
    tempoRelativo: tempoRelativo,
    saudacao: saudacao,
    iniciais: iniciais,
    primeiroNome: primeiroNome,
    escapeHtml: escapeHtml,
    uid: uid,
    proximoNumero: proximoNumero,
    mascaraTelefone: mascaraTelefone,
    mascaraMoeda: mascaraMoeda,
    Validar: Validar,
    setErro: setErro,
    limparErros: limparErros,
    $: $,
    $$: $$,
    param: param,
    debounce: debounce,
    Storage: Storage
  };
})();
