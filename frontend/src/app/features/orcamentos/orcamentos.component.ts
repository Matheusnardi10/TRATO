import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/layout/header/header.component';
import { OrcamentoService } from '../../core/services/orcamento.service';
import { ContratoService } from '../../core/services/contrato.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { Orcamento } from '../../core/models/models';
import { STATUS_ORCAMENTO } from '../../core/data/nichos';
import { formatBRL, formatDate } from '../../core/services/utils';

@Component({
  selector: 'app-orcamentos',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent],
  templateUrl: './orcamentos.component.html'
})
export class OrcamentosComponent implements OnInit {
  orcamentos: Orcamento[] = [];
  carregando = true;
  erro = '';
  statusFiltro = 'todos';
  statusMap = STATUS_ORCAMENTO;
  formatBRL = formatBRL;
  formatDate = formatDate;

  constructor(
    private orcamentoService: OrcamentoService,
    private contratoService: ContratoService,
    private toast: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando = true;
    this.orcamentoService.listar(this.statusFiltro).subscribe({
      next: (lista) => { this.orcamentos = lista; this.carregando = false; },
      error: () => {
        this.carregando = false;
        this.erro = 'Não foi possível carregar os orçamentos do backend. Confira se o Spring Boot está rodando em http://localhost:8080.';
      }
    });
  }

  filtrar(status: string): void {
    this.statusFiltro = status;
    this.carregar();
  }

  aprovar(o: Orcamento): void {
    this.orcamentoService.aprovar(o.id!).subscribe({
      next: () => { this.toast.mostrar('Orçamento aprovado.', 'success'); this.carregar(); },
      error: () => this.toast.mostrar('Não foi possível aprovar.', 'error')
    });
  }

  recusar(o: Orcamento): void {
    this.orcamentoService.recusar(o.id!).subscribe({
      next: () => { this.toast.mostrar('Orçamento recusado.', 'info'); this.carregar(); },
      error: () => this.toast.mostrar('Não foi possível recusar.', 'error')
    });
  }

  /** Gera (ou abre, se já existir) o contrato deste orçamento aprovado. */
  gerarContrato(o: Orcamento): void {
    this.contratoService.gerarDeOrcamento(o.id!).subscribe({
      next: (contrato) => {
        this.toast.mostrar('Contrato gerado a partir do orçamento.', 'success');
        this.router.navigate(['/app/contratos', contrato.id]);
      },
      error: () => this.toast.mostrar('Não foi possível gerar o contrato.', 'error')
    });
  }

  excluir(o: Orcamento): void {
    if (!confirm(`Excluir o orçamento #${o.numero}? Esta ação não pode ser desfeita.`)) return;
    this.orcamentoService.excluir(o.id!).subscribe({
      next: () => { this.toast.mostrar('Orçamento excluído.', 'success'); this.carregar(); },
      error: () => this.toast.mostrar('Não foi possível excluir.', 'error')
    });
  }
}
