import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './api.service';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (open()) {
      <div class="overlay" (click)="close()">
        <div class="dialog" (click)="$event.stopPropagation()">
          <div class="d-icon">🔒</div>
          <h3>Cambiar contraseña</h3>
          <p class="msg">Tu contraseña actual es la de desarrollo. Es importante cambiarla.</p>

          <label>Contraseña actual</label>
          <input
            type="password"
            [(ngModel)]="current"
            placeholder="••••••••"
            autocomplete="current-password"
          />

          <label>Nueva contraseña (mínimo 8 caracteres)</label>
          <input
            type="password"
            [(ngModel)]="next"
            placeholder="••••••••"
            autocomplete="new-password"
          />

          <label>Confirmar nueva contraseña</label>
          <input
            type="password"
            [(ngModel)]="confirm"
            placeholder="••••••••"
            autocomplete="new-password"
            (keyup.enter)="submit()"
          />

          @if (error()) {
            <div class="error">{{ error() }}</div>
          }

          <div class="actions">
            <button class="btn-ghost" (click)="close()">Cancelar</button>
            <button class="btn-solid" (click)="submit()" [disabled]="loading()">
              {{ loading() ? 'Guardando…' : 'Guardar contraseña' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.52);
        backdrop-filter: blur(3px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9000;
        padding: 18px;
        animation: fadeIn 0.18s ease;
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .dialog {
        background: #faf7f0;
        border-radius: 20px;
        padding: 28px 26px 24px;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
        animation: popIn 0.22s cubic-bezier(0.21, 1.02, 0.73, 1);
      }
      @keyframes popIn {
        from { opacity: 0; transform: scale(0.92) translateY(12px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }
      .d-icon {
        font-size: 36px;
        text-align: center;
        margin-bottom: 8px;
      }
      h3 {
        text-align: center;
        margin: 0 0 8px;
        font-size: 18px;
        color: #1f2937;
      }
      .msg {
        text-align: center;
        color: #6b7280;
        font-size: 13px;
        line-height: 1.5;
        margin-bottom: 18px;
      }
      label {
        display: block;
        font-size: 11px;
        font-weight: 700;
        color: #1b5e20;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        margin: 14px 0 5px;
      }
      input {
        width: 100%;
        padding: 12px 14px;
        border: 2px solid #c8e6c9;
        border-radius: 12px;
        font-size: 15px;
        outline: none;
        box-sizing: border-box;
      }
      input:focus {
        border-color: #4caf50;
        box-shadow: 0 0 0 4px rgba(76, 175, 80, 0.16);
      }
      .error {
        margin-top: 12px;
        padding: 10px;
        background: #ffebee;
        color: #c62828;
        border-radius: 9px;
        font-size: 13px;
        font-weight: 600;
      }
      .actions {
        display: flex;
        gap: 10px;
        margin-top: 22px;
      }
      .btn-ghost {
        flex: 1;
        padding: 12px;
        border-radius: 12px;
        border: 2px solid #d1d5db;
        background: transparent;
        color: #6b7280;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
      }
      .btn-solid {
        flex: 1;
        padding: 12px;
        border-radius: 12px;
        border: none;
        background: linear-gradient(135deg, #1b5e20, #4caf50);
        color: #fff;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
      }
      .btn-solid:disabled {
        opacity: 0.5;
      }
      @media (max-width: 480px) {
        .dialog { padding: 22px 16px 18px; }
        .d-icon { font-size: 28px; }
        h3 { font-size: 16px; }
        .actions { flex-direction: column-reverse; gap: 8px; }
      }
    `,
  ],
})
export class ChangePasswordComponent {
  open = signal(false);
  current = '';
  next = '';
  confirm = '';
  error = signal('');
  loading = signal(false);

  constructor(
    private api: ApiService,
    private toast: ToastService,
  ) {}

  show() {
    this.open.set(true);
    this.current = '';
    this.next = '';
    this.confirm = '';
    this.error.set('');
  }

  close() {
    this.open.set(false);
  }

  submit() {
    if (!this.current || !this.next || !this.confirm) {
      this.error.set('Completa todos los campos');
      return;
    }
    if (this.next.length < 8) {
      this.error.set('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    if (this.next !== this.confirm) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.api.changePassword(this.current, this.next).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Contraseña actualizada', 'Tu contraseña se cambió correctamente ✅');
        this.close();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.detail || 'No se pudo cambiar la contraseña');
      },
    });
  }
}
