import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NICHOS } from '../../../core/data/nichos';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './onboarding.component.html'
})
export class OnboardingComponent {
  nichos = NICHOS;
  selecionado = '';
  salvando = false;

  constructor(private auth: AuthService, private router: Router) {}

  escolher(id: string): void {
    this.selecionado = id;
  }

  continuar(): void {
    if (!this.selecionado) return;
    this.salvando = true;
    this.auth.atualizarNicho(this.selecionado).subscribe({
      next: () => this.router.navigate(['/app/dashboard']),
      error: () => {
        this.salvando = false;
        this.router.navigate(['/app/dashboard']);
      }
    });
  }
}
