import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ContratoService } from '../../../core/services/contrato.service';
import { ContratoPublico } from '../../../core/models/models';
import { formatBRL, formatDate, formatDateTime } from '../../../core/services/utils';

/* Página pública que o cliente abre pelo link do e-mail para ler e aprovar
   o contrato — equivalente ao legado-html/pages/aprovacao-orcamento.html,
   mas para contratos. Ao aprovar, o contrato já fica "ativo" no Trato. */
@Component({
  selector: 'app-aprovar-contrato',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './aprovar-contrato.component.html',
  styles: [`
    :host { display: block; background: var(--bg); min-height: 100vh; }
    .pub-wrap { max-width: 820px; margin: 0 auto; padding: 32px 20px 80px; }
    .pub-nav { padding: 6px 0 26px; font-family: var(--font-display); font-weight: 700; font-size: 18px; }
    .pub-cta { margin-top: 22px; }
    .pub-cta .btn { width: 100%; padding: 16px; font-size: 15px; }
    .pub-check { display: flex; gap: 10px; align-items: flex-start; margin-top: 22px; font-size: 14px; cursor: pointer; }
    .pub-check input { margin-top: 3px; }
    .pub-status { text-align: center; padding: 60px 20px; }
    .pub-status .emoji { font-size: 40px; display: block; margin-bottom: 14px; }
  `]
})
export class AprovarContratoComponent implements OnInit {
  contrato: ContratoPublico | null = null;
  carregando = true;
  erro = '';
  concordo = false;
  aprovando = false;
  erroAprovar = '';

  formatBRL = formatBRL;
  formatDate = formatDate;
  formatDateTime = formatDateTime;

  private token = '';

  constructor(private contratoService: ContratoService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    this.contratoService.buscarPublico(this.token).subscribe({
      next: (c) => { this.contrato = c; this.carregando = false; },
      error: () => {
        this.carregando = false;
        this.erro = 'Verifique se o link está correto ou peça um novo link ao profissional.';
      }
    });
  }

  get aprovado(): boolean {
    return this.contrato?.status === 'ativo' || this.contrato?.status === 'concluido';
  }

  aprovar(): void {
    if (!this.concordo || this.aprovando) return;
    this.aprovando = true;
    this.erroAprovar = '';
    this.contratoService.aprovarPublico(this.token).subscribe({
      next: (c) => { this.contrato = c; this.aprovando = false; window.scrollTo({ top: 0, behavior: 'smooth' }); },
      error: (e) => {
        this.aprovando = false;
        this.erroAprovar = e?.error?.erro || 'Não foi possível registrar a aprovação. Tente novamente.';
      }
    });
  }

  paragrafos(texto?: string): string[] {
    return (texto ?? '').split('\n\n').filter((p) => p.trim().length > 0);
  }
}
