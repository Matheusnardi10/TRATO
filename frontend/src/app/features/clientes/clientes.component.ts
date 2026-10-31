import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/layout/header/header.component';
import { ClienteService } from '../../core/services/cliente.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { Cliente } from '../../core/models/models';

/* Lista de clientes + modal de CRUD, equivalente a pages/clientes.html +
   js/clientes.js, agora falando com o backend via ClienteService (HttpClient)
   em vez do LocalStorage. */
@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, HeaderComponent],
  templateUrl: './clientes.component.html'
})
export class ClientesComponent implements OnInit {
  private fb = inject(FormBuilder);
  clientes: Cliente[] = [];
  carregando = true;
  erro = '';
  busca = '';
  statusFiltro: 'todos' | 'ativo' | 'inativo' = 'todos';

  modalAberto = signal(false);
  excluirAberto = signal(false);
  editandoId: number | null = null;
  clienteParaExcluir: Cliente | null = null;
  salvando = false;

  form = this.fb.group({
    nome: ['', Validators.required],
    telefone: ['', Validators.required],
    email: ['', Validators.email],
    documento: [''],
    endereco: [''],
    status: ['ativo', Validators.required],
    observacoes: ['']
  });

  constructor(
    private clienteService: ClienteService,
    private toast: ToastService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.carregar();
    if (this.route.snapshot.queryParamMap.get('novo') === '1') this.abrirNovo();
  }

  carregar(): void {
    this.carregando = true;
    this.clienteService.listar().subscribe({
      next: (lista) => { this.clientes = lista; this.carregando = false; },
      error: () => {
        this.carregando = false;
        this.erro = 'Não foi possível carregar os clientes do backend. Confira se o Spring Boot está rodando em http://localhost:8080.';
      }
    });
  }

  get listaFiltrada(): Cliente[] {
    return this.clientes.filter((c) => {
      if (this.statusFiltro !== 'todos' && c.status !== this.statusFiltro) return false;
      if (!this.busca) return true;
      const alvo = `${c.nome} ${c.telefone ?? ''} ${c.email ?? ''}`.toLowerCase();
      return alvo.includes(this.busca.toLowerCase());
    });
  }

  abrirNovo(): void {
    this.editandoId = null;
    this.form.reset({ nome: '', telefone: '', email: '', documento: '', endereco: '', status: 'ativo', observacoes: '' });
    this.modalAberto.set(true);
  }

  abrirEdicao(c: Cliente): void {
    this.editandoId = c.id ?? null;
    this.form.reset({
      nome: c.nome, telefone: c.telefone, email: c.email, documento: c.documento,
      endereco: c.endereco, status: c.status, observacoes: c.observacoes
    });
    this.modalAberto.set(true);
  }

  fecharModal(): void {
    this.modalAberto.set(false);
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.salvando = true;
    const dados = this.form.getRawValue() as Cliente;

    const requisicao = this.editandoId
      ? this.clienteService.atualizar(this.editandoId, dados)
      : this.clienteService.criar(dados);

    requisicao.subscribe({
      next: () => {
        this.salvando = false;
        this.modalAberto.set(false);
        this.toast.mostrar(this.editandoId ? 'Cliente atualizado.' : 'Cliente cadastrado.', 'success');
        this.carregar();
      },
      error: () => {
        this.salvando = false;
        this.toast.mostrar('Não foi possível salvar o cliente.', 'error');
      }
    });
  }

  pedirExclusao(c: Cliente): void {
    this.clienteParaExcluir = c;
    this.excluirAberto.set(true);
  }

  confirmarExclusao(): void {
    if (!this.clienteParaExcluir?.id) return;
    this.clienteService.excluir(this.clienteParaExcluir.id).subscribe({
      next: () => {
        this.excluirAberto.set(false);
        this.toast.mostrar('Cliente excluído.', 'success');
        this.carregar();
      },
      error: () => this.toast.mostrar('Não foi possível excluir — verifique se ele possui orçamentos/serviços vinculados.', 'error')
    });
  }
}
