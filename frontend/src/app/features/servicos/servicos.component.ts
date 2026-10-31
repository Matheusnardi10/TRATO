import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/layout/header/header.component';
import { ServicoService } from '../../core/services/servico.service';
import { Servico } from '../../core/models/models';
import { STATUS_SERVICO } from '../../core/data/nichos';
import { formatBRL, formatDate, iniciais } from '../../core/services/utils';
import { Calc } from '../../core/services/calc';

/* Lista de serviços, equivalente a pages/servicos.html + js/servicos.js.
   Cada serviço nasce de um orçamento aprovado ou de um contrato ("Criar
   serviço"); aqui só listamos, filtramos e abrimos o detalhe. */
@Component({
  selector: 'app-servicos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent],
  templateUrl: './servicos.component.html'
})
export class ServicosComponent implements OnInit {
  servicos: Servico[] = [];
  carregando = true;
  erro = '';
  busca = '';
  statusFiltro = 'todos';
  statusMap = STATUS_SERVICO;
  formatBRL = formatBRL;
  formatDate = formatDate;
  iniciais = iniciais;

  constructor(private servicoService: ServicoService) {}

  ngOnInit(): void { this.carregar(); }

  carregar(): void {
    this.carregando = true;
    this.servicoService.listar(this.statusFiltro).subscribe({
      next: (lista) => { this.servicos = lista; this.carregando = false; },
      error: () => {
        this.carregando = false;
        this.erro = 'Não foi possível carregar os serviços do backend. Confira se o Spring Boot está rodando em http://localhost:8080.';
      }
    });
  }

  filtrar(status: string): void {
    this.statusFiltro = status;
    this.carregar();
  }

  get listaFiltrada(): Servico[] {
    if (!this.busca) return this.servicos;
    const alvo = this.busca.toLowerCase();
    return this.servicos.filter((s) => `${s.titulo} ${s.clienteNome ?? ''} ${s.numero ?? ''}`.toLowerCase().includes(alvo));
  }

  lucro(s: Servico): number {
    return Calc.lucro(s.valor, s.custoReal);
  }
}
