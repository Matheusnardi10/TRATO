import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AppShellComponent } from './shared/layout/app-shell/app-shell.component';

/* Todas as rotas do Trato já vivem aqui, no Angular (lazy loading por
   feature) — nenhuma tela depende mais do legado-html/, que fica só como
   referência/backup (ver README). */
export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'cadastro',
    loadComponent: () => import('./features/auth/cadastro/cadastro.component').then(m => m.CadastroComponent)
  },
  {
    /* Página pública: o cliente abre pelo link do e-mail, sem login. */
    path: 'aprovar-contrato/:token',
    loadComponent: () => import('./features/publico/aprovar-contrato/aprovar-contrato.component').then(m => m.AprovarContratoComponent)
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./features/auth/onboarding/onboarding.component').then(m => m.OnboardingComponent),
    canActivate: [authGuard]
  },
  {
    path: 'app',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'clientes',
        loadComponent: () => import('./features/clientes/clientes.component').then(m => m.ClientesComponent)
      },
      {
        path: 'orcamentos',
        loadComponent: () => import('./features/orcamentos/orcamentos.component').then(m => m.OrcamentosComponent)
      },
      {
        path: 'orcamentos/novo',
        loadComponent: () => import('./features/orcamentos/orcamento-novo/orcamento-novo.component').then(m => m.OrcamentoNovoComponent)
      },
      {
        path: 'orcamentos/:id',
        loadComponent: () => import('./features/orcamentos/orcamento-novo/orcamento-novo.component').then(m => m.OrcamentoNovoComponent)
      },
      {
        path: 'contratos',
        loadComponent: () => import('./features/contratos/contratos.component').then(m => m.ContratosComponent)
      },
      {
        path: 'contratos/:id',
        loadComponent: () => import('./features/contratos/contrato-detalhe/contrato-detalhe.component').then(m => m.ContratoDetalheComponent)
      },
      {
        path: 'agenda',
        loadComponent: () => import('./features/agenda/agenda.component').then(m => m.AgendaComponent)
      },
      {
        path: 'servicos',
        loadComponent: () => import('./features/servicos/servicos.component').then(m => m.ServicosComponent)
      },
      {
        path: 'servicos/:id',
        loadComponent: () => import('./features/servicos/servico-detalhe/servico-detalhe.component').then(m => m.ServicoDetalheComponent)
      },
      {
        path: 'financeiro',
        loadComponent: () => import('./features/financeiro/financeiro.component').then(m => m.FinanceiroComponent)
      },
      {
        path: 'relatorios',
        loadComponent: () => import('./features/relatorios/relatorios.component').then(m => m.RelatoriosComponent)
      },
      {
        path: 'configuracoes',
        loadComponent: () => import('./features/configuracoes/configuracoes.component').then(m => m.ConfiguracoesComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
