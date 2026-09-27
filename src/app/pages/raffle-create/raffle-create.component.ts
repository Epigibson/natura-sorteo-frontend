import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-raffle-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/dashboard" class="back">← Volver</a>
      <h1>Crear nuevo sorteo</h1>
      <p class="sub">
        Se generarán automáticamente {{ count() }} boletos, uno por cada monto de
        \${{ priceMin }} a \${{ priceMax }}, cada uno con código único.
      </p>

      <div class="form">
        <label>Título del sorteo</label>
        <input [(ngModel)]="title" placeholder="Rifa Natura Febrero" />

        <label>Premio</label>
        <input [(ngModel)]="prize" placeholder="Set Krono K completo" />

        <label>Valor del premio (MXN)</label>
        <input type="number" [(ngModel)]="prizeValue" min="0" />

        <div class="row">
          <div>
            <label>Precio mínimo del boleto</label>
            <input
              type="number"
              [(ngModel)]="priceMin"
              min="1"
              (ngModelChange)="recalc()"
            />
          </div>
          <div>
            <label>Precio máximo del boleto</label>
            <input
              type="number"
              [(ngModel)]="priceMax"
              min="1"
              (ngModelChange)="recalc()"
            />
          </div>
        </div>

        <div class="preview">
          <div class="preview-item">
            <span class="n">{{ count() }}</span>
            <span class="t">boletos</span>
          </div>
          <div class="preview-item">
            <span class="n">\${{ expected() }}</span>
            <span class="t">recaudación si se venden todos</span>
          </div>
          <div class="preview-item">
            <span class="n">\${{ margin() }}</span>
            <span class="t">utilidad estimada</span>
          </div>
        </div>

        <label>Fecha del sorteo (opcional)</label>
        <input type="date" [(ngModel)]="drawDate" />

        <label>Notas (opcional)</label>
        <textarea [(ngModel)]="notes" rows="3" placeholder="Instrucciones internas…"></textarea>

        @if (error()) {
          <div class="error">{{ error() }}</div>
        }

        <button class="btn-primary" (click)="submit()" [disabled]="loading()">
          {{ loading() ? 'Creando…' : 'Crear sorteo y generar boletos' }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        max-width: 640px;
        margin: 0 auto;
        padding: 28px 20px 60px;
      }
      .back {
        color: #1b5e20;
        font-weight: 600;
        text-decoration: none;
        font-size: 14px;
      }
      h1 {
        margin: 12px 0 6px;
        font-size: 26px;
        color: #1f2937;
      }
      .sub {
        color: #6b7280;
        font-size: 14px;
        margin-bottom: 24px;
        line-height: 1.5;
      }
      .form {
        background: #fff;
        border: 1.5px solid #e5e7eb;
        border-radius: 18px;
        padding: 24px;
      }
      label {
        display: block;
        font-size: 12px;
        font-weight: 700;
        color: #1b5e20;
        text-transform: uppercase;
        letter-spacing: 0.4px;
        margin: 16px 0 6px;
      }
      input,
      textarea {
        width: 100%;
        padding: 12px 14px;
        border: 2px solid #c8e6c9;
        border-radius: 12px;
        font-size: 15px;
        outline: none;
        box-sizing: border-box;
        font-family: inherit;
      }
      input:focus,
      textarea:focus {
        border-color: #4caf50;
      }
      .row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .preview {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin: 20px 0;
        padding: 16px;
        background: #e8f5e9;
        border-radius: 14px;
      }
      .preview-item {
        text-align: center;
      }
      .preview-item .n {
        display: block;
        font-size: 22px;
        font-weight: 900;
        color: #1b5e20;
      }
      .preview-item .t {
        font-size: 11px;
        color: #4b6b3c;
        font-weight: 600;
      }
      .btn-primary {
        width: 100%;
        margin-top: 20px;
        padding: 15px;
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
      }
      .error {
        margin-top: 14px;
        padding: 12px;
        background: #ffebee;
        color: #c62828;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 600;
      }
    `,
  ],
})
export class RaffleCreateComponent {
  title = 'Rifa Natura Febrero';
  prize = 'Set Krono K completo';
  prizeValue = 450;
  priceMin = 30;
  priceMax = 50;
  drawDate = '';
  notes = '';
  loading = signal(false);
  error = signal('');

  constructor(
    private api: ApiService,
    private router: Router,
    private toast: ToastService,
  ) {}

  count() {
    return Math.max(0, this.priceMax - this.priceMin + 1);
  }

  expected() {
    const n = this.count();
    return ((this.priceMin + this.priceMax) * n) / 2;
  }

  margin() {
    return Math.max(0, this.expected() - this.prizeValue);
  }

  recalc() {
    // fuerza re-render de la preview
  }

  submit() {
    if (!this.title || !this.prize) {
      this.error.set('Completa título y premio');
      return;
    }
    if (this.priceMax < this.priceMin) {
      this.error.set('El precio máximo debe ser mayor o igual al mínimo');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.api
      .createRaffle({
        title: this.title,
        prize: this.prize,
        prize_value: this.prizeValue,
        price_min: this.priceMin,
        price_max: this.priceMax,
        draw_date: this.drawDate || undefined,
        notes: this.notes || undefined,
      })
      .subscribe({
        next: (r) => {
          this.loading.set(false);
          this.toast.success(
            '¡Sorteo creado!',
            `${r.ticket_count} boletos generados de $${r.price_min} a $${r.price_max}`,
          );
          this.router.navigate(['/sorteos', r.id]);
        },
        error: (err) => {
          this.loading.set(false);
          const msg =
            typeof err?.error?.detail === 'string'
              ? err.error.detail
              : 'Error al crear el sorteo';
          this.error.set(msg);
          this.toast.error('No se pudo crear', msg);
        },
      });
  }
}
