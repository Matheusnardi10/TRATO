import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

/* Equivalente ao padrão usado em toda página interna do projeto original:
   <aside id="sidebar"></aside> <div class="app"><header id="header"></header>
   <main class="page">...</main></div>
   Aqui o <header> fica a cargo de cada página (porque o título/subtítulo
   muda por tela, igual no original: renderHeader({titulo, subtitulo})). */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <app-sidebar />
    <div class="app">
      <router-outlet></router-outlet>
    </div>
  `
})
export class AppShellComponent {}
