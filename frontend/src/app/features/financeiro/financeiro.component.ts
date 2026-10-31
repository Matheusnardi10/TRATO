import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/layout/header/header.component';
import { FinanceiroService } from '../../core/services/financeiro.service';
import { CategoriaDespesaResumo, Pagamento, PontoFluxoCaixa, ResumoFinanceiro } from '../../core/models/models';
import { STATUS_PAGAMENTO } from '../../core/data/nichos';
import { formatBRL, formatDate } from '../../core/services/utils';

/* Financeiro — equivalente a pages/financeiro.html + js/financeiro.js.
   Receitas/despesas/saldo e fluxo de caixa são sempre calculados pelo
   backend (FinanceiroController), nunca no navegador. */
@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [CommonModule, HeaderComponent],
  templateUrl: './financeiro.component.html'
})
export class FinanceiroComponent implements OnInit {
  periodo = 'mes';
  resumo: ResumoFinanceiro | null = null;
  categorias: CategoriaDespesaResumo[] = [];
  fluxo: PontoFluxoCaixa[] = [];
  pagamentos: Pagamento[] = [];
  carregando = true;
  erro = '';

  statusMap = STATUS_PAGAMENTO;
  formatBRL = formatBRL;
  formatDate = formatDate;

  constructor(private financeiro: FinanceiroService) {}

  ngOnInit(): void {
    this.carregar();
    this.financeiro.pagamentos().subscribe((lista) => (this.pagamentos = lista));
    this.financeiro.fluxoCaixa(30).subscribe((lista) => (this.fluxo = lista));
  }

  carregar(): void {
    this.carregando = true;
    this.financeiro.resumo(this.periodo).subscribe({
      next: (r) => { this.resumo = r; this.carregando = false; },
      error: () => {
        this.carregando = false;
        this.erro = 'Não foi possível carregar o financeiro do backend. Confira se o Spring Boot está rodando em http://localhost:8080.';
      }
    });
    this.financeiro.despesasPorCategoria(this.periodo).subscribe((lista) => (this.categorias = lista));
  }

  filtrar(periodo: string): void {
    this.periodo = periodo;
    this.carregar();
  }

  get totalDespesas(): number {
    return this.categorias.reduce((soma, c) => soma + c.valor, 0) || 1;
  }

  get maiorFluxo(): number {
    return Math.max(1, ...this.fluxo.map((f) => Math.max(f.entradas, f.saidas)));
  }
}
