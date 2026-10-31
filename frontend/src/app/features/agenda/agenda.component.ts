import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../shared/layout/header/header.component';
import { AgendaService } from '../../core/services/agenda.service';
import { ClienteService } from '../../core/services/cliente.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { Cliente, Servico } from '../../core/models/models';
import { STATUS_SERVICO } from '../../core/data/nichos';
import { formatBRL } from '../../core/services/utils';

interface DiaCalendario {
  data: Date;
  iso: string;
  numero: number;
  outroMes: boolean;
  hoje: boolean;
  servicos: Servico[];
  temConflito: boolean;
}

/* Agenda — equivalente a pages/agenda.html + js/agenda.js. Não existe uma
   entidade "Agendamento" separada no banco: um agendamento é um Serviço
   com data e hora (ver AgendaService/AgendaController no backend), então
   esta tela só organiza os mesmos serviços numa grade de calendário. A
   regra de conflito de horário é a mesma usada nas notificações
   automáticas (dois serviços não cancelados no mesmo dia e hora). */
@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, HeaderComponent],
  templateUrl: './agenda.component.html'
})
export class AgendaComponent implements OnInit {
  private fb = inject(FormBuilder);
  visualizacao: 'mes' | 'semana' = 'mes';
  referencia = new Date();
  dias: DiaCalendario[] = [];
  semana: DiaCalendario[] = [];
  servicos: Servico[] = [];
  clientes: Cliente[] = [];
  carregando = true;
  erro = '';

  statusMap = STATUS_SERVICO;
  formatBRL = formatBRL;

  modalDiaAberto = false;
  diaSelecionado: DiaCalendario | null = null;

  modalFormAberto = false;
  editandoId: number | null = null;
  salvando = false;
  conflitoDetectado: Servico[] = [];

  form = this.fb.group({
    clienteId: [null as number | null, Validators.required],
    titulo: ['', Validators.required],
    nicho: [''],
    data: ['', Validators.required],
    hora: ['09:00', Validators.required],
    duracaoHoras: [1],
    valor: [0, Validators.required]
  });

  constructor(
    private agendaService: AgendaService,
    private clienteService: ClienteService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.clienteService.listar().subscribe((lista) => (this.clientes = lista));
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.agendaService.listarPorPeriodo().subscribe({
      next: (lista) => {
        this.servicos = lista;
        this.carregando = false;
        this.montarCalendario();
      },
      error: () => {
        this.carregando = false;
        this.erro = 'Não foi possível carregar a agenda do backend. Confira se o Spring Boot está rodando em http://localhost:8080.';
      }
    });
  }

  private iso(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  montarCalendario(): void {
    const ano = this.referencia.getFullYear();
    const mes = this.referencia.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const inicioGrade = new Date(primeiroDia);
    inicioGrade.setDate(primeiroDia.getDate() - primeiroDia.getDay());

    const porData = new Map<string, Servico[]>();
    for (const s of this.servicos) {
      if (!s.data) continue;
      if (!porData.has(s.data)) porData.set(s.data, []);
      porData.get(s.data)!.push(s);
    }

    const hojeIso = this.iso(new Date());
    this.dias = [];
    for (let i = 0; i < 42; i++) {
      const data = new Date(inicioGrade);
      data.setDate(inicioGrade.getDate() + i);
      const iso = this.iso(data);
      const servicosDoDia = (porData.get(iso) || []).filter((s) => s.status !== 'cancelado');
      this.dias.push({
        data,
        iso,
        numero: data.getDate(),
        outroMes: data.getMonth() !== mes,
        hoje: iso === hojeIso,
        servicos: servicosDoDia,
        temConflito: this.temConflitoNoDia(servicosDoDia)
      });
    }

    const refIso = this.iso(this.referencia);
    let idx = this.dias.findIndex((d) => d.iso === refIso);
    if (idx < 0) idx = 0;
    const inicioSemana = idx - (idx % 7);
    this.semana = this.dias.slice(inicioSemana, inicioSemana + 7);
  }

  private temConflitoNoDia(servicos: Servico[]): boolean {
    for (let i = 0; i < servicos.length; i++) {
      for (let j = i + 1; j < servicos.length; j++) {
        if (servicos[i].hora === servicos[j].hora) return true;
      }
    }
    return false;
  }

  get tituloPeriodo(): string {
    return this.referencia.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }

  navegar(direcao: number): void {
    const dias = this.visualizacao === 'mes' ? 0 : 7 * direcao;
    if (this.visualizacao === 'mes') {
      this.referencia = new Date(this.referencia.getFullYear(), this.referencia.getMonth() + direcao, 1);
    } else {
      this.referencia = new Date(this.referencia.getTime() + dias * 86400000);
    }
    this.montarCalendario();
  }

  hoje(): void {
    this.referencia = new Date();
    this.montarCalendario();
  }

  abrirDia(dia: DiaCalendario): void {
    this.diaSelecionado = dia;
    this.modalDiaAberto = true;
  }

  abrirNovo(dataIso?: string): void {
    this.editandoId = null;
    this.conflitoDetectado = [];
    this.form.reset({
      clienteId: this.clientes[0]?.id ?? null,
      titulo: '', nicho: '', data: dataIso || this.iso(new Date()), hora: '09:00', duracaoHoras: 1, valor: 0
    });
    this.modalDiaAberto = false;
    this.modalFormAberto = true;
  }

  abrirEdicao(s: Servico): void {
    this.editandoId = s.id ?? null;
    this.conflitoDetectado = [];
    this.form.reset({
      clienteId: s.clienteId, titulo: s.titulo, nicho: s.nicho,
      data: s.data, hora: s.hora, duracaoHoras: s.duracaoHoras ?? 1, valor: s.valor
    });
    this.modalDiaAberto = false;
    this.modalFormAberto = true;
  }

  verificarConflito(): void {
    const { data, hora } = this.form.getRawValue();
    if (!data || !hora) return;
    this.agendaService.verificarConflito(data, hora, this.editandoId ?? undefined).subscribe((lista) => (this.conflitoDetectado = lista));
  }

  salvar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.salvando = true;
    const dados = this.form.getRawValue() as any as Servico;
    const requisicao = this.editandoId ? this.agendaService.atualizar(this.editandoId, dados) : this.agendaService.criar(dados);
    requisicao.subscribe({
      next: () => {
        this.salvando = false;
        this.modalFormAberto = false;
        this.toast.mostrar(this.editandoId ? 'Agendamento atualizado.' : 'Agendamento criado.', 'success');
        this.carregar();
      },
      error: () => {
        this.salvando = false;
        this.toast.mostrar('Não foi possível salvar o agendamento.', 'error');
      }
    });
  }

  excluir(s: Servico): void {
    if (!confirm('Excluir este agendamento?')) return;
    this.agendaService.excluir(s.id!).subscribe({
      next: () => { this.toast.mostrar('Agendamento excluído.', 'success'); this.modalDiaAberto = false; this.carregar(); },
      error: () => this.toast.mostrar('Não foi possível excluir — ele pode já estar em andamento.', 'error')
    });
  }

  clienteNome(id: number | null): string {
    return this.clientes.find((c) => c.id === id)?.nome || '';
  }
}
