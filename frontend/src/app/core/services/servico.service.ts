import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Despesa, Pagamento, Servico } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ServicoService {
  private base = `${environment.apiUrl}/servicos`;

  constructor(private http: HttpClient) {}

  listar(status?: string): Observable<Servico[]> {
    let params = new HttpParams();
    if (status && status !== 'todos') params = params.set('status', status);
    return this.http.get<Servico[]>(this.base, { params });
  }

  buscar(id: number): Observable<Servico> {
    return this.http.get<Servico>(`${this.base}/${id}`);
  }

  criar(dados: Servico): Observable<Servico> {
    return this.http.post<Servico>(this.base, dados);
  }

  atualizar(id: number, dados: Partial<Servico>): Observable<Servico> {
    return this.http.put<Servico>(`${this.base}/${id}`, dados);
  }

  alterarStatus(id: number, status: string): Observable<Servico> {
    return this.http.patch<Servico>(`${this.base}/${id}/status`, { status });
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  despesas(servicoId: number): Observable<Despesa[]> {
    return this.http.get<Despesa[]>(`${this.base}/${servicoId}/despesas`);
  }

  adicionarDespesa(servicoId: number, despesa: Despesa): Observable<Despesa> {
    return this.http.post<Despesa>(`${this.base}/${servicoId}/despesas`, despesa);
  }

  pagamento(servicoId: number): Observable<Pagamento> {
    return this.http.get<Pagamento>(`${this.base}/${servicoId}/pagamento`);
  }

  registrarRecebimento(servicoId: number, valor: number, forma: string): Observable<Pagamento> {
    return this.http.post<Pagamento>(`${this.base}/${servicoId}/pagamento/recebimento`, { valor, forma });
  }
}
