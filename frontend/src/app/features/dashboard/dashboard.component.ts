import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/layout/header/header.component';
import { GraficoComponent, PontoHistorico } from '../../shared/ui/grafico/grafico.component';
import { FinanceiroService } from '../../core/services/financeiro.service';
import { ServicoService } from '../../core/services/servico.service';
import { AuthService } from '../../core/services/auth.service';
import { formatBRL, formatDate, formatPercent, iniciais } from '../../core/services/utils';
import { Calc } from '../../core/services/calc';
import { ResumoMes, Servico } from '../../core/models/models';
import { STATUS_SERVICO } from '../../core/data/nichos';

interface Alerta { tipo: string; icone: string; titulo: string; texto: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, GraficoComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  resumo: ResumoMes | null = null;
  historico: PontoHistorico[] = [];
  alertas: Alerta[] = [];
  servicosRecentes: Servico[] = [];
  proximosServicos: Servico[] = [];
  carregando = true;
  erro = '';

  statusMap = STATUS_SERVICO;
  formatBRL = formatBRL;
  formatPercent = formatPercent;
  formatDate = formatDate;
  iniciais = iniciais;

  constructor(
    private financeiro: FinanceiroService,
    private servicoService: ServicoService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.financeiro.resumoMes().subscribe({
      next: (r) => (this.resumo = r),
      error: () => (this.erro = 'Não foi possível carregar os indicadores do backend. Confira se o Spring Boot está rodando em http://localhost:8080.')
    });
    this.financeiro.historico().subscribe((h) => (this.historico = h));
    this.financeiro.alertas().subscribe((a) => (this.alertas = a));

    this.servicoService.listar().subscribe((lista) => {
      this.servicosRecentes = lista
        .slice()
        .sort((a, b) => (a.data < b.data ? 1 : -1))
        .slice(0, 6);

      const hoje = new Date().toISOString().slice(0, 10);
      this.proximosServicos = lista
        .filter((s) => s.data >= hoje && s.status !== 'cancelado' && s.status !== 'concluido')
        .sort((a, b) => (a.data === b.data ? (a.hora < b.hora ? -1 : 1) : a.data < b.data ? -1 : 1))
        .slice(0, 6);

      this.carregando = false;
    });
  }

  lucroEstimado(s: Servico): number {
    return Calc.lucro(s.valor, s.custoPrevisto);
  }
}
