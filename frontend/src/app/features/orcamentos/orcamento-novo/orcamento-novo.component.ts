import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HeaderComponent } from '../../../shared/layout/header/header.component';
import { ClienteService } from '../../../core/services/cliente.service';
import { OrcamentoService } from '../../../core/services/orcamento.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { Calc } from '../../../core/services/calc';
import { CATEGORIAS_DESPESA, getNicho } from '../../../core/data/nichos';
import { Cliente, Orcamento, StatusOrcamento } from '../../../core/models/models';

/* Réplica de pages/orcamento-novo.html + js/orcamento-novo.js: campos
   dinâmicos por nicho + cálculo bidirecional custo <-> margem <-> valor.
   A trava "travaCalculo" do original vira a flag `recalculando` aqui, para
   evitar loop infinito entre os dois campos que se escutam. */
@Component({
  selector: 'app-orcamento-novo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './orcamento-novo.component.html'
})
export class OrcamentoNovoComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  clientes: Cliente[] = [];
  nicho = getNicho(this.auth.usuarioAtual()?.nicho);
  categoriasDespesa = CATEGORIAS_DESPESA;
  idEdicao: number | null = null;
  orcamentoExistente: Orcamento | null = null;
  salvando = false;
  erro = '';

  private recalculando = false;

  form = this.fb.group({
    clienteId: ['', Validators.required],
    titulo: ['', Validators.required],
    descricao: [''],
    dataPrevista: ['', Validators.required],
    prazoEstimado: [''],
    formaPagamento: [''],
    validade: [''],
    observacoes: [''],
    margem: [40],
    valorFinal: [0],
    custoTotal: [{ value: 0, disabled: true }],
    lucroEstimado: [{ value: 0, disabled: true }],
    custos: this.fb.group(
      Object.fromEntries(CATEGORIAS_DESPESA.map((c) => [c.id, [0]]))
    ),
    camposNicho: this.fb.group(
      Object.fromEntries(this.nicho.camposOrcamento.map((c) => [c.id, [c.obrigatorio ? '' : '', c.obrigatorio ? Validators.required : []]]))
    )
  });

  constructor(
    private clienteService: ClienteService,
    private orcamentoService: OrcamentoService,
    private toast: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.clienteService.listar().subscribe((lista) => {
      this.clientes = lista;
      const clienteIdQuery = this.route.snapshot.queryParamMap.get('clienteId');
      if (clienteIdQuery) this.form.patchValue({ clienteId: clienteIdQuery });
    });

    const hoje = new Date();
    const em7 = new Date(hoje); em7.setDate(em7.getDate() + 7);
    const em10 = new Date(hoje); em10.setDate(em10.getDate() + 10);
    this.form.patchValue({
      dataPrevista: em7.toISOString().slice(0, 10),
      validade: em10.toISOString().slice(0, 10)
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.idEdicao = Number(idParam);
      this.orcamentoService.buscar(this.idEdicao).subscribe({
        next: (o) => this.preencherComExistente(o),
        error: () => (this.erro = 'Orçamento não encontrado.')
      });
    } else {
      this.calcular('margem');
    }

    this.form.get('custos')!.valueChanges.subscribe(() => this.calcular('custo'));
    this.form.get('margem')!.valueChanges.subscribe(() => this.calcular('margem'));
    this.form.get('valorFinal')!.valueChanges.subscribe(() => this.calcular('valor'));
  }

  private preencherComExistente(o: Orcamento): void {
    this.orcamentoExistente = o;
    // Observação: igual ao comportamento original (js/orcamento-novo.js), os
    // campos dinâmicos exibidos são sempre os do nicho ATUAL do usuário
    // logado, não necessariamente o nicho gravado neste orçamento — por
    // isso `this.nicho` não é reatribuído aqui, para não descasar do
    // FormGroup "camposNicho" já construído com os campos do nicho do usuário.
    this.form.patchValue({
      clienteId: String(o.clienteId),
      titulo: o.titulo,
      descricao: o.descricao,
      dataPrevista: o.dataPrevista,
      prazoEstimado: o.prazoEstimado,
      formaPagamento: o.formaPagamento,
      validade: o.validade,
      margem: o.margem,
      valorFinal: o.valor,
      custos: { ...this.form.get('custos')!.value, ...o.custos }
    });
    Object.entries(o.camposNicho || {}).forEach(([chave, valor]) => {
      const controle = (this.form.get('camposNicho') as any)?.get(chave);
      if (controle) controle.setValue(valor);
    });
    this.calcular('margem');
  }

  private lerCustoTotal(): number {
    return Calc.custoTotal(this.form.get('custos')!.value);
  }

  calcular(origem: 'custo' | 'margem' | 'valor'): void {
    if (this.recalculando) return;
    this.recalculando = true;

    const custoTotal = this.lerCustoTotal();
    const margemAtual = Number(this.form.get('margem')!.value) || 0;
    const valorAtual = Number(this.form.get('valorFinal')!.value) || 0;

    if (origem === 'valor') {
      const novaMargem = custoTotal > 0 ? Number(Calc.margem(valorAtual, custoTotal).toFixed(1)) : margemAtual;
      this.form.get('margem')!.setValue(novaMargem, { emitEvent: false });
    } else {
      const novoValor = Calc.valorComMargem(custoTotal, margemAtual);
      this.form.get('valorFinal')!.setValue(Math.round(novoValor * 100) / 100, { emitEvent: false });
    }

    const valorFinal = Number(this.form.get('valorFinal')!.value) || 0;
    const lucro = Calc.lucro(valorFinal, custoTotal);

    this.form.get('custoTotal')!.setValue(custoTotal, { emitEvent: false });
    this.form.get('lucroEstimado')!.setValue(lucro, { emitEvent: false });

    this.recalculando = false;
  }

  get custoTotal(): number { return Number(this.form.get('custoTotal')!.value) || 0; }
  get lucroEstimado(): number { return Number(this.form.get('lucroEstimado')!.value) || 0; }
  get valorFinal(): number { return Number(this.form.get('valorFinal')!.value) || 0; }

  salvar(status: StatusOrcamento): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.mostrar('Revise os campos destacados antes de continuar.', 'error');
      return;
    }
    this.salvando = true;
    const v = this.form.getRawValue();
    const dados: Orcamento = {
      clienteId: Number(v.clienteId),
      titulo: v.titulo!.trim(),
      descricao: (v.descricao || '').trim(),
      nicho: this.nicho.id,
      dataPrevista: v.dataPrevista!,
      prazoEstimado: v.prazoEstimado || '',
      formaPagamento: v.formaPagamento || '',
      validade: v.validade || '',
      itens: [{ descricao: v.titulo!.trim() || 'Serviço', quantidade: 1, valorUnitario: this.valorFinal }],
      custos: v.custos as any,
      margem: Number(v.margem) || 0,
      valor: this.valorFinal,
      camposNicho: v.camposNicho as any,
      status
    };

    const requisicao = this.idEdicao
      ? this.orcamentoService.atualizar(this.idEdicao, dados)
      : this.orcamentoService.criar(dados);

    requisicao.subscribe({
      next: (salvo) => {
        this.salvando = false;
        if (status === 'aguardando') {
          this.orcamentoService.enviar(salvo.id!).subscribe();
        }
        this.toast.mostrar(status === 'rascunho' ? 'Orçamento salvo como rascunho.' : 'Orçamento enviado ao cliente.', 'success');
        this.router.navigate(['/app/orcamentos']);
      },
      error: () => {
        this.salvando = false;
        this.toast.mostrar('Não foi possível salvar o orçamento.', 'error');
      }
    });
  }
}
