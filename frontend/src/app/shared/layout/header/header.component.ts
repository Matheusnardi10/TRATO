import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificacaoService } from '../../../core/services/notificacao.service';
import { Notificacao } from '../../../core/models/models';

/* Réplica do header original (js/components.js -> renderHeader), usando as
   mesmas classes CSS (.header, .header-greeting, .header-actions, .dropdown,
   .btn, .user-chip, .avatar). O sininho de notificações agora busca as
   notificações reais do backend (NotificacaoController), que já calcula
   as automáticas (pagamento atrasado, serviço amanhã, conflito de agenda,
   orçamento/contrato aguardando) sem duplicar. */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="header">
      <div class="header-greeting">
        <h1>{{ titulo || (saudacao() + ', ' + primeiroNome() + '!') }}</h1>
        <p>{{ subtitulo || 'Veja o resumo do seu negócio.' }}</p>
      </div>
      <div class="header-actions">
        <div class="dropdown">
          <button class="btn btn-secondary" type="button" (click)="alternarNotificacoes()" title="Notificações">
            🔔 @if (naoLidas() > 0) { <span class="badge badge-danger badge-plain">{{ naoLidas() }}</span> }
          </button>
          @if (notificacoesAberto()) {
            <div class="dropdown-menu" style="width:320px; max-height:380px; overflow-y:auto">
              <div class="dropdown-title" style="display:flex; justify-content:space-between; align-items:center">
                <span>Notificações</span>
                @if (naoLidas() > 0) {
                  <button class="small" style="background:none;border:0;color:var(--brand);cursor:pointer" type="button" (click)="marcarTodasLidas()">Marcar todas como lidas</button>
                }
              </div>
              @for (n of notificacoes(); track n.id) {
                <div class="dropdown-item" style="cursor:default; opacity:{{ n.lida ? 0.6 : 1 }}" (click)="marcarLida(n)">
                  <strong>{{ n.titulo }}</strong>
                  <div class="small">{{ n.texto }}</div>
                </div>
              } @empty {
                <div class="dropdown-item" style="cursor:default">Nenhuma notificação por aqui.</div>
              }
            </div>
          }
        </div>
        <div class="dropdown">
          <button class="btn btn-primary" type="button" (click)="novoAberto.set(!novoAberto())">+ Novo</button>
          @if (novoAberto()) {
            <div class="dropdown-menu">
              <div class="dropdown-title">Criar</div>
              <a class="dropdown-item" routerLink="/app/clientes" [queryParams]="{ novo: 1 }" (click)="novoAberto.set(false)">👥 Novo cliente</a>
              <a class="dropdown-item" routerLink="/app/orcamentos/novo" (click)="novoAberto.set(false)">📑 Novo orçamento</a>
              <a class="dropdown-item" routerLink="/app/agenda" (click)="novoAberto.set(false)">📅 Novo agendamento</a>
            </div>
          }
        </div>
        <div class="dropdown">
          <button class="user-chip" type="button" (click)="userAberto.set(!userAberto())">
            <span class="avatar">{{ iniciais() }}</span>
            <span>
              <span class="user-name">{{ primeiroNome() }}</span>
              <span class="user-niche">{{ usuario()?.nicho || 'sem nicho' }}</span>
            </span>
          </button>
          @if (userAberto()) {
            <div class="dropdown-menu">
              <div class="dropdown-title">{{ usuario()?.email }}</div>
              <a class="dropdown-item" routerLink="/app/configuracoes" (click)="userAberto.set(false)">⚙️ Configurações</a>
              <button class="dropdown-item" type="button" (click)="sair()">↩︎ Sair</button>
            </div>
          }
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent implements OnInit {
  @Input() titulo = '';
  @Input() subtitulo = '';

  novoAberto = signal(false);
  userAberto = signal(false);
  notificacoesAberto = signal(false);
  notificacoes = signal<Notificacao[]>([]);
  naoLidas = signal(0);

  constructor(private auth: AuthService, private notificacaoService: NotificacaoService, private router: Router) {}

  ngOnInit(): void {
    this.notificacaoService.contarNaoLidas().subscribe((r) => this.naoLidas.set(r.quantidade));
  }

  usuario = () => this.auth.usuarioAtual();

  primeiroNome(): string {
    const nome = this.usuario()?.nome || '';
    return nome.split(' ')[0] || 'Você';
  }

  iniciais(): string {
    const nome = this.usuario()?.nome || '';
    return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || '?';
  }

  saudacao(): string {
    const hora = new Date().getHours();
    if (hora < 12) return 'Bom dia';
    if (hora < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  alternarNotificacoes(): void {
    const abrir = !this.notificacoesAberto();
    this.notificacoesAberto.set(abrir);
    if (abrir) {
      this.notificacaoService.listar().subscribe((lista) => {
        this.notificacoes.set(lista);
        this.naoLidas.set(lista.filter((n) => !n.lida).length);
      });
    }
  }

  marcarLida(n: Notificacao): void {
    if (n.lida) return;
    this.notificacaoService.marcarComoLida(n.id).subscribe(() => {
      n.lida = true;
      this.naoLidas.set(this.notificacoes().filter((x) => !x.lida).length);
    });
  }

  marcarTodasLidas(): void {
    this.notificacaoService.marcarTodasComoLidas().subscribe(() => {
      this.notificacoes.update((lista) => lista.map((n) => ({ ...n, lida: true })));
      this.naoLidas.set(0);
    });
  }

  sair(): void {
    this.auth.sair();
    this.router.navigate(['/login']);
  }
}
