import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/dashboard" class="back">← Dashboard</a>
      <h1>⚙️ Configuración</h1>
      <p class="sub">Políticas globales de todos tus sorteos</p>

      @if (loading()) {
        <div class="loading">Cargando…</div>
      } @else if (!isAdmin()) {
        <div class="empty">Esta sección es solo para administradores.</div>
      } @else {
        <div class="card">
          <div class="c-head">
            <span class="c-icon" aria-hidden="true">⏱️</span>
            <div>
              <h2>Auto-liberación de boletos</h2>
              <p class="c-desc">
                Los boletos que nadie paga después del plazo vuelven al tablero para que
                otro participante pueda tomarlos. Solo aplica a sorteos abiertos: nunca
                toca boletos pagados ni sorteos ya cerrados.
              </p>
            </div>
          </div>

          <label class="switch">
            <input
              type="checkbox"
              [checked]="!enabled()"
              (change)="onToggle($event)"
            />
            <span class="switch-track" aria-hidden="true"></span>
            <span class="switch-label">No liberar boletos automáticamente</span>
          </label>

          @if (enabled()) {
            <div class="field">
              <label for="hours">Plazo sin pagar</label>
              <div class="hours-row">
                <input
                  id="hours"
                  type="number"
                  min="1"
                  max="8760"
                  step="1"
                  [value]="hours()"
                  (input)="onHours($event)"
                />
                <span class="unit">horas</span>
              </div>
              <p class="hint">
                Equivale a <strong>{{ hoursLabel() }}</strong>. Al vencer ese plazo el boleto
                se libera solo y quien lo tenía pierde el lugar.
              </p>
            </div>
          } @else {
            <p class="hint hint-off">
              Los boletos quedarán reservados indefinidamente hasta que los liberes tú a mano
              desde cada sorteo.
            </p>
          }

          <div class="actions">
            <button class="save" (click)="save()" [disabled]="saving() || !dirty()">
              {{ saving() ? 'Guardando…' : 'Guardar cambios' }}
            </button>
            @if (saved()) {
              <span class="ok">✓ Guardado</span>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 760px; margin: 0 auto; padding: 28px 20px 60px; }
    .back { color: #1b5e20; font-weight: 600; text-decoration: none; font-size: 14px; }
    h1 { margin: 12px 0 4px; font-size: 26px; color: #1f2937; }
    .sub { color: #6b7280; margin-bottom: 22px; }
    .loading, .empty { text-align: center; padding: 50px; color: #6b7280; }

    .card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .c-head { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 20px; }
    .c-icon { font-size: 26px; line-height: 1; }
    h2 { margin: 0 0 6px; font-size: 17px; color: #111827; }
    .c-desc { margin: 0; font-size: 13.5px; line-height: 1.6; color: #6b7280; }

    .switch {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      padding: 14px 16px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      user-select: none;
    }
    .switch input { position: absolute; opacity: 0; width: 0; height: 0; }
    .switch-track {
      position: relative;
      flex: 0 0 auto;
      width: 42px;
      height: 24px;
      border-radius: 999px;
      background: #d1d5db;
      transition: background 0.2s;
    }
    .switch-track::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      transition: transform 0.2s;
    }
    .switch input:checked + .switch-track { background: #c9a227; }
    .switch input:checked + .switch-track::after { transform: translateX(18px); }
    .switch input:focus-visible + .switch-track { outline: 2px solid #1b5e20; outline-offset: 2px; }
    .switch-label { font-size: 14.5px; font-weight: 600; color: #111827; }

    .field { margin-top: 18px; }
    .field label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; }
    .hours-row { display: flex; align-items: center; gap: 10px; }
    .hours-row input {
      width: 130px;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      font-size: 15px;
      font-family: inherit;
      color: #111827;
    }
    .hours-row input:focus { outline: 2px solid #1b5e20; outline-offset: 1px; border-color: transparent; }
    .unit { font-size: 14px; color: #6b7280; }
    .hint { margin: 10px 0 0; font-size: 12.5px; line-height: 1.6; color: #6b7280; }
    .hint-off { margin-top: 16px; padding: 12px 14px; background: #fef3c7; border-radius: 10px; color: #92400e; }

    .actions { display: flex; align-items: center; gap: 14px; margin-top: 22px; }
    .save {
      padding: 11px 24px;
      border: none;
      border-radius: 10px;
      background: linear-gradient(135deg, #1b5e20, #2e7d32);
      color: #fff;
      font-size: 14.5px;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .save:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(27, 94, 32, 0.28); }
    .save:disabled { opacity: 0.5; cursor: not-allowed; }
    .ok { font-size: 13.5px; color: #15803d; font-weight: 600; }
  `],
})
export class SettingsComponent implements OnInit {
  loading = signal(true);
  enabled = signal(true);
  hours = signal(48);
  saving = signal(false);
  saved = signal(false);

  private initialEnabled = signal(true);
  private initialHours = signal(48);

  isAdmin = signal(false);

  dirty = computed(
    () =>
      this.enabled() !== this.initialEnabled() ||
      this.hours() !== this.initialHours(),
  );

  hoursLabel = computed(() => {
    const h = this.hours();
    if (h < 24) return `${h} horas`;
    const d = h / 24;
    return Number.isInteger(d) ? `${d} ${d === 1 ? 'día' : 'días'}` : `${h} horas`;
  });

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.isAdmin.set(this.auth.user()?.role === 'admin');
    if (!this.isAdmin()) {
      this.loading.set(false);
      return;
    }
    this.api.getSettings().subscribe({
      next: (s) => {
        this.enabled.set(s.auto_release_enabled);
        this.hours.set(s.auto_release_hours);
        this.initialEnabled.set(s.auto_release_enabled);
        this.initialHours.set(s.auto_release_hours);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('No se pudo cargar la configuración');
      },
    });
  }

  onToggle(e: Event): void {
    this.enabled.set(!(e.target as HTMLInputElement).checked);
    this.saved.set(false);
  }

  onHours(e: Event): void {
    const raw = Number((e.target as HTMLInputElement).value);
    const v = Number.isFinite(raw) ? Math.round(raw) : 0;
    this.hours.set(Math.min(8760, Math.max(1, v)));
    this.saved.set(false);
  }

  save(): void {
    if (!this.dirty() || this.saving()) return;
    this.saving.set(true);
    this.api
      .updateSettings({
        auto_release_enabled: this.enabled(),
        // Se guarda el plazo aunque esté apagado: si lo reactivas no pierdes lo que habías puesto
        auto_release_hours: this.hours(),
      })
      .subscribe({
        next: (s) => {
          this.enabled.set(s.auto_release_enabled);
          this.hours.set(s.auto_release_hours);
          this.initialEnabled.set(s.auto_release_enabled);
          this.initialHours.set(s.auto_release_hours);
          this.saving.set(false);
          this.saved.set(true);
          this.toast.success('Configuración guardada', 'Se aplica a todos tus sorteos abiertos');
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err?.error?.detail || 'No se pudo guardar');
        },
      });
  }
}
