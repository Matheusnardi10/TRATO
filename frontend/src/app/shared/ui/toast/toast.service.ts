import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; mensagem: string; tipo: 'success' | 'error' | 'warning' | 'info'; }

/* Equivalente ao showToast() global do projeto original (js/components.js). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private proximoId = 1;

  mostrar(mensagem: string, tipo: Toast['tipo'] = 'info'): void {
    const id = this.proximoId++;
    this.toasts.update((lista) => [...lista, { id, mensagem, tipo }]);
    setTimeout(() => {
      this.toasts.update((lista) => lista.filter((t) => t.id !== id));
    }, 3800);
  }
}
