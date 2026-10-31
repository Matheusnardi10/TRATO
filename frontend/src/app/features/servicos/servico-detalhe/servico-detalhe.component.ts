import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../../shared/layout/header/header.component';
import { ServicoService } from '../../../core/services/servico.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { Despesa, Pagamento, Servico } from '../../../core/models/models';
import { STATUS_SERVICO, STATUS_PAGAMENTO, CATEGORIAS_DESPESA } from '../../../core/data/nichos';
import { formatBRL, formatDate, formatPercent } from '../../../core/services/utils';
import { Calc } from '../../../core/services/calc';

/* Detalhe do serviço — equivalente a pages/servico-detalhe.html + trecho de
   js/servicos.js. Aqui fica o registro de custos reais por categoria, que
   o backend soma automaticamente (ServicoService.recalcularCustoReal) para
   atualizar o lucro realizado — nunca confiamos num valor de custo real
   calculado só no navegador. */
@Component({
  selector: 'app-servico-detalhe',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, HeaderComponent],
  templateUrl: './servico-detalhe.component.html'
})
export class ServicoDetalheComponent implements OnInit {
  private fb = inject(FormBuilder);
  servico: Servico | null = null;
  despesas: Despesa[] = [];
  pagamento: Pagamento | null = null;
  carregando = true;
  erro = '';

  modalCustoAberto = false;
  salvandoCusto = false;
  modalRecebimentoAberto = false;
  salvandoRecebimento = false;

  statusMap = STATUS_SERVICO;
  statusPagamentoMap = STATUS_PAGAMENTO;
  categorias = CATEGORIAS_DESPESA;
  formatBRL = formatBRL;
  formatDate = formatDate;
  formatPercent = formatPercent;

  formCusto = this.fb.group({
    categoria: ['material', Validators.required],
    descricao: ['', Validators.required],
    valor: [0, [Validators.required, Validators.min(0.01)]]
  });

  formRecebimento = this.fb.group({
    valor: [0, [Validators.required, Validators.min(0.01)]],
    forma: ['pix', Validators.required]
  });

  private id!: number;

  constructor(
    private servicoService: ServicoService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.servicoService.buscar(this.id).subscribe({
      next: (s) => {
        this.servico = s;
        this.carregando = false;
        this.carregarDespesas();
        this.carregarPagamento();
      },
      error: () => {
        this.carregando = false;
        this.erro = 'Não foi possível carregar este serviço.';
      }
    });
  }

  carregarDespesas(): void {
    this.servicoService.despesas(this.id).subscribe((lista) => (this.despesas = lista));
  }

  carregarPagamento(): void {
    this.servicoService.pagamento(this.id).subscribe({
      next: (p) => (this.pagamento = p),
      error: () => (this.pagamento = null) // serviço sem pagamento vinculado (não deveria ocorrer, mas não quebra a tela)
    });
  }

  /* ---------- Cálculos (previsto x realizado) ---------- */

  get custoTotalPrevisto(): number { return this.servico?.custoPrevisto ?? 0; }
  get custoTotalReal(): number { return this.servico?.custoReal ?? 0; }
  get diferencaCusto(): number { return Calc.diferenca(this.custoTotalReal, this.custoTotalPrevisto); }
  get lucroPrevisto(): number { return this.servico ? Calc.lucro(this.servico.valor, this.custoTotalPrevisto) : 0; }
  get lucroRealizado(): number { return this.servico ? Calc.lucro(this.servico.valor, this.custoTotalReal) : 0; }
  get margemRealizada(): number { return this.servico ? Calc.margem(this.servico.valor, this.custoTotalReal) : 0; }

  /* ---------- Ações ---------- */

  abrirModalCusto(): void {
    this.formCusto.reset({ categoria: 'material', descricao: '', valor: 0 });
    this.modalCustoAberto = true;
  }

  registrarCusto(): void {
    if (this.formCusto.invalid) { this.formCusto.markAllAsTouched(); return; }
    this.salvandoCusto = true;
    const dados = { ...this.formCusto.getRawValue(), servicoId: this.id } as Despesa;
    this.servicoService.adicionarDespesa(this.id, dados).subscribe({
      next: () => {
        this.salvandoCusto = false;
        this.modalCustoAberto = false;
        this.toast.mostrar('Custo registrado — lucro realizado atualizado.', 'success');
        this.carregar();
      },
      error: () => {
        this.salvandoCusto = false;
        this.toast.mostrar('Não foi possível registrar o custo.', 'error');
      }
    });
  }

  abrirModalRecebimento(): void {
    const restante = (this.pagamento?.valorTotal ?? 0) - (this.pagamento?.valorRecebido ?? 0);
    this.formRecebimento.reset({ valor: Math.max(0, restante), forma: 'pix' });
    this.modalRecebimentoAberto = true;
  }

  registrarRecebimento(): void {
    if (this.formRecebimento.invalid) { this.formRecebimento.markAllAsTouched(); return; }
    this.salvandoRecebimento = true;
    const { valor, forma } = this.formRecebimento.getRawValue();
    this.servicoService.registrarRecebimento(this.id, Number(valor), String(forma)).subscribe({
      next: () => {
        this.salvandoRecebimento = false;
        this.modalRecebimentoAberto = false;
        this.toast.mostrar('Pagamento atualizado.', 'success');
        this.carregarPagamento();
      },
      error: () => {
        this.salvandoRecebimento = false;
        this.toast.mostrar('Não foi possível registrar o recebimento.', 'error');
      }
    });
  }

  alterarStatus(status: string): void {
    this.servicoService.alterarStatus(this.id, status).subscribe({
      next: (s) => {
        this.servico = s;
        this.toast.mostrar(status === 'concluido' ? 'Serviço concluído.' : 'Status atualizado.', 'success');
      },
      error: () => this.toast.mostrar('Não foi possível alterar o status.', 'error')
    });
  }

  excluir(): void {
    if (!confirm('Excluir este serviço? Esta ação não pode ser desfeita.')) return;
    this.servicoService.excluir(this.id).subscribe({
      next: () => { this.toast.mostrar('Serviço excluído.', 'success'); this.router.navigate(['/app/servicos']); },
      error: () => this.toast.mostrar('Não foi possível excluir.', 'error')
    });
  }

  categoriaInfo(id: string) {
    return this.categorias.find((c) => c.id === id);
  }
}
