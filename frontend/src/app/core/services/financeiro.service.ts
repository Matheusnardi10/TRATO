import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategoriaDespesaResumo, Pagamento, PontoFluxoCaixa, ResumoFinanceiro, ResumoMes } from '../models/models';

/* Dois conjuntos de endpoints num só serviço, como no original: o resumo
   do mês usado pelo Dashboard (DashboardController) e o módulo completo de
   Financeiro (FinanceiroController) — contas a receber/pagar, despesas por
   categoria e fluxo de caixa. Em ambos os casos o cálculo (faturamento,
   custos, lucro, margem, saldo) é feito no backend, nunca no navegador. */
@Injectable({ providedIn: 'root' })
export class FinanceiroService {
  private baseDashboard = `${environment.apiUrl}/dashboard`;
  private baseFinanceiro = `${environment.apiUrl}/financeiro`;

  constructor(private http: HttpClient) {}

  resumoMes(): Observable<ResumoMes> {
    return this.http.get<ResumoMes>(`${this.baseDashboard}/resumo-mes`);
  }

  historico(): Observable<{ mes: number; ano: number; faturamento: number; custos: number; lucro: number }[]> {
    return this.http.get<any[]>(`${this.baseDashboard}/historico`);
  }

  alertas(): Observable<{ tipo: string; icone: string; titulo: string; texto: string }[]> {
    return this.http.get<any[]>(`${this.baseDashboard}/alertas`);
  }

  /* ---------- Módulo Financeiro ---------- */

  resumo(periodo?: string): Observable<ResumoFinanceiro> {
    return this.http.get<ResumoFinanceiro>(`${this.baseFinanceiro}/resumo`, { params: periodo ? { periodo } : {} });
  }

  despesasPorCategoria(periodo?: string): Observable<CategoriaDespesaResumo[]> {
    return this.http.get<CategoriaDespesaResumo[]>(`${this.baseFinanceiro}/despesas-por-categoria`, { params: periodo ? { periodo } : {} });
  }

  fluxoCaixa(dias = 30): Observable<PontoFluxoCaixa[]> {
    return this.http.get<PontoFluxoCaixa[]>(`${this.baseFinanceiro}/fluxo-caixa`, { params: { dias } });
  }

  pagamentos(): Observable<Pagamento[]> {
    return this.http.get<Pagamento[]>(`${this.baseFinanceiro}/pagamentos`);
  }
}
