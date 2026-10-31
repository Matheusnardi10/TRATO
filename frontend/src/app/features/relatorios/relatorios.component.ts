import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/layout/header/header.component';
import { RelatorioService } from '../../core/services/relatorio.service';
import {
  ClienteMovimentacao, LucroPorHora, PrevistoRealizado, ServicoRentavel, StatusOrcamentoResumo
} from '../../core/models/models';
import { formatBRL, formatPercent, exportarCSV } from '../../core/services/utils';

type Aba = 'rentaveis' | 'clientes' | 'orcamentos' | 'previsto' | 'hora';

/* Relatórios — equivalente a pages/relatorios.html + js/relatorios.js.
   Faturamento e receitas/despesas já aparecem no Dashboard e no Financeiro;
   aqui ficam os 5 relatórios específicos (ReportService original), cada
   um com exportação para CSV. */
@Component({
  selector: 'app-relatorios',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './relatorios.component.html'
})
export class RelatoriosComponent implements OnInit {
  aba: Aba = 'rentaveis';
  carregando = true;
  erro = '';

  rentaveis: ServicoRentavel[] = [];
  clientes: ClienteMovimentacao[] = [];
  orcamentos: StatusOrcamentoResumo[] = [];
  previsto: PrevistoRealizado[] = [];
  porHora: LucroPorHora[] = [];

  formatBRL = formatBRL;
  formatPercent = formatPercent;

  constructor(private relatorioService: RelatorioService) {}

  ngOnInit(): void {
    this.carregando = true;
    this.relatorioService.servicosMaisRentaveis(10).subscribe({
      next: (lista) => { this.rentaveis = lista; this.carregando = false; },
      error: () => {
        this.carregando = false;
        this.erro = 'Não foi possível carregar os relatórios do backend. Confira se o Spring Boot está rodando em http://localhost:8080.';
      }
    });
    this.relatorioService.clientesPorMovimentacao(10).subscribe((l) => (this.clientes = l));
    this.relatorioService.orcamentosPorStatus().subscribe((l) => (this.orcamentos = l));
    this.relatorioService.previstoXRealizado().subscribe((l) => (this.previsto = l));
    this.relatorioService.lucroPorHora().subscribe((l) => (this.porHora = l));
  }

  get totalOrcamentos(): number {
    return this.orcamentos.reduce((soma, o) => soma + o.quantidade, 0) || 1;
  }

  exportar(): void {
    switch (this.aba) {
      case 'rentaveis':
        exportarCSV('servicos-mais-rentaveis', ['Serviço', 'Valor', 'Custo real', 'Lucro', 'Margem (%)'],
          this.rentaveis.map((r) => [r.titulo, r.valor, r.custoReal, r.lucroAtual, r.margem.toFixed(1)]));
        break;
      case 'clientes':
        exportarCSV('clientes-por-movimentacao', ['Cliente', 'Quantidade de serviços', 'Total'],
          this.clientes.map((c) => [c.nome, c.quantidade, c.total]));
        break;
      case 'orcamentos':
        exportarCSV('orcamentos-por-status', ['Status', 'Quantidade', 'Valor'],
          this.orcamentos.map((o) => [o.status, o.quantidade, o.valor]));
        break;
      case 'previsto':
        exportarCSV('previsto-x-realizado', ['Serviço', 'Custo previsto', 'Custo real', 'Diferença'],
          this.previsto.map((p) => [p.titulo, p.previsto, p.real, p.diferenca]));
        break;
      case 'hora':
        exportarCSV('lucro-por-hora', ['Serviço', 'Horas trabalhadas', 'Lucro por hora'],
          this.porHora.map((h) => [h.titulo, h.horas, h.lucroPorHora.toFixed(2)]));
        break;
    }
  }
}
