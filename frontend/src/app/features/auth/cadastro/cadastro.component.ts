import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './cadastro.component.html'
})
export class CadastroComponent {
  private fb = inject(FormBuilder);
  form = this.fb.group({
    nome: ['', Validators.required],
    nomeProfissional: [''],
    email: ['', [Validators.required, Validators.email]],
    telefone: [''],
    senha: ['', [Validators.required, Validators.minLength(6)]]
  });

  enviando = false;
  erro = '';

  constructor(private auth: AuthService, private router: Router) {}

  cadastrar(): void {
    this.erro = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando = true;
    this.auth.criar(this.form.getRawValue() as any).subscribe({
      next: (resposta) => {
        this.enviando = false;
        if (resposta.ok) this.router.navigate(['/onboarding']);
        else this.erro = resposta.erro || 'Não foi possível criar a conta.';
      },
      error: () => {
        this.enviando = false;
        this.erro = 'Não foi possível falar com o servidor. O backend está rodando em http://localhost:8080?';
      }
    });
  }
}
