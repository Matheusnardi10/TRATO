import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderComponent } from '../../shared/layout/header/header.component';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { NICHOS } from '../../core/data/nichos';

type Aba = 'perfil' | 'negocio' | 'senha';

/* Configurações — equivalente a pages/configuracoes.html + js/configuracoes.js.
   Perfil e negócio são gravados no próprio Usuario (ver Negocio embutido no
   backend); a troca de senha exige a senha atual correta. */
@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HeaderComponent],
  templateUrl: './configuracoes.component.html'
})
export class ConfiguracoesComponent implements OnInit {
  private fb = inject(FormBuilder);
  aba: Aba = 'perfil';
  nichos = NICHOS;
  salvandoPerfil = false;
  salvandoNegocio = false;
  salvandoSenha = false;
  erroSenha = '';

  formPerfil = this.fb.group({
    nome: ['', Validators.required],
    nomeProfissional: [''],
    telefone: ['']
  });

  salvandoNicho = false;
  nichoSelecionado = '';

  formNegocio = this.fb.group({
    cidade: [''],
    telefoneProfissional: [''],
    emailProfissional: ['', Validators.email],
    pix: [''],
    formaPagamentoPadrao: [''],
    prazoPadrao: [''],
    documento: [''],
    endereco: ['']
  });

  formSenha = this.fb.group({
    senhaAtual: ['', Validators.required],
    novaSenha: ['', [Validators.required, Validators.minLength(6)]],
    confirmarSenha: ['', Validators.required]
  });

  constructor(public auth: AuthService, private toast: ToastService) {}

  ngOnInit(): void {
    const usuario = this.auth.usuarioAtual();
    if (usuario) {
      this.nichoSelecionado = usuario.nicho || '';
      this.formPerfil.reset({ nome: usuario.nome, nomeProfissional: usuario.nomeProfissional, telefone: usuario.telefone });
      this.formNegocio.reset({
        cidade: usuario.negocio?.cidade, telefoneProfissional: usuario.negocio?.telefoneProfissional,
        emailProfissional: usuario.negocio?.emailProfissional, pix: usuario.negocio?.pix,
        formaPagamentoPadrao: usuario.negocio?.formaPagamentoPadrao, prazoPadrao: usuario.negocio?.prazoPadrao,
        documento: usuario.negocio?.documento, endereco: usuario.negocio?.endereco
      });
    }
  }

  get nichoAtual() {
    return this.nichos.find((n) => n.id === this.auth.usuarioAtual()?.nicho);
  }

  salvarPerfil(): void {
    if (this.formPerfil.invalid) { this.formPerfil.markAllAsTouched(); return; }
    this.salvandoPerfil = true;
    this.auth.atualizarPerfil(this.formPerfil.getRawValue() as any).subscribe({
      next: () => { this.salvandoPerfil = false; this.toast.mostrar('Perfil atualizado.', 'success'); },
      error: () => { this.salvandoPerfil = false; this.toast.mostrar('Não foi possível salvar o perfil.', 'error'); }
    });
  }

  salvarNicho(): void {
    if (!this.nichoSelecionado) return;
    this.salvandoNicho = true;
    this.auth.atualizarNicho(this.nichoSelecionado).subscribe({
      next: () => { this.salvandoNicho = false; this.toast.mostrar('Nicho atualizado.', 'success'); },
      error: () => { this.salvandoNicho = false; this.toast.mostrar('Não foi possível atualizar o nicho.', 'error'); }
    });
  }

  salvarNegocio(): void {
    this.salvandoNegocio = true;
    this.auth.atualizarNegocio(this.formNegocio.getRawValue() as any).subscribe({
      next: () => { this.salvandoNegocio = false; this.toast.mostrar('Dados do negócio atualizados.', 'success'); },
      error: () => { this.salvandoNegocio = false; this.toast.mostrar('Não foi possível salvar.', 'error'); }
    });
  }

  salvarSenha(): void {
    this.erroSenha = '';
    if (this.formSenha.invalid) { this.formSenha.markAllAsTouched(); return; }
    const { senhaAtual, novaSenha, confirmarSenha } = this.formSenha.getRawValue();
    if (novaSenha !== confirmarSenha) { this.erroSenha = 'As senhas não coincidem.'; return; }
    this.salvandoSenha = true;
    this.auth.alterarSenha(senhaAtual!, novaSenha!).subscribe({
      next: (resposta) => {
        this.salvandoSenha = false;
        if (resposta.ok) {
          this.toast.mostrar('Senha alterada.', 'success');
          this.formSenha.reset();
        } else {
          this.erroSenha = resposta.erro || 'Não foi possível alterar a senha.';
        }
      },
      error: () => { this.salvandoSenha = false; this.erroSenha = 'Não foi possível alterar a senha.'; }
    });
  }
}
