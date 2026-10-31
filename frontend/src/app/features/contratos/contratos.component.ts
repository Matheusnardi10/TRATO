import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/layout/header/header.component';
import { ContratoService } from '../../core/services/contrato.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { Contrato } from '../../core/models/models';
import { STATUS_CONTRATO } from '../../core/data/nichos';
import { formatBRL, formatDate } from '../../core/services/utils';

/* Lista de contratos, equivalente a pages/contratos.html + js/contratos.js.
   Um contrato nasce a partir de um orçamento aprovado (botão "Gerar
   contrato" na tela de Orçamentos) — aqui só listamos, filtramos e abrimos
   o detalhe (cláusulas, aditivos, aceite, criação do serviço). */
@Component({
  selector: 'app-contratos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent],
  templateUrl: './contratos.component.html'
})
export class ContratosComponent implements OnInit {
  contratos: Contrato[] = [];
  carregando = true;
  erro = '';
  busca = '';
  statusFiltro = 'todos';
  statusMap = STATUS_CONTRATO;
  formatBRL = formatBRL;
  formatDate = formatDate;

  constructor(private contratoService: ContratoService, private toast: ToastService) {}

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando = true;
    this.contratoService.listar(this.statusFiltro).subscribe({
      next: (lista) => { this.contratos = lista; this.carregando = false; },
      error: () => {
        this.carregando = false;
        this.erro = 'Não foi possível carregar os contratos do backend. Confira se o Spring Boot está rodando em http://localhost:8080.';
      }
    });
  }

  filtrar(status: string): void {
    this.statusFiltro = status;
    this.carregar();
  }

  get listaFiltrada(): Contrato[] {
    if (!this.busca) return this.contratos;
    const alvo = this.busca.toLowerCase();
    return this.contratos.filter((c) => `${c.titulo} ${c.clienteNome ?? ''} ${c.numero ?? ''}`.toLowerCase().includes(alvo));
  }

  excluir(c: Contrato): void {
    if (!confirm(`Excluir o contrato #${c.numero}? Esta ação não pode ser desfeita.`)) return;
    this.contratoService.excluir(c.id!).subscribe({
      next: () => { this.toast.mostrar('Contrato excluído.', 'success'); this.carregar(); },
      error: () => this.toast.mostrar('Não foi possível excluir.', 'error')
    });
  }
}
