/* ============================================================
   TRATO — chart.js
   Gráfico simples desenhado em SVG puro (sem biblioteca externa).
   Se um dia quiser usar Chart.js, basta trocar este arquivo:
   a interface continua sendo Chart.faturamentoCustosLucro(el, dados).
   ============================================================ */

var Grafico = (function () {

  var L = 52, R = 14, T = 18, B = 30;   // margens internas
  var W = 720, H = 270;                 // área de desenho (viewBox)

  function abreviar(valor) {
    if (valor >= 1000) return Math.round(valor / 1000) + ' mil';
    return String(Math.round(valor));
  }

  function faturamentoCustosLucro(elemento, dados) {
    if (!elemento) return;
    if (!dados || !dados.length) {
      elemento.innerHTML = '<div class="empty"><p class="small">Ainda não há histórico para exibir.</p></div>';
      return;
    }

    var plotW = W - L - R;
    var plotH = H - T - B;
    var maximo = Math.max.apply(null, dados.map(function (d) {
      return Math.max(d.faturamento, d.custos, d.lucro);
    })) * 1.15 || 1;

    var grupo = plotW / dados.length;
    var larguraBarra = Math.min(26, grupo / 4);
    var espaco = 6;

    function y(valor) { return T + plotH - (valor / maximo) * plotH; }
    function xGrupo(i) { return L + grupo * i + grupo / 2; }

    var svg = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Faturamento, custos e lucro dos últimos meses">';

    // Linhas de grade e valores do eixo Y
    for (var g = 0; g <= 4; g++) {
      var valor = (maximo / 4) * g;
      var py = y(valor);
      svg += '<line class="grid-line" x1="' + L + '" y1="' + py + '" x2="' + (W - R) + '" y2="' + py + '"/>';
      svg += '<text class="axis-text" x="' + (L - 10) + '" y="' + (py + 4) + '" text-anchor="end">' + abreviar(valor) + '</text>';
    }

    // Barras (faturamento e custos)
    dados.forEach(function (d, i) {
      var centro = xGrupo(i);
      var x1 = centro - larguraBarra - espaco / 2;
      var x2 = centro + espaco / 2;

      svg += '<rect class="bar bar-revenue" x="' + x1 + '" y="' + y(d.faturamento) + '" width="' + larguraBarra +
        '" height="' + (T + plotH - y(d.faturamento)) + '" rx="3">' +
        '<title>Faturamento: ' + Utils.formatBRL(d.faturamento) + '</title></rect>';

      svg += '<rect class="bar bar-cost" x="' + x2 + '" y="' + y(d.custos) + '" width="' + larguraBarra +
        '" height="' + (T + plotH - y(d.custos)) + '" rx="3">' +
        '<title>Custos: ' + Utils.formatBRL(d.custos) + '</title></rect>';

      svg += '<text class="axis-text" x="' + centro + '" y="' + (H - 10) + '" text-anchor="middle">' +
        Utils.mesCurto(d.mes) + '</text>';
    });

    // Linha do lucro
    var pontos = dados.map(function (d, i) { return xGrupo(i) + ',' + y(d.lucro); }).join(' ');
    svg += '<polyline class="profit-line" points="' + pontos + '"/>';
    dados.forEach(function (d, i) {
      svg += '<circle class="profit-dot" cx="' + xGrupo(i) + '" cy="' + y(d.lucro) + '" r="4">' +
        '<title>Lucro: ' + Utils.formatBRL(d.lucro) + '</title></circle>';
    });

    svg += '</svg>';

    elemento.innerHTML = svg +
      '<div class="chart-legend mt-8">' +
        '<span><i style="background:var(--brand)"></i>Faturamento</span>' +
        '<span><i style="background:#E4B35C"></i>Custos</span>' +
        '<span><i style="background:var(--success)"></i>Lucro</span>' +
      '</div>';
  }

  return { faturamentoCustosLucro: faturamentoCustosLucro };
})();
