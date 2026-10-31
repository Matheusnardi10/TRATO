import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Cliente } from '../models/models';

/* Substitui o antigo ClientService (LocalStorage) por chamadas reais ao
   backend. Os nomes dos métodos foram mantidos o mais parecido possível
   com o original (listar/buscar/criar/atualizar/excluir) para facilitar
   a conferência com js/services.js. */
@Injectable({ providedIn: 'root' })
export class ClienteService {
  private base = `${environment.apiUrl}/clientes`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.base);
  }

  buscar(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.base}/${id}`);
  }

  criar(dados: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.base, dados);
  }

  atualizar(id: number, dados: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.base}/${id}`, dados);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
