import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Notificacao } from '../models/models';

/* Equivalente ao NotificationService original — as notificações automáticas
   (pagamento atrasado, serviço amanhã, conflito de agenda, orçamento/
   contrato aguardando) são calculadas no backend a cada listagem, nunca
   duplicadas (ver NotificacaoService.checarAutomaticas no Spring Boot). */
@Injectable({ providedIn: 'root' })
export class NotificacaoService {
  private base = `${environment.apiUrl}/notificacoes`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Notificacao[]> {
    return this.http.get<Notificacao[]>(this.base);
  }

  contarNaoLidas(): Observable<{ quantidade: number }> {
    return this.http.get<{ quantidade: number }>(`${this.base}/nao-lidas`);
  }

  marcarComoLida(id: number): Observable<void> {
    return this.http.patch<void>(`${this.base}/${id}/lida`, {});
  }

  marcarTodasComoLidas(): Observable<void> {
    return this.http.post<void>(`${this.base}/marcar-todas-lidas`, {});
  }
}
