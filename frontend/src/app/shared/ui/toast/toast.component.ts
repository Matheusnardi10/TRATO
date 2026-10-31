import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

const ICONES: Record<string, string> = { success: '✅', error: '⛔', warning: '⚠️', info: 'ℹ️' };

@Component({
  selector: 'app-toast-wrap',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-wrap">
      @for (t of toastService.toasts(); track t.id) {
        <div class="toast" [ngClass]="t.tipo">
          <span class="toast-icon">{{ icone(t.tipo) }}</span>
          <div>{{ t.mensagem }}</div>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  constructor(public toastService: ToastService) {}
  icone(tipo: string): string { return ICONES[tipo] || 'ℹ️'; }
}
