import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HeaderComponent } from '../../../shared/layout/header/header.component';
import { ContratoService } from '../../../core/services/contrato.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { Aditivo, CampoContrato, Clausula, Contrato } from '../../../core/models/models';
import { STATUS_CONTRATO } from '../../../core/data/nichos';
import { formatBRL, formatDate, formatDateTime } from '../../../core/services/utils';

/* Detalhe do contrato — equivalente a pages/contrato-detalhe.html +
   js/contratos.js. Cláusulas vêm prontas do backend (já preenchidas com os
   dados do orçamento/cliente), mas o texto pode ser editado aqui antes do
   envio para aceite — exatamente como no original. */
@Component({
  selector: 'app-contrato-detalhe',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, HeaderComponent],
  templateUrl: './contrato-detalhe.component.html'
})
export class ContratoDetalheComponent implements OnInit {
  private fb = inject(FormBuilder);
  contrato: Contrato | null = null;
  carregando = true;
  erro = '';
  editandoClausulas = false;
  clausulasEdicao: Clausula[] = [];
  salvandoClausulas = false;

  modalAditivoAberto = false;
  salvandoAditivo = false;

  modoImpressao = false;

  /* Dados do formulário dos modelos do advogado (chave -> valor digitado). */
  valores: Record<string, string> = {};
  salvandoDados = false;

  statusMap = STATUS_CONTRATO;
  formatBRL = formatBRL;
  formatDate = formatDate;
  formatDateTime = formatDateTime;
  enviando = false;

  formAditivo = this.fb.group({
    tipo: ['valor', Validators.required],
    descricao: ['', Validators.required],
    valor: [0],
    condicoes: ['']
  });

  private id!: number;

  constructor(
    private contratoService: ContratoService,
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
    this.contratoService.buscar(this.id).subscribe({
      next: (c) => { this.contrato = c; this.sincronizarValores(c); this.carregando = false; },
      error: () => {
        this.carregando = false;
        this.erro = 'Não foi possível carregar este contrato.';
      }
    });
  }

  /* ---------- Dados do contrato (modelo do advogado) ---------- */

  private sincronizarValores(c: Contrato): void {
    this.valores = {};
    for (const campo of c.campos ?? []) this.valores[campo.chave] = campo.valor ?? '';
  }

  camposDoGrupo(grupo: string): CampoContrato[] {
    return (this.contrato?.campos ?? []).filter((c) => c.grupo === grupo);
  }

  tipoInput(tipo: string): string {
    switch (tipo) {
      case 'data': return 'date';
      case 'datahora': return 'datetime-local';
      case 'numero':
      case 'moeda': return 'number';
      case 'email': return 'email';
      default: return 'text';
    }
  }

  get editavel(): boolean {
    return this.contrato?.status === 'rascunho';
  }

  salvarDados(): void {
    this.salvandoDados = true;
    this.contratoService.atualizarDados(this.id, this.valores).subscribe({
      next: (c) => {
        this.contrato = c;
        this.sincronizarValores(c);
        this.salvandoDados = false;
        this.toast.mostrar('Dados salvos e contrato atualizado.', 'success');
      },
      error: (e) => {
        this.salvandoDados = false;
        this.toast.mostrar(e?.error?.erro || 'Não foi possível salvar os dados.', 'error');
      }
    });
  }

  paragrafos(texto?: string): string[] {
    return (texto ?? '').split('\n\n').filter((p) => p.trim().length > 0);
  }

  get temPendencias(): boolean {
    return (this.contrato?.pendentes?.length ?? 0) > 0;
  }

  /* ---------- Cláusulas ---------- */

  iniciarEdicaoClausulas(): void {
    this.clausulasEdicao = this.contrato!.clausulas.map((c) => ({ ...c }));
    this.editandoClausulas = true;
  }

  cancelarEdicaoClausulas(): void {
    this.editandoClausulas = false;
  }

  salvarClausulas(): void {
    this.salvandoClausulas = true;
    this.contratoService.atualizarClausulas(this.id, this.clausulasEdicao).subscribe({
      next: (c) => {
        this.contrato = c;
        this.salvandoClausulas = false;
        this.editandoClausulas = false;
        this.toast.mostrar('Cláusulas atualizadas.', 'success');
      },
      error: () => {
        this.salvandoClausulas = false;
        this.toast.mostrar('Não foi possível salvar as cláusulas.', 'error');
      }
    });
  }

  /* ---------- Aditivos ---------- */

  abrirModalAditivo(): void {
    this.formAditivo.reset({ tipo: 'valor', descricao: '', valor: 0, condicoes: '' });
    this.modalAditivoAberto = true;
  }

  adicionarAditivo(): void {
    if (this.formAditivo.invalid) { this.formAditivo.markAllAsTouched(); return; }
    this.salvandoAditivo = true;
    const dados = this.formAditivo.getRawValue() as Aditivo;
    this.contratoService.adicionarAditivo(this.id, dados).subscribe({
      next: (c) => {
        this.contrato = c;
        this.salvandoAditivo = false;
        this.modalAditivoAberto = false;
        this.toast.mostrar('Aditivo adicionado ao contrato.', 'success');
      },
      error: () => {
        this.salvandoAditivo = false;
        this.toast.mostrar('Não foi possível adicionar o aditivo.', 'error');
      }
    });
  }

  removerAditivo(a: Aditivo): void {
    if (!confirm(`Remover o aditivo #${a.numero}?`)) return;
    this.contratoService.removerAditivo(this.id, a.id!).subscribe({
      next: (c) => { this.contrato = c; this.toast.mostrar('Aditivo removido.', 'success'); },
      error: () => this.toast.mostrar('Não foi possível remover o aditivo.', 'error')
    });
  }

  /* ---------- Status / aceite ---------- */

  /* Envia (ou reenvia) por e-mail o link para o cliente aprovar. */
  enviarParaAceite(): void {
    this.enviando = true;
    this.contratoService.enviarParaAceite(this.id).subscribe({
      next: (c) => {
        this.contrato = c;
        this.enviando = false;
        const semEmail = c.mensagem?.startsWith('E-mail não configurado');
        this.toast.mostrar(c.mensagem || 'Contrato enviado para aceite do cliente.', semEmail ? 'warning' : 'success');
      },
      error: (e) => {
        this.enviando = false;
        this.toast.mostrar(e?.error?.erro || 'Não foi possível enviar o contrato.', 'error');
      }
    });
  }

  copiarLink(): void {
    const link = this.contrato?.linkAceite;
    if (!link) return;
    navigator.clipboard.writeText(link).then(
      () => this.toast.mostrar('Link copiado — mande para o cliente pelo WhatsApp ou e-mail.', 'success'),
      () => window.prompt('Copie o link de aprovação:', link)
    );
  }

  marcarAceito(): void {
    this.contratoService.marcarAceito(this.id).subscribe({
      next: (c) => { this.contrato = c; this.toast.mostrar('Contrato marcado como aceito e ativo.', 'success'); },
      error: (e) => this.toast.mostrar(e?.error?.erro || 'Não foi possível marcar como aceito.', 'error')
    });
  }

  concluir(): void {
    this.contratoService.concluir(this.id).subscribe({
      next: (c) => { this.contrato = c; this.toast.mostrar('Contrato concluído.', 'success'); },
      error: () => this.toast.mostrar('Não foi possível concluir.', 'error')
    });
  }

  cancelar(): void {
    if (!confirm('Cancelar este contrato?')) return;
    this.contratoService.cancelar(this.id).subscribe({
      next: (c) => { this.contrato = c; this.toast.mostrar('Contrato cancelado.', 'info'); },
      error: () => this.toast.mostrar('Não foi possível cancelar.', 'error')
    });
  }

  /* ---------- Criar serviço ---------- */

  criarServico(): void {
    this.contratoService.criarServico(this.id).subscribe({
      next: (servico) => {
        this.toast.mostrar('Serviço criado a partir do contrato.', 'success');
        this.router.navigate(['/app/servicos', servico.id]);
      },
      error: () => this.toast.mostrar('Não foi possível criar o serviço.', 'error')
    });
  }

  imprimir(): void {
    window.print();
  }
}
