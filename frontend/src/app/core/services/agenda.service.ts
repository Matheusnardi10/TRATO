import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Servico } from '../models/models';

/* Agenda do Trato: não existe uma entidade "Agendamento" separada — um
   agendamento é simplesmente um Serviço com data e hora (igual ao app
   original, ver js/services.js -> ScheduleService). Este serviço fala com
   o AgendaController, que expõe esses mesmos serviços sob /api/agendamentos
   mais a verificação de conflito de horário. */
@Injectable({ providedIn: 'root' })
export class AgendaService {
  private base = `${environment.apiUrl}/agendamentos`;

  constructor(private http: HttpClient) {}

  listarPorPeriodo(inicio?: string, fim?: string): Observable<Servico[]> {
    let params = new HttpParams();
    if (inicio) params = params.set('inicio', inicio);
    if (fim) params = params.set('fim', fim);
    return this.http.get<Servico[]>(this.base, { params });
  }

  criar(dados: Servico): Observable<Servico> {
    return this.http.post<Servico>(this.base, dados);
  }

  atualizar(id: number, dados: Partial<Servico>): Observable<Servico> {
    return this.http.put<Servico>(`${this.base}/${id}`, dados);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  verificarConflito(data: string, hora: string, excluirId?: number): Observable<Servico[]> {
    let params = new HttpParams().set('data', data).set('hora', hora);
    if (excluirId) params = params.set('excluirId', excluirId);
    return this.http.get<Servico[]>(`${this.base}/conflito`, { params });
  }
}
