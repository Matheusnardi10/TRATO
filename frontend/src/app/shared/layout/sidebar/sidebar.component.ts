import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface ItemMenu {
  id: string;
  nome: string;
  icone: string;
  rota: string;
}

/* Réplica fiel do sidebar original (js/components.js -> renderSidebar).
   Mesmas classes CSS (.sidebar, .sidebar-brand, .nav, .nav-item, .nav-icon,
   .sidebar-foot, .plan-card), para herdar 100% do visual já pronto em
   layout.css/components.css sem reescrever nada.

   Todos os itens já navegam via Angular Router — nenhum módulo depende
   mais do legado-html/. */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <a class="sidebar-brand" routerLink="/app/dashboard">
        <svg class="logo-mark" width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <rect x="1.5" y="1.5" width="29" height="29" rx="8" stroke="#3E877C" stroke-width="2"/>
          <path d="M8 20.5l5-6 4.5 4L24 10" stroke="#3E877C" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="24" cy="10" r="2.6" fill="#3E877C"/>
        </svg>
        <span class="logo-text">Trato<span class="logo-sub">gestão de serviços</span></span>
      </a>

      <nav class="nav" aria-label="Menu principal">
        <div class="nav-label">Operação</div>
        @for (item of itens; track item.id) {
          <a class="nav-item" [routerLink]="item.rota" routerLinkActive="active">
            <span class="nav-icon">{{ item.icone }}</span>{{ item.nome }}
          </a>
        }
      </nav>

      <div class="sidebar-foot">
        <div class="plan-card">
          <strong>Trato</strong>
          <span>Gestão completa do seu negócio em um só lugar.</span>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  @Input() paginaAtiva = '';

  itens: ItemMenu[] = [
    { id: 'dashboard', nome: 'Dashboard', icone: '📊', rota: '/app/dashboard' },
    { id: 'clientes', nome: 'Clientes', icone: '👥', rota: '/app/clientes' },
    { id: 'orcamentos', nome: 'Orçamentos', icone: '📑', rota: '/app/orcamentos' },
    { id: 'contratos', nome: 'Contratos', icone: '📄', rota: '/app/contratos' },
    { id: 'agenda', nome: 'Agenda', icone: '📅', rota: '/app/agenda' },
    { id: 'servicos', nome: 'Serviços', icone: '🔨', rota: '/app/servicos' },
    { id: 'financeiro', nome: 'Financeiro', icone: '💰', rota: '/app/financeiro' },
    { id: 'relatorios', nome: 'Relatórios', icone: '📈', rota: '/app/relatorios' },
    { id: 'configuracoes', nome: 'Configurações', icone: '⚙️', rota: '/app/configuracoes' }
  ];
}
