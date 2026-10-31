import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ClienteMovimentacao, LucroPorHora, PrevistoRealizado, ServicoRentavel, StatusOrcamentoResumo } from '../models/models';

/* Equivalente ao ReportService original (js/services.js). Os relatórios de
   faturamento e de receitas/despesas já existem no Dashboard e no módulo
   Financeiro — aqui ficam os outros 5 relatórios específicos. */
@Injectable({ providedIn: 'root' })
export class RelatorioService {
  private base = `${environment.apiUrl}/relatorios`;

  constructor(private http: HttpClient) {}

  servicosMaisRentaveis(quantidade = 10): Observable<ServicoRentavel[]> {
    return this.http.get<ServicoRentavel[]>(`${this.base}/servicos-mais-rentaveis`, { params: { quantidade } });
  }

  clientesPorMovimentacao(quantidade = 10): Observable<ClienteMovimentacao[]> {
    return this.http.get<ClienteMovimentacao[]>(`${this.base}/clientes-por-movimentacao`, { params: { quantidade } });
  }

  orcamentosPorStatus(): Observable<StatusOrcamentoResumo[]> {
    return this.http.get<StatusOrcamentoResumo[]>(`${this.base}/orcamentos-por-status`);
  }

  previstoXRealizado(): Observable<PrevistoRealizado[]> {
    return this.http.get<PrevistoRealizado[]>(`${this.base}/previsto-x-realizado`);
  }

  lucroPorHora(): Observable<LucroPorHora[]> {
    return this.http.get<LucroPorHora[]>(`${this.base}/lucro-por-hora`);
  }
}
