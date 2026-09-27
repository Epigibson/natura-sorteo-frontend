import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-wrap">
      <div class="login-card">
        <div class="brand">🎟️ Sorteo Natura</div>
        <h1>Panel de control</h1>
        <p class="sub">Acceso para Yuri y equipo</p>

        <label>Teléfono</label>
        <input
          type="tel"
          [(ngModel)]="phone"
          placeholder="55 0000 0000"
          (keyup.enter)="submit()"
        />

        <label>Contraseña</label>
        <input
          type="password"
          [(ngModel)]="password"
          placeholder="••••••••"
          (keyup.enter)="submit()"
        />

        <button class="btn-primary" (click)="submit()" [disabled]="loading()">
          {{ loading() ? 'Entrando…' : 'Entrar' }}
        </button>

        @if (error()) {
          <div class="error">{{ error() }}</div>
        }

        <div class="hint">Demo: 5500000000 / AdminDev123!</div>
      </div>
    </div>
  `,
  styles: [
    `
      .login-wrap {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(150deg, #0d3b12 0%, #1b5e20 50%, #2e7d32 100%);
        padding: 16px;
      }
      .login-card {
        width: 100%;
        max-width: 380px;
        background: #faf7f0;
        border-radius: 20px;
        padding: 32px 28px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
      }
      .brand {
        text-align: center;
        font-size: 13px;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: #1b5e20;
        font-weight: 700;
      }
      h1 {
        text-align: center;
        margin: 8px 0 4px;
        font-size: 24px;
        color: #1f2937;
      }
      .sub {
        text-align: center;
        color: #6b7280;
        font-size: 13px;
        margin-bottom: 24px;
      }
      label {
        display: block;
        font-size: 12px;
        font-weight: 700;
        color: #1b5e20;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        margin: 14px 0 6px;
      }
      input {
        width: 100%;
        padding: 13px 14px;
        border: 2px solid #c8e6c9;
        border-radius: 12px;
        font-size: 16px;
        outline: none;
        box-sizing: border-box;
      }
      input:focus {
        border-color: #4caf50;
        box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.18);
      }
      .btn-primary {
        width: 100%;
        margin-top: 22px;
        padding: 14px;
        border: none;
        border-radius: 14px;
        background: linear-gradient(135deg, #1b5e20, #4caf50);
        color: #fff;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
      }
      .btn-primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      .error {
        margin-top: 14px;
        padding: 12px;
        background: #ffebee;
        color: #c62828;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
        text-align: center;
      }
      .hint {
        margin-top: 18px;
        text-align: center;
        font-size: 11px;
        color: #9ca3af;
      }
    `,
  ],
})
export class LoginComponent {
  phone = '5500000000';
  password = 'AdminDev123!';
  loading = signal(false);
  error = signal('');

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
  ) {}

  submit() {
    if (!this.phone || !this.password) {
      this.error.set('Completa teléfono y contraseña');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.phone, this.password).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success('Bienvenida', `Hola ${res.name} 🎟️`);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err?.error?.detail || 'Error de acceso';
        this.error.set(msg);
        this.toast.error('No se pudo entrar', msg);
      },
    });
  }
}
