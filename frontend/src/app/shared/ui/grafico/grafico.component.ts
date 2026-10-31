import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { formatBRL, mesCurto } from '../../../core/services/utils';

export interface PontoHistorico { mes: number; ano: number; faturamento: number; custos: number; lucro: number; }

/* Réplica exata do js/chart.js (SVG puro, sem biblioteca) — mesma geometria
   (margens, largura de barra, eixo), para o gráfico continuar com a cara
   do projeto original. */
@Component({
  selector: 'app-grafico',
  standalone: true,
  imports: [CommonModule],
  template: `<div [innerHTML]="svg"></div>`
})
export class GraficoComponent implements OnChanges {
  @Input() dados: PontoHistorico[] = [];
  svg: SafeHtml = '';

  private L = 52; private R = 14; private T = 18; private B = 30;
  private W = 720; private H = 270;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(): void {
    this.svg = this.sanitizer.bypassSecurityTrustHtml(this.montar(this.dados));
  }

  private abreviar(valor: number): string {
    if (valor >= 1000) return Math.round(valor / 1000) + ' mil';
    return String(Math.round(valor));
  }

  private montar(dados: PontoHistorico[]): string {
    if (!dados || !dados.length) {
      return '<div class="empty"><p class="small">Ainda não há histórico para exibir.</p></div>';
    }
    const { L, R, T, B, W, H } = this;
    const plotW = W - L - R;
    const plotH = H - T - B;
    const maximo = Math.max(...dados.map(d => Math.max(d.faturamento, d.custos, d.lucro))) * 1.15 || 1;
    const grupo = plotW / dados.length;
    const larguraBarra = Math.min(26, grupo / 4);
    const espaco = 6;
    const y = (valor: number) => T + plotH - (valor / maximo) * plotH;
    const xGrupo = (i: number) => L + grupo * i + grupo / 2;

    let svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Faturamento, custos e lucro dos últimos meses">`;

    for (let g = 0; g <= 4; g++) {
      const valor = (maximo / 4) * g;
      const py = y(valor);
      svg += `<line class="grid-line" x1="${L}" y1="${py}" x2="${W - R}" y2="${py}"/>`;
      svg += `<text class="axis-text" x="${L - 10}" y="${py + 4}" text-anchor="end">${this.abreviar(valor)}</text>`;
    }

    dados.forEach((d, i) => {
      const centro = xGrupo(i);
      const x1 = centro - larguraBarra - espaco / 2;
      const x2 = centro + espaco / 2;
      svg += `<rect class="bar bar-revenue" x="${x1}" y="${y(d.faturamento)}" width="${larguraBarra}" height="${T + plotH - y(d.faturamento)}" rx="3"><title>Faturamento: ${formatBRL(d.faturamento)}</title></rect>`;
      svg += `<rect class="bar bar-cost" x="${x2}" y="${y(d.custos)}" width="${larguraBarra}" height="${T + plotH - y(d.custos)}" rx="3"><title>Custos: ${formatBRL(d.custos)}</title></rect>`;
      svg += `<text class="axis-text" x="${centro}" y="${H - 10}" text-anchor="middle">${mesCurto(d.mes)}</text>`;
    });

    const pontos = dados.map((d, i) => `${xGrupo(i)},${y(d.lucro)}`).join(' ');
    svg += `<polyline class="profit-line" points="${pontos}"/>`;
    dados.forEach((d, i) => {
      svg += `<circle class="profit-dot" cx="${xGrupo(i)}" cy="${y(d.lucro)}" r="4"><title>Lucro: ${formatBRL(d.lucro)}</title></circle>`;
    });

    svg += '</svg>';
    svg += `<div class="chart-legend mt-8">
      <span><i style="background:var(--brand)"></i>Faturamento</span>
      <span><i style="background:#E4B35C"></i>Custos</span>
      <span><i style="background:var(--success)"></i>Lucro</span>
    </div>`;
    return svg;
  }
}
