import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

/* Tela de login — mesma estrutura visual de pages/login.html (classes
   .auth, .auth-aside, .auth-main, .auth-card, .card, .field), agora com
   Reactive Forms e chamando POST /api/auth/login de verdade no backend. */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required]
  });

  enviando = false;
  erro = '';

  constructor(private auth: AuthService, private router: Router) {}

  entrar(): void {
    this.erro = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.enviando = true;
    const { email, senha } = this.form.getRawValue();
    this.auth.entrar(email!, senha!).subscribe({
      next: (resposta) => {
        this.enviando = false;
        if (resposta.ok) {
          this.router.navigate(['/app/dashboard']);
        } else {
          this.erro = resposta.erro || 'Não foi possível entrar.';
        }
      },
      error: () => {
        this.enviando = false;
        this.erro = 'Não foi possível falar com o servidor. O backend (Spring Boot) está rodando em http://localhost:8080?';
      }
    });
  }
}
