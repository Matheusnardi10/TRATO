import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginResponse, Negocio, Usuario } from '../models/models';

const CHAVE_SESSAO = 'trato.sessao.usuario';

/* AuthService — substitui o antigo Store.Sessao + AuthService (LocalStorage)
   por chamadas reais a POST /api/auth/login no backend Spring Boot.
   O usuário autenticado continua guardado em localStorage (igual ao
   projeto original), mas agora é o BACKEND quem valida e-mail/senha —
   o frontend não faz mais essa checagem sozinho. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  usuarioAtual = signal<Usuario | null>(this.lerSessao());

  constructor(private http: HttpClient) {}

  private lerSessao(): Usuario | null {
    try {
      const bruto = localStorage.getItem(CHAVE_SESSAO);
      return bruto ? JSON.parse(bruto) : null;
    } catch {
      return null;
    }
  }

  entrar(email: string, senha: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, senha }).pipe(
      tap((resposta) => {
        if (resposta.ok && resposta.usuario) {
          localStorage.setItem(CHAVE_SESSAO, JSON.stringify(resposta.usuario));
          this.usuarioAtual.set(resposta.usuario);
        }
      })
    );
  }

  criar(dados: Partial<Usuario> & { senha: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/cadastro`, dados).pipe(
      tap((resposta) => {
        if (resposta.ok && resposta.usuario) {
          localStorage.setItem(CHAVE_SESSAO, JSON.stringify(resposta.usuario));
          this.usuarioAtual.set(resposta.usuario);
        }
      })
    );
  }

  atualizarNicho(nicho: string): Observable<Usuario> {
    const usuario = this.usuarioAtual();
    return this.http.put<Usuario>(`${environment.apiUrl}/usuarios/${usuario?.id}`, { ...usuario, nicho }).pipe(
      tap((atualizado) => {
        localStorage.setItem(CHAVE_SESSAO, JSON.stringify(atualizado));
        this.usuarioAtual.set(atualizado);
      })
    );
  }

  /** Configurações → aba Perfil. */
  atualizarPerfil(dados: { nome: string; nomeProfissional: string; telefone: string }): Observable<Usuario> {
    const usuario = this.usuarioAtual();
    return this.http.put<Usuario>(`${environment.apiUrl}/usuarios/${usuario?.id}/perfil`, dados).pipe(
      tap((atualizado) => {
        localStorage.setItem(CHAVE_SESSAO, JSON.stringify(atualizado));
        this.usuarioAtual.set(atualizado);
      })
    );
  }

  /** Configurações → aba Negócio. */
  atualizarNegocio(dados: Negocio): Observable<Usuario> {
    const usuario = this.usuarioAtual();
    return this.http.put<Usuario>(`${environment.apiUrl}/usuarios/${usuario?.id}/negocio`, dados).pipe(
      tap((atualizado) => {
        localStorage.setItem(CHAVE_SESSAO, JSON.stringify(atualizado));
        this.usuarioAtual.set(atualizado);
      })
    );
  }

  /** Configurações → alterar senha. */
  alterarSenha(senhaAtual: string, novaSenha: string): Observable<LoginResponse> {
    const usuario = this.usuarioAtual();
    return this.http.put<LoginResponse>(`${environment.apiUrl}/usuarios/${usuario?.id}/senha`, { senhaAtual, novaSenha });
  }

  estaLogado(): boolean {
    return !!this.usuarioAtual();
  }

  sair(): void {
    localStorage.removeItem(CHAVE_SESSAO);
    this.usuarioAtual.set(null);
  }
}
