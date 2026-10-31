import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Orcamento } from '../models/models';

@Injectable({ providedIn: 'root' })
export class OrcamentoService {
  private base = `${environment.apiUrl}/orcamentos`;

  constructor(private http: HttpClient) {}

  listar(status?: string): Observable<Orcamento[]> {
    let params = new HttpParams();
    if (status && status !== 'todos') params = params.set('status', status);
    return this.http.get<Orcamento[]>(this.base, { params });
  }

  buscar(id: number): Observable<Orcamento> {
    return this.http.get<Orcamento>(`${this.base}/${id}`);
  }

  criar(dados: Orcamento): Observable<Orcamento> {
    return this.http.post<Orcamento>(this.base, dados);
  }

  atualizar(id: number, dados: Orcamento): Observable<Orcamento> {
    return this.http.put<Orcamento>(`${this.base}/${id}`, dados);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  enviar(id: number): Observable<Orcamento> {
    return this.http.post<Orcamento>(`${this.base}/${id}/enviar`, {});
  }

  aprovar(id: number): Observable<Orcamento> {
    return this.http.post<Orcamento>(`${this.base}/${id}/aprovar`, {});
  }

  recusar(id: number): Observable<Orcamento> {
    return this.http.post<Orcamento>(`${this.base}/${id}/recusar`, {});
  }
}
