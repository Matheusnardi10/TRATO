import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Aditivo, Clausula, Contrato, ContratoPublico, Servico } from '../models/models';

/* Equivalente ao ContractService original (js/services.js), agora falando
   com o backend (ContratoController) em vez do LocalStorage. */
@Injectable({ providedIn: 'root' })
export class ContratoService {
  private base = `${environment.apiUrl}/contratos`;

  constructor(private http: HttpClient) {}

  listar(status?: string): Observable<Contrato[]> {
    let params = new HttpParams();
    if (status && status !== 'todos') params = params.set('status', status);
    return this.http.get<Contrato[]>(this.base, { params });
  }

  buscar(id: number): Observable<Contrato> {
    return this.http.get<Contrato>(`${this.base}/${id}`);
  }

  gerarDeOrcamento(orcamentoId: number): Observable<Contrato> {
    return this.http.post<Contrato>(`${this.base}/gerar-de-orcamento/${orcamentoId}`, {});
  }

  enviarParaAceite(id: number): Observable<Contrato> {
    return this.http.post<Contrato>(`${this.base}/${id}/enviar-aceite`, {});
  }

  marcarAceito(id: number): Observable<Contrato> {
    return this.http.post<Contrato>(`${this.base}/${id}/marcar-aceito`, {});
  }

  concluir(id: number): Observable<Contrato> {
    return this.http.post<Contrato>(`${this.base}/${id}/concluir`, {});
  }

  cancelar(id: number): Observable<Contrato> {
    return this.http.post<Contrato>(`${this.base}/${id}/cancelar`, {});
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  atualizarClausulas(id: number, clausulas: Clausula[]): Observable<Contrato> {
    return this.http.put<Contrato>(`${this.base}/${id}/clausulas`, clausulas);
  }

  atualizarDados(id: number, dados: Record<string, string>): Observable<Contrato> {
    return this.http.put<Contrato>(`${this.base}/${id}/dados`, dados);
  }

  adicionarAditivo(id: number, aditivo: Aditivo): Observable<Contrato> {
    return this.http.post<Contrato>(`${this.base}/${id}/aditivos`, aditivo);
  }

  removerAditivo(id: number, aditivoId: number): Observable<Contrato> {
    return this.http.delete<Contrato>(`${this.base}/${id}/aditivos/${aditivoId}`);
  }

  criarServico(id: number, data?: string, hora?: string): Observable<Servico> {
    return this.http.post<Servico>(`${this.base}/${id}/criar-servico`, { data, hora });
  }

  /* ---------- Página pública do cliente (link do e-mail, sem login) ---------- */

  buscarPublico(token: string): Observable<ContratoPublico> {
    return this.http.get<ContratoPublico>(`${environment.apiUrl}/publico/contratos/${encodeURIComponent(token)}`);
  }

  aprovarPublico(token: string): Observable<ContratoPublico> {
    return this.http.post<ContratoPublico>(`${environment.apiUrl}/publico/contratos/${encodeURIComponent(token)}/aprovar`, {});
  }
}
